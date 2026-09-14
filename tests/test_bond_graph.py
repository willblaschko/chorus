"""parse_bond_graph (sonos.py): ZoneGroupState XML -> list of bonded units.

Inputs -> outputs: a synthetic (redacted) ZoneGroupState that mirrors the two
real bonding shapes — a home theater (one visible primary with HTSatChanMapSet
that NESTS <Satellite> children) and a stereo pair (two sibling members sharing
one ChannelMapSet, the right channel Invisible="1") — plus a standalone. No real
network data. The regex-scraping of live XML is exercised end-to-end because the
structural contract (nesting vs siblings, Location->IP, Invisible) IS the logic.
"""
from sonos import SonosBackend

BAR = "RINCON_ARC00000000000001400"
LF = "RINCON_FRONTLF0000000001400"
RF = "RINCON_FRONTRF0000000001400"
LR = "RINCON_REARLR00000000001400"
RR = "RINCON_REARRR00000000001400"
SW = "RINCON_SUBMINI0000000001400"
PL = "RINCON_PAIRLEFT000000001400"
PR = "RINCON_PAIRRIGHT00000001400"
SOLO = "RINCON_SOLO0000000000001400"


def _loc(ip):
    return f"http://{ip}:1400/xml/device_description.xml"


# Home theater: bar carries HTSatChanMapSet, satellites are NESTED <Satellite>.
# Fronts carry the auto height suffix (LF,LTF) to prove base-channel extraction.
# The sub keeps its own ZoneName; surrounds inherit the bar's ("Media Room").
_HT = (
    f'<ZoneGroup Coordinator="{BAR}" ID="{BAR}:1">'
    f'<ZoneGroupMember UUID="{BAR}" Location="{_loc("10.0.0.1")}" ZoneName="Media Room" '
    f'Invisible="0" HTSatChanMapSet="{BAR}:CC;{LF}:LF,LTF;{RF}:RF,RTF;{LR}:LR;{RR}:RR;{SW}:SW">'
    f'<Satellite UUID="{LF}" Location="{_loc("10.0.0.2")}" ZoneName="Media Room" Invisible="1"/>'
    f'<Satellite UUID="{RF}" Location="{_loc("10.0.0.3")}" ZoneName="Media Room" Invisible="1"/>'
    f'<Satellite UUID="{LR}" Location="{_loc("10.0.0.4")}" ZoneName="Media Room" Invisible="1"/>'
    f'<Satellite UUID="{RR}" Location="{_loc("10.0.0.5")}" ZoneName="Media Room" Invisible="1"/>'
    f'<Satellite UUID="{SW}" Location="{_loc("10.0.0.6")}" ZoneName="Sub Mini" Invisible="1"/>'
    f"</ZoneGroupMember></ZoneGroup>"
)

# Stereo pair: two sibling members share ChannelMapSet. The invisible RF member is
# listed FIRST to prove the unit emits once regardless of document order.
_PAIR = (
    f'<ZoneGroup Coordinator="{PL}" ID="{PL}:2">'
    f'<ZoneGroupMember UUID="{PR}" Location="{_loc("10.0.0.8")}" ZoneName="Bedroom" '
    f'Invisible="1" ChannelMapSet="{PL}:LF,LF;{PR}:RF,RF"/>'
    f'<ZoneGroupMember UUID="{PL}" Location="{_loc("10.0.0.7")}" ZoneName="Bedroom" '
    f'ChannelMapSet="{PL}:LF,LF;{PR}:RF,RF"/>'
    f"</ZoneGroup>"
)

_SOLO = (
    f'<ZoneGroup Coordinator="{SOLO}" ID="{SOLO}:3">'
    f'<ZoneGroupMember UUID="{SOLO}" Location="{_loc("10.0.0.9")}" ZoneName="Kitchen"/>'
    f"</ZoneGroup>"
)

ZGS = f"<ZoneGroupState><ZoneGroups>{_HT}{_PAIR}{_SOLO}</ZoneGroups></ZoneGroupState>"


def _by_name(units, name):
    return next(u for u in units if u["name"] == name)


def _member(unit, uid):
    return next(m for m in unit["members"] if m["uid"] == uid)


def test_parses_each_bonded_unit_exactly_once():
    units = SonosBackend.parse_bond_graph(ZGS)
    assert len(units) == 3
    kinds = sorted(u["kind"] for u in units)
    assert kinds == ["home_theater", "standalone", "stereo_pair"]


def test_home_theater_channels_and_membership():
    ht = _by_name(SonosBackend.parse_bond_graph(ZGS), "Media Room")
    assert ht["kind"] == "home_theater"
    assert ht["primary_uid"] == BAR
    chan = {m["uid"]: m["channel"] for m in ht["members"]}
    assert chan == {BAR: "CC", LF: "LF", RF: "RF", LR: "LR", RR: "RR", SW: "SW"}


def test_home_theater_resolves_ips_and_names_for_invisible_satellites():
    ht = _by_name(SonosBackend.parse_bond_graph(ZGS), "Media Room")
    bar = _member(ht, BAR)
    assert bar["is_primary"] and not bar["invisible"] and bar["ip"] == "10.0.0.1"
    sub = _member(ht, SW)
    # invisible sat: IP still resolved from Location; keeps its own ZoneName
    assert sub["invisible"] and sub["ip"] == "10.0.0.6" and sub["name"] == "Sub Mini"
    # a surround inherits the bar's ZoneName
    assert _member(ht, LR)["name"] == "Media Room"


def test_stereo_pair_emitted_once_with_visible_primary():
    units = SonosBackend.parse_bond_graph(ZGS)
    pairs = [u for u in units if u["kind"] == "stereo_pair"]
    assert len(pairs) == 1  # NOT two, despite two sibling members
    pair = pairs[0]
    assert pair["primary_uid"] == PL
    left, right = _member(pair, PL), _member(pair, PR)
    assert left["is_primary"] and not left["invisible"] and left["channel"] == "LF"
    assert not right["is_primary"] and right["invisible"] and right["channel"] == "RF"
    assert left["ip"] == "10.0.0.7" and right["ip"] == "10.0.0.8"


def test_standalone_has_no_channel():
    solo = _by_name(SonosBackend.parse_bond_graph(ZGS), "Kitchen")
    assert solo["kind"] == "standalone"
    assert len(solo["members"]) == 1
    m = solo["members"][0]
    assert m["channel"] is None and m["is_primary"] and m["ip"] == "10.0.0.9"


def test_empty_or_garbage_yields_no_units():
    assert SonosBackend.parse_bond_graph("") == []
    assert SonosBackend.parse_bond_graph("<ZoneGroupState></ZoneGroupState>") == []
    assert SonosBackend.parse_bond_graph("not xml at all") == []
