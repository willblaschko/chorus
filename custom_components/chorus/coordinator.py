"""Coordinator: discovers Sonos players and exposes them by name/uid/ip."""
from __future__ import annotations

from datetime import timedelta
import logging

from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .const import DOMAIN
from .sonos import SonosBackend

_LOGGER = logging.getLogger(__name__)
SCAN_INTERVAL = timedelta(seconds=30)


class ChorusCoordinator(DataUpdateCoordinator):
    """Keeps a live inventory of Sonos players on the LAN."""

    def __init__(self, hass: HomeAssistant, backend: SonosBackend) -> None:
        super().__init__(hass, _LOGGER, name=DOMAIN, update_interval=SCAN_INTERVAL)
        self.backend = backend
        self.players: dict[str, dict] = {}  # uid -> {uid, ip, name, model}
        self.snapshots: dict[str, dict] = {}  # soundbar uid -> {map, sat_ips}

    async def _async_update_data(self) -> dict:
        try:
            self.players = await self.hass.async_add_executor_job(self._discover)
        except Exception as err:  # noqa: BLE001
            raise UpdateFailed(f"Sonos discovery failed: {err}") from err
        return self.players

    def _discover(self) -> dict:
        import soco  # imported lazily; it's a blocking dependency

        players: dict[str, dict] = {}
        for zone in soco.discover(timeout=5) or set():
            try:
                info = zone.get_speaker_info() or {}
            except Exception:  # noqa: BLE001 - a player may drop mid-scan
                info = {}
            players[zone.uid] = {
                "uid": zone.uid,
                "ip": zone.ip_address,
                "name": zone.player_name,
                "model": info.get("model_name", ""),
            }
        return players

    def by_name(self, name: str) -> dict | None:
        for player in self.players.values():
            if player["name"] == name:
                return player
        return None
