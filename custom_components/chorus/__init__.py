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
    SERVICE_ADD_PAIR_SUB,
    SERVICE_CREATE_STEREO_PAIR,
    SERVICE_MOVE,
    SERVICE_REMOVE_PAIR_SUB,
    SERVICE_RENAME,
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
from .areas import set_speaker_area
from .coordinator import ChorusCoordinator
from .panel import async_register_panel, async_unregister_panel
from .sonos import SonosBackend, SonosSoapError

_LOGGER = logging.getLogger(__name__)

_ALL_SERVICES = (
    SERVICE_CREATE_STEREO_PAIR,
    SERVICE_SEPARATE,
    SERVICE_ADD_PAIR_SUB,
    SERVICE_REMOVE_PAIR_SUB,
    SERVICE_SET_HOME_THEATER,
    SERVICE_REMOVE_HOME_THEATER,
    SERVICE_MOVE,
    SERVICE_RENAME,
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

    def resolve(id_or_name: str) -> dict:
        # Accept a RINCON UID (unambiguous — bonded satellites share the soundbar's
        # zone name, so names can't identify them) OR a friendly name (for the
        # Developer Tools / YAML path).
        player = coordinator.players.get(id_or_name) or coordinator.by_name(id_or_name)
        if not player:
            raise HomeAssistantError(f"No Sonos speaker '{id_or_name}' was found")
        return player

    def resolve_sat(ident: str, ip_map: dict) -> dict:
        # Locate a to-be-bonded satellite by UID even when discovery is stale — a
        # just-removed satellite isn't in soco.discover yet, so fall back to a fresh
        # ZGS UID->IP map and fetch its model directly. Blocking (fetch_model): call
        # from an executor.
        player = coordinator.players.get(ident)
        if player:
            return player
        ip = ip_map.get(ident)
        if ip:
            return {"uid": ident, "ip": ip, "name": ident, "model": backend.fetch_model(ip)}
        player = coordinator.by_name(ident)
        if player:
            return player
        raise HomeAssistantError(f"No Sonos speaker '{ident}' was found")

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
        left_id, right_id = call.data["left"], call.data["right"]
        # An L/R swap is separate -> re-create reversed: the re-created "left" is a
        # speaker that was JUST unbonded, so soco.discover hasn't caught up. Resolve
        # by UID against a FRESH topology (same fix as set_home_theater's resolve_sat),
        # seeding the ZGS query from whichever speaker the coordinator can already see.
        seed = (
            coordinator.players.get(left_id)
            or coordinator.players.get(right_id)
            or coordinator.by_name(left_id)
            or coordinator.by_name(right_id)
            or next(iter(coordinator.players.values()), None)
        )
        if not seed:
            raise HomeAssistantError("No Sonos speakers available to query")
        ip_map = await hass.async_add_executor_job(backend.speaker_ips, seed["ip"])
        left = await hass.async_add_executor_job(resolve_sat, left_id, ip_map)
        right = await hass.async_add_executor_job(resolve_sat, right_id, ip_map)
        for p in (left, right):
            if not can_pair(p["model"]):
                raise HomeAssistantError(f"{p['name']} ({p['model']}) can't be stereo-paired")
        await run(backend.create_stereo_pair, left["ip"], left["uid"], right["uid"])
        await coordinator.async_request_refresh()

    async def separate(call: ServiceCall) -> None:
        left = resolve(call.data["left"])
        # The right channel is an invisible member (shares the pair's name); take its
        # UID as-is, only resolving if a friendly name was passed.
        right = call.data["right"]
        right_uid = right if right.startswith("RINCON_") else resolve(right)["uid"]
        await run(backend.separate_stereo_pair, left["ip"], left["uid"], right_uid)
        await coordinator.async_request_refresh()

    async def add_pair_sub(call: ServiceCall) -> None:
        # `left` is the set's visible primary (a pair-left or a lone speaker); sub is a
        # UID; `right` is the pair's other half (omit it for a lone speaker + sub).
        primary = resolve(call.data["left"])
        await run(
            backend.add_pair_sub, primary["ip"], primary["uid"], call.data["sub"], call.data.get("right")
        )
        await coordinator.async_request_refresh()

    async def remove_pair_sub(call: ServiceCall) -> None:
        primary = resolve(call.data["left"])
        await run(
            backend.remove_pair_sub, primary["ip"], primary["uid"], call.data["sub"], call.data.get("right")
        )
        await coordinator.async_request_refresh()

    # --- home theater -----------------------------------------------------
    async def set_home_theater(call: ServiceCall) -> None:
        bar = resolve(call.data["soundbar"])
        if not is_soundbar(bar["model"]):
            raise HomeAssistantError(f"{bar['name']} ({bar['model']}) is not a soundbar")
        # Fresh topology so satellites resolve by UID even if discovery is stale.
        ip_map = await hass.async_add_executor_job(backend.speaker_ips, bar["ip"])
        # Snapshot first so a mid-sequence failure is recoverable.
        coordinator.snapshots[bar["uid"]] = {
            "map": await hass.async_add_executor_job(backend.snapshot_ht, bar["ip"], bar["uid"]),
        }
        for channel in CHANNELS:
            ident = call.data.get(channel.lower())
            if not ident:
                continue
            sat = await hass.async_add_executor_job(resolve_sat, ident, ip_map)
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
            await run(backend.remove_ht_satellite, bar["ip"], uid, bar["uid"])
        elif sat_name:  # a still-standalone speaker referenced by name
            sat = resolve(sat_name)
            await run(backend.remove_ht_satellite, bar["ip"], sat["uid"], bar["uid"])
        else:  # dissolve: remove every satellite currently on the bar (by UID)
            for uid in backend.satellites_to_remove(current, bar["uid"]):
                await run(backend.remove_ht_satellite, bar["ip"], uid, bar["uid"])
        await coordinator.async_request_refresh()

    # --- move (rename the zone == move to another room) -------------------
    async def move(call: ServiceCall) -> None:
        speaker = resolve(call.data["speaker"])
        name = call.data["name"]
        await run(backend.set_zone_name, speaker["ip"], name)
        # Move the HA Area too, so it re-groups in Chorus's view (not just Sonos).
        set_speaker_area(hass, speaker["uid"], name)
        await coordinator.async_request_refresh()

    async def rename(call: ServiceCall) -> None:
        # Rename the speaker's Sonos zone only — keep its room (no Area change).
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
    pair_sub_schema = vol.Schema(
        {vol.Required("left"): name, vol.Optional("right"): name, vol.Required("sub"): name}
    )
    hass.services.async_register(DOMAIN, SERVICE_ADD_PAIR_SUB, add_pair_sub, schema=pair_sub_schema)
    hass.services.async_register(
        DOMAIN, SERVICE_REMOVE_PAIR_SUB, remove_pair_sub, schema=pair_sub_schema
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
        DOMAIN, SERVICE_RENAME, rename,
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
