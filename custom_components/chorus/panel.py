"""Chorus sidebar panel: serves the frontend and a websocket API for live state.

The panel is a custom element (`chorus-panel`) served as a static module. It reads
the coordinator's live bond graph over a websocket command rather than guessing
topology, so what it draws always matches the speakers.
"""
from __future__ import annotations

import logging
import os

from homeassistant.components import frontend, websocket_api
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant, callback

from .areas import all_area_names, speaker_area_map
from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

PANEL_URL_PATH = "chorus"
STATIC_URL = "/chorus_static"
PANEL_ELEMENT = "chorus-panel"
# Bump to bust the browser cache when the panel JS changes.
_CACHE_BUST = "0.1.0-1"
_FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "frontend")
_UI = f"{DOMAIN}_ui"  # scratch namespace kept OUT of hass.data[DOMAIN] (coordinators)


async def async_register_panel(hass: HomeAssistant) -> None:
    """Register the static assets, the websocket command, and the sidebar panel."""
    ui = hass.data.setdefault(_UI, {})

    # Static paths can't be unregistered, so do it once per HA run.
    if not ui.get("static"):
        await hass.http.async_register_static_paths(
            [StaticPathConfig(STATIC_URL, _FRONTEND_DIR, False)]
        )
        ui["static"] = True

    if not ui.get("ws"):
        websocket_api.async_register_command(hass, ws_bond_graph)
        websocket_api.async_register_command(hass, ws_refresh)
        ui["ws"] = True

    frontend.async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title="Chorus",
        sidebar_icon="mdi:speaker-multiple",
        frontend_url_path=PANEL_URL_PATH,
        require_admin=False,
        update=True,  # overwrite instead of raising if it's already registered
        config={
            "_panel_custom": {
                "name": PANEL_ELEMENT,
                "module_url": f"{STATIC_URL}/{PANEL_ELEMENT}.js?v={_CACHE_BUST}",
                "embed_iframe": False,
                "trust_external": False,
            }
        },
    )
    ui["panel"] = True


@callback
def async_unregister_panel(hass: HomeAssistant) -> None:
    """Remove the sidebar panel (static assets + ws command persist for the run)."""
    ui = hass.data.get(_UI, {})
    if ui.get("panel"):
        frontend.async_remove_panel(hass, PANEL_URL_PATH)
        ui["panel"] = False


def _graph_payload(hass: HomeAssistant, coordinator) -> dict:
    """Build the {units, players, areas} payload from the coordinator's current state.

    Annotates shallow copies with each speaker's HA Area — never mutates the
    coordinator's live dicts.
    """
    if coordinator is None:
        return {"units": [], "players": [], "areas": []}
    units = coordinator.bond_graph
    players = list(coordinator.players.values())
    uids = {p["uid"] for p in players}
    uids.update(m["uid"] for u in units for m in u["members"])
    area_of = speaker_area_map(hass, list(uids))
    players_out = [{**p, "area": area_of.get(p["uid"])} for p in players]
    units_out = [
        {**u, "members": [{**m, "area": area_of.get(m["uid"])} for m in u["members"]]}
        for u in units
    ]
    return {"units": units_out, "players": players_out, "areas": all_area_names(hass)}


@websocket_api.websocket_command({"type": "chorus/bond_graph"})
@callback
def ws_bond_graph(hass: HomeAssistant, connection, msg) -> None:
    """Return the live bonded units + areas from the coordinator's current cache."""
    connection.send_result(msg["id"], _graph_payload(hass, _first_coordinator(hass)))


@websocket_api.websocket_command({"type": "chorus/refresh"})
@websocket_api.async_response
async def ws_refresh(hass: HomeAssistant, connection, msg) -> None:
    """Force a fresh Sonos re-discovery, then return the settled graph.

    Used after Apply: the plain bond_graph read returns the cached graph, which may
    still be mid-cycle right after a bonding change — this re-scans first.
    """
    coordinator = _first_coordinator(hass)
    if coordinator is not None:
        await coordinator.async_request_refresh()
    connection.send_result(msg["id"], _graph_payload(hass, coordinator))


def _first_coordinator(hass: HomeAssistant):
    for value in hass.data.get(DOMAIN, {}).values():
        if hasattr(value, "bond_graph"):
            return value
    return None
