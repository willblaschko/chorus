"""Chorus — configure Sonos bonding (stereo pairs, home-theater surrounds) from HA.

v0.1 is services-first: it exposes the validated bonding operations as Home
Assistant services. The drag-and-drop panel (v0.2) drives these same services.
"""
from __future__ import annotations

import logging

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError
import homeassistant.helpers.config_validation as cv

from .const import (
    CHANNELS,
    DOMAIN,
    ERR_PRIMARY_NOT_SOUNDBAR,
    SERVICE_CREATE_STEREO_PAIR,
    SERVICE_MOVE,
    SERVICE_REMOVE_HOME_THEATER,
    SERVICE_RESTORE,
    SERVICE_SEPARATE,
    SERVICE_SET_HOME_THEATER,
    SERVICE_SNAPSHOT,
    can_pair,
    can_surround,
    is_soundbar,
    is_sub,
)
from .coordinator import ChorusCoordinator
from .panel import async_register_panel, async_unregister_panel
from .sonos import SonosBackend, SonosSoapError

_LOGGER = logging.getLogger(__name__)

_ALL_SERVICES = (
    SERVICE_CREATE_STEREO_PAIR,
    SERVICE_SEPARATE,
    SERVICE_SET_HOME_THEATER,
    SERVICE_REMOVE_HOME_THEATER,
    SERVICE_MOVE,
    SERVICE_SNAPSHOT,
    SERVICE_RESTORE,
)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Chorus from a config entry."""
    coordinator = ChorusCoordinator(hass, SonosBackend())
    await coordinator.async_config_entry_first_refresh()
    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = coordinator
    _register_services(hass, coordinator)
    await async_register_panel(hass)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry and, if it's the last, its services + panel."""
    hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
    if not hass.data.get(DOMAIN):
        for service in _ALL_SERVICES:
            hass.services.async_remove(DOMAIN, service)
        async_unregister_panel(hass)
    return True


def _register_services(hass: HomeAssistant, coordinator: ChorusCoordinator) -> None:
    backend = coordinator.backend

    def resolve(name: str) -> dict:
        player = coordinator.by_name(name)
        if not player:
            raise HomeAssistantError(f"No Sonos speaker named '{name}' was found")
        return player

    async def run(fn, *args):
        try:
            return await hass.async_add_executor_job(fn, *args)
        except SonosSoapError as err:
            if err.code == ERR_PRIMARY_NOT_SOUNDBAR:
                raise HomeAssistantError(
                    "That operation must target a soundbar (Arc, Beam, Ray)."
                ) from err
            raise HomeAssistantError(
                f"Sonos rejected the change (code {err.code or '?'}). "
                "It may not have settled — try again in a moment."
            ) from err

    # --- stereo pair ------------------------------------------------------
    async def create_stereo_pair(call: ServiceCall) -> None:
        left, right = resolve(call.data["left"]), resolve(call.data["right"])
        for p in (left, right):
            if not can_pair(p["model"]):
                raise HomeAssistantError(f"{p['name']} ({p['model']}) can't be stereo-paired")
        await run(backend.create_stereo_pair, left["ip"], left["uid"], right["uid"])
        await coordinator.async_request_refresh()

    async def separate(call: ServiceCall) -> None:
        left, right = resolve(call.data["left"]), resolve(call.data["right"])
        await run(backend.separate_stereo_pair, left["ip"], left["uid"], right["uid"])
        await coordinator.async_request_refresh()

    # --- home theater -----------------------------------------------------
    async def set_home_theater(call: ServiceCall) -> None:
        bar = resolve(call.data["soundbar"])
        if not is_soundbar(bar["model"]):
            raise HomeAssistantError(f"{bar['name']} ({bar['model']}) is not a soundbar")
        # Snapshot first so a mid-sequence failure is recoverable.
        coordinator.snapshots[bar["uid"]] = {
            "map": await hass.async_add_executor_job(backend.snapshot_ht, bar["ip"], bar["uid"]),
        }
        for channel in CHANNELS:
            name = call.data.get(channel.lower())
            if not name:
                continue
            sat = resolve(name)
            ok = is_sub(sat["model"]) if channel == "SW" else can_surround(sat["model"])
            if not ok:
                raise HomeAssistantError(
                    f"{sat['name']} ({sat['model']}) can't be used as {channel}"
                )
            # One satellite per call (batching -> 800); poll+retry inside.
            await run(
                backend.add_ht_satellite, bar["ip"], bar["uid"], sat["uid"], channel, sat["ip"]
            )
        await coordinator.async_request_refresh()

    async def remove_home_theater(call: ServiceCall) -> None:
        bar = resolve(call.data["soundbar"])
        channel = (call.data.get("channel") or "").upper()
        sat_name = call.data.get("satellite")
        # Read the live map first — bonded satellites are invisible and share the
        # soundbar's zone name, so they can only be addressed by channel or UID,
        # never by a friendly name.
        current = await hass.async_add_executor_job(backend.snapshot_ht, bar["ip"], bar["uid"])
        if channel:
            uid = backend.resolve_channel_to_uid(current, bar["uid"], channel)
            if not uid:
                raise HomeAssistantError(f"{bar['name']} has no {channel} satellite")
            await run(backend.remove_ht_satellite, bar["ip"], uid)
        elif sat_name:  # a still-standalone speaker referenced by name
            sat = resolve(sat_name)
            await run(backend.remove_ht_satellite, bar["ip"], sat["uid"])
        else:  # dissolve: remove every satellite currently on the bar (by UID)
            for uid in backend.satellites_to_remove(current, bar["uid"]):
                await run(backend.remove_ht_satellite, bar["ip"], uid)
        await coordinator.async_request_refresh()

    # --- move (rename the zone == move to another room) -------------------
    async def move(call: ServiceCall) -> None:
        speaker = resolve(call.data["speaker"])
        await run(backend.set_zone_name, speaker["ip"], call.data["name"])
        await coordinator.async_request_refresh()

    # --- snapshot / restore of a soundbar's HT layout ---------------------
    async def snapshot(call: ServiceCall) -> None:
        bar = resolve(call.data["soundbar"])
        ht_map = await hass.async_add_executor_job(backend.snapshot_ht, bar["ip"], bar["uid"])
        coordinator.snapshots[bar["uid"]] = {"map": ht_map}
        _LOGGER.info("Snapshotted %s home theater: %s", bar["name"], ht_map)

    async def restore(call: ServiceCall) -> None:
        bar = resolve(call.data["soundbar"])
        snap = coordinator.snapshots.get(bar["uid"])
        if not snap:
            raise HomeAssistantError(f"No saved layout for {bar['name']}")
        sat_ips = {p["uid"]: p["ip"] for p in coordinator.players.values()}
        await run(backend.restore_ht, bar["ip"], bar["uid"], snap["map"], sat_ips)
        await coordinator.async_request_refresh()

    name = vol.Schema(cv.string)
    hass.services.async_register(
        DOMAIN, SERVICE_CREATE_STEREO_PAIR, create_stereo_pair,
        schema=vol.Schema({vol.Required("left"): name, vol.Required("right"): name}),
    )
    hass.services.async_register(
        DOMAIN, SERVICE_SEPARATE, separate,
        schema=vol.Schema({vol.Required("left"): name, vol.Required("right"): name}),
    )
    hass.services.async_register(
        DOMAIN, SERVICE_SET_HOME_THEATER, set_home_theater,
        schema=vol.Schema({
            vol.Required("soundbar"): name,
            vol.Optional("lf"): name, vol.Optional("rf"): name,
            vol.Optional("lr"): name, vol.Optional("rr"): name,
            vol.Optional("sw"): name,
        }),
    )
    hass.services.async_register(
        DOMAIN, SERVICE_REMOVE_HOME_THEATER, remove_home_theater,
        schema=vol.Schema({
            vol.Required("soundbar"): name,
            vol.Optional("channel"): name,
            vol.Optional("satellite"): name,
        }),
    )
    hass.services.async_register(
        DOMAIN, SERVICE_MOVE, move,
        schema=vol.Schema({vol.Required("speaker"): name, vol.Required("name"): name}),
    )
    hass.services.async_register(
        DOMAIN, SERVICE_SNAPSHOT, snapshot,
        schema=vol.Schema({vol.Required("soundbar"): name}),
    )
    hass.services.async_register(
        DOMAIN, SERVICE_RESTORE, restore,
        schema=vol.Schema({vol.Required("soundbar"): name}),
    )
