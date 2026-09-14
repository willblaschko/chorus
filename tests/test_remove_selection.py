"""Remove/dissolve selection extracted from __init__.py's remove_home_theater.

Given the live channel-map string, decide which satellite UID(s) to remove:
  - by channel  -> the one sat on that base channel (never the bar, never CC)
  - dissolve    -> every satellite except the bar + CC
  - no match    -> [] / None so the caller can raise "no such satellite"
Height-suffixed tokens (LF,LTF) match on their base channel (LF).
"""
from sonos import SonosBackend

BAR = "RINCON_ARC0000000000001400"
LF = "RINCON_BOOKSHELF0000LF01400"
RF = "RINCON_BOOKSHELF0000RF01400"
LR = "RINCON_PICFRAME00000LR01400"
RR = "RINCON_PICFRAME00000RR01400"
SW = "RINCON_SUBMINI000000SW01400"

FULL_5_1 = (
    f"{BAR}:CC;{LF}:LF,LTF;{RF}:RF,RTF;"
    f"{LR}:LR,LTR;{RR}:RR,RTR;{SW}:SW"
)

resolve = SonosBackend.resolve_channel_to_uid
to_remove = SonosBackend.satellites_to_remove


# --- resolve_channel_to_uid -----------------------------------------------
def test_channel_resolves_to_its_satellite_uid():
    assert resolve(FULL_5_1, BAR, "LF") == LF
    assert resolve(FULL_5_1, BAR, "SW") == SW


def test_channel_matching_is_case_insensitive():
    assert resolve(FULL_5_1, BAR, "lf") == LF


def test_height_suffixed_token_matches_on_base_channel_only():
    # A speaker mapped LF,LTF answers to "LF", never to the suffix "LTF".
    assert resolve(f"{BAR}:CC;{LF}:LF,LTF", BAR, "LF") == LF
    assert resolve(f"{BAR}:CC;{LF}:LF,LTF", BAR, "LTF") is None


def test_channel_with_no_matching_sat_returns_none():
    fronts_only = f"{BAR}:CC;{LF}:LF,LTF;{RF}:RF,RTF"
    assert resolve(fronts_only, BAR, "SW") is None


def test_never_returns_the_soundbars_own_uid():
    # Even if the bar is oddly mapped onto a real channel, it is never selected.
    odd = f"{BAR}:CC;{BAR}:LF;{RF}:LF"
    assert resolve(odd, BAR, "LF") == RF


def test_never_returns_cc():
    assert resolve(FULL_5_1, BAR, "CC") is None


# --- satellites_to_remove (dissolve) --------------------------------------
def test_dissolve_returns_all_satellites_except_bar_and_cc():
    assert set(to_remove(FULL_5_1, BAR)) == {LF, RF, LR, RR, SW}


def test_dissolve_on_bar_only_map_returns_empty():
    assert to_remove(f"{BAR}:CC", BAR) == []


def test_satellites_to_remove_by_channel_returns_single_uid():
    assert to_remove(FULL_5_1, BAR, channel="RR") == [RR]


def test_satellites_to_remove_by_missing_channel_returns_empty():
    fronts_only = f"{BAR}:CC;{LF}:LF,LTF;{RF}:RF,RTF"
    assert to_remove(fronts_only, BAR, channel="SW") == []
