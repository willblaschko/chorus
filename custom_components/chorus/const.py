"""Constants and the device-capability registry for Chorus."""
from __future__ import annotations

import re

DOMAIN = "chorus"

# Home-theater channel slots (the soundbar itself is CC).
CHANNELS = ["LF", "RF", "LR", "RR", "SW"]
CHANNEL_CC = "CC"

# SOAP error codes observed on real hardware (see docs/SPIKE_FINDINGS.md).
ERR_PRIMARY_NOT_SOUNDBAR = "401"
ERR_NOT_SETTLED_OR_BAD = "800"

# Service names.
SERVICE_CREATE_STEREO_PAIR = "create_stereo_pair"
SERVICE_SEPARATE = "separate"
SERVICE_ADD_PAIR_SUB = "add_pair_sub"  # bond a sub to a stereo pair (ChannelMapSet SW,SW)
SERVICE_REMOVE_PAIR_SUB = "remove_pair_sub"
SERVICE_SET_HOME_THEATER = "set_home_theater"
SERVICE_REMOVE_HOME_THEATER = "remove_home_theater"
SERVICE_MOVE = "move"  # SetZoneAttributes rename + HA Area reassign == move rooms
SERVICE_RENAME = "rename"  # SetZoneAttributes rename only (keep the room)
SERVICE_SET_FIXED_OUTPUT = "set_fixed_output"  # line-out fixed volume (RenderingControl)
SERVICE_IDENTIFY = "identify"  # play a chime on one speaker (soco snapshot/restore)
SERVICE_SNAPSHOT = "snapshot"
SERVICE_RESTORE = "restore"

# --- Capability registry ---------------------------------------------------
# One row per device family, matched top-down against the model string. Icon,
# is_soundbar, height eligibility and valid bond roles all derive from these
# tags, so supporting a future device is a one-line change here. Unknown models
# fall through to _FALLBACK (a generic home speaker: can surround/pair, no
# height) so new hardware degrades gracefully instead of erroring.
#   primary  = can be a home-theater center (soundbar)
#   sub      = is a subwoofer
#   surround = can be a surround / satellite
#   pair     = can be stereo-paired
#   height   = has up-firing Atmos drivers (a height channel)
_KINDS: list[tuple[re.Pattern, dict]] = [
    (re.compile(r"arc", re.I), {"family": "soundbar", "primary": True}),
    (re.compile(r"beam|ray|playbar|playbase", re.I), {"family": "soundbar", "primary": True}),
    (re.compile(r"sub", re.I), {"family": "sub", "sub": True}),
    (re.compile(r"era\s*300", re.I), {"family": "home", "surround": True, "pair": True, "height": True}),
    (re.compile(r"era|one|five|play:1|play:3|play:5", re.I), {"family": "home", "surround": True, "pair": True}),
    (re.compile(r"symfonisk|bookshelf|lamp|frame|picture", re.I), {"family": "home", "surround": True, "pair": True}),
    (re.compile(r"connect|port|amp", re.I), {"family": "component"}),
    (re.compile(r"move|roam", re.I), {"family": "portable"}),
]
_FALLBACK = {"family": "home", "surround": True, "pair": True}


def capabilities(model: str | None) -> dict:
    """Return the capability tags for a Sonos model string."""
    for rx, caps in _KINDS:
        if rx.search(model or ""):
            return caps
    return _FALLBACK


def is_soundbar(model: str | None) -> bool:
    return bool(capabilities(model).get("primary"))


def can_surround(model: str | None) -> bool:
    return bool(capabilities(model).get("surround"))


def can_pair(model: str | None) -> bool:
    return bool(capabilities(model).get("pair"))


def is_sub(model: str | None) -> bool:
    return bool(capabilities(model).get("sub"))


def has_height(model: str | None) -> bool:
    return bool(capabilities(model).get("height"))
