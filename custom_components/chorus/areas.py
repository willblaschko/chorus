"""Resolve each Sonos speaker's Home Assistant Area from the HA registries.

Area membership lives in HA's registries (entity/device/area), not in the Sonos
data the coordinator collects. The Sonos integration registers one `media_player`
entity per speaker whose `unique_id` is the speaker UID, so we bridge:

    speaker uid -> sonos media_player entity -> area_id (entity, then device) -> name

These registries are in-memory, so every lookup here is non-blocking and safe to
call directly on the event loop (no executor).
"""
from __future__ import annotations

from homeassistant.core import HomeAssistant
from homeassistant.helpers import area_registry, device_registry, entity_registry


def _sonos_media_player_entries(hass: HomeAssistant) -> dict[str, object]:
    """Build {unique_id: entry} for all Sonos media_player entities, once.

    Keyed by unique_id so per-uid resolution is a dict lookup, not a rescan.
    """
    ent_reg = entity_registry.async_get(hass)
    by_unique: dict[str, object] = {}
    for entry in ent_reg.entities.values():
        if entry.platform != "sonos":
            continue
        # Domain guard: the Sonos integration also registers switches/sensors/etc.
        if not entry.entity_id.startswith("media_player."):
            continue
        if entry.unique_id:
            by_unique[entry.unique_id] = entry
    return by_unique


def _resolve_area_id(
    hass: HomeAssistant,
    entry: object,
    dev_reg: device_registry.DeviceRegistry,
) -> str | None:
    """Prefer the entity's own area, else fall back to its device's area."""
    area_id = getattr(entry, "area_id", None)
    if area_id:
        return area_id
    device_id = getattr(entry, "device_id", None)
    if not device_id:
        return None
    device = dev_reg.async_get(device_id)
    if device is None:
        return None
    return getattr(device, "area_id", None)


def speaker_area_map(hass: HomeAssistant, uids: list[str]) -> dict[str, str | None]:
    """Map each Sonos speaker UID -> its HA Area name (or None if unknown)."""
    entries = _sonos_media_player_entries(hass)
    dev_reg = device_registry.async_get(hass)
    area_reg = area_registry.async_get(hass)

    result: dict[str, str | None] = {}
    for uid in uids:
        entry = entries.get(uid)
        if entry is None:
            # Some integrations suffix the UID; accept a unique_id that contains it.
            entry = next(
                (e for k, e in entries.items() if uid and uid in k),
                None,
            )
        if entry is None:
            result[uid] = None
            continue

        area_id = _resolve_area_id(hass, entry, dev_reg)
        if not area_id:
            result[uid] = None
            continue

        area = area_reg.async_get_area(area_id)
        result[uid] = area.name if area is not None else None
    return result


def all_area_names(hass: HomeAssistant) -> list[str]:
    """All HA Area names, sorted (so the UI can offer empty areas as move targets)."""
    area_reg = area_registry.async_get(hass)
    return sorted(area.name for area in area_reg.async_list_areas())


def set_speaker_area(hass: HomeAssistant, uid: str, area_name: str) -> None:
    """Reassign a Sonos speaker's device to the HA Area named `area_name`, creating
    the area if it doesn't exist. No-op if the speaker's device can't be found.
    Registry ops are event-loop-safe (no executor)."""
    dev_reg = device_registry.async_get(hass)
    area_reg = area_registry.async_get(hass)
    entries = _sonos_media_player_entries(hass)
    entry = entries.get(uid) or next(
        (e for k, e in entries.items() if uid and uid in k), None
    )
    device_id = getattr(entry, "device_id", None)
    if not device_id:
        return
    area = area_reg.async_get_area_by_name(area_name)
    if area is None:
        area = area_reg.async_create(area_name)
    dev_reg.async_update_device(device_id, area_id=area.id)
