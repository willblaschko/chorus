"""Coordinator: keeps the Sonos topology (players + bond graph) fresh ON DEMAND.

There is no background poll: nothing runs while nobody is looking. The panel drives
refreshes while it's open (`chorus/refresh`), and services refresh first if the data is
older than SERVICE_MAX_AGE. Every refresh is one cheap ZoneGroupState read from a known
speaker; the 5s multicast discovery runs only when no known speaker answers (startup,
or the network changed under us).
"""
from __future__ import annotations

import asyncio
import logging
import time

from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .const import DOMAIN
from .sonos import SonosBackend

_LOGGER = logging.getLogger(__name__)
SERVICE_MAX_AGE = 60.0  # seconds; a service call older than this re-reads the topology first


class ChorusCoordinator(DataUpdateCoordinator):
    """Keeps a live inventory of Sonos players on the LAN."""

    def __init__(self, hass: HomeAssistant, backend: SonosBackend) -> None:
        # update_interval=None: no background polling (see module docstring).
        super().__init__(hass, _LOGGER, name=DOMAIN, update_interval=None)
        self.backend = backend
        self.players: dict[str, dict] = {}  # uid -> {uid, ip, name, model}
        self.snapshots: dict[str, dict] = {}  # soundbar uid -> {map, sat_ips}
        self.bond_graph: list = []  # live units: standalones / pairs / home theaters
        self.models: dict[str, str] = {}  # uid -> model (fetched once per speaker)
        self._lock = asyncio.Lock()
        self._fresh_at: float | None = None  # monotonic time of the last successful read

    async def _async_update_data(self) -> dict:
        # Only the first refresh at setup comes through here (no interval). Route it
        # through the same single-flight read as everything else.
        try:
            await self.async_refresh_now()
        except Exception as err:  # noqa: BLE001
            raise UpdateFailed(f"Sonos topology read failed: {err}") from err
        return self.players

    async def async_refresh_now(self) -> None:
        """Read the topology now, NOT via HA's debounced async_request_refresh (which
        silently returns cached data for 10s after any refresh). Concurrent callers share
        one in-flight read rather than stacking reads. Raises if the read fails; the
        previous players/graph are kept."""
        if self._lock.locked():
            async with self._lock:  # a read is in flight — its result is fresh enough
                return
        async with self._lock:
            players, graph = await self.hass.async_add_executor_job(self._read_topology)
            self.players, self.bond_graph = players, graph
            self._fresh_at = time.monotonic()

    async def async_ensure_fresh(self, max_age: float = SERVICE_MAX_AGE) -> None:
        """Refresh if the data is older than `max_age` seconds. A failed refresh is logged
        and the cached data used — the service then fails (or not) on its own merits."""
        if self._fresh_at is not None and time.monotonic() - self._fresh_at < max_age:
            return
        try:
            await self.async_refresh_now()
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning("Topology refresh failed, using cached data: %s", err)

    # -- blocking (executor) ------------------------------------------------
    def _read_topology(self) -> tuple[dict, list]:
        """One ZGS read -> (players, model-enriched bond graph with zone volumes)."""
        graph = self.backend.parse_bond_graph(self._zone_group_state())
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
        return self.backend.players_from_graph(graph), graph

    def _zone_group_state(self) -> str:
        """ZGS from the first known speaker that answers (ZGS is household-wide, so any
        one will do); fall back to multicast discovery only if none does."""
        for player in list(self.players.values()):
            try:
                return self.backend.zone_group_state(player["ip"])
            except Exception:  # noqa: BLE001 — try the next known speaker
                continue
        ip = self._discover_seed_ip()
        if not ip:
            raise UpdateFailed("No Sonos speakers found on the network")
        return self.backend.zone_group_state(ip)

    def _discover_seed_ip(self) -> str | None:
        import soco  # imported lazily; it's a blocking dependency

        _LOGGER.debug("No known speaker answered; running Sonos discovery")
        zone = next(iter(soco.discover(timeout=5) or set()), None)
        return zone.ip_address if zone else None

    def _model_for(self, uid: str, ip: str | None) -> str:
        """Model for a member, fetched once per speaker and cached."""
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
