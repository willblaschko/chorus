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
        self.bond_graph: list = []  # live units: standalones / pairs / home theaters
        self.models: dict[str, str] = {}  # uid -> model (cache for invisible members)

    async def _async_update_data(self) -> dict:
        try:
            self.players = await self.hass.async_add_executor_job(self._discover)
        except Exception as err:  # noqa: BLE001
            raise UpdateFailed(f"Sonos discovery failed: {err}") from err
        # The bond graph is secondary — a failure here must not blank the inventory.
        try:
            self.bond_graph = await self.hass.async_add_executor_job(self._build_graph)
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning("Bond-graph build failed: %s", err)
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

    def _build_graph(self) -> list:
        """Read ZoneGroupState and parse it into bonded units, model-enriched."""
        if not self.players:
            return []
        ip = next(iter(self.players.values()))["ip"]  # ZGS is global; any player works
        graph = self.backend.parse_bond_graph(self.backend.zone_group_state(ip))
        for unit in graph:
            for member in unit["members"]:
                member["model"] = self._model_for(member["uid"], member.get("ip"))
            # The zone's volume, read from its coordinator (the visible/primary member).
            primary = next((m for m in unit["members"] if m.get("is_primary")), None) or (
                unit["members"][0] if unit["members"] else None
            )
            unit["volume"] = None
            if primary and primary.get("ip"):
                try:
                    unit["volume"] = self.backend.get_volume(primary["ip"])
                except Exception:  # noqa: BLE001 — volume is non-critical
                    pass
        return graph

    def _model_for(self, uid: str, ip: str | None) -> str:
        """Model for a member: discovery for visible players, else fetch (cached)."""
        player = self.players.get(uid)
        if player and player.get("model"):
            return player["model"]
        if uid in self.models:
            return self.models[uid]
        model = self.backend.fetch_model(ip) if ip else ""
        if model:  # don't cache blanks — retry a failed fetch next refresh
            self.models[uid] = model
        return model

    def by_name(self, name: str) -> dict | None:
        for player in self.players.values():
            if player["name"] == name:
                return player
        return None
