"""HTSatChanMapSet parsing (sonos.py:_parse_ht_map): map string -> {uid: base}.

Ground truth from docs/SPIKE_FINDINGS.md: the map is
`<bar>:CC;<sat>:<CHANNEL>` and fronts/rears auto-gain a height suffix
(`LF,LTF` / `RR,RTR`). Parsing keys on the *base* channel that AddHTSatellite
takes, and drops the soundbar/CC entry.
"""
from sonos import SonosBackend

BAR = "RINCON_ARC0000000000001400"
LF = "RINCON_BOOKSHELF0000LF01400"
RF = "RINCON_BOOKSHELF0000RF01400"
LR = "RINCON_PICFRAME00000LR01400"
RR = "RINCON_PICFRAME00000RR01400"
SW = "RINCON_SUBMINI000000SW01400"

parse = SonosBackend._parse_ht_map


def test_full_5_1_map_parses_to_base_channels_excluding_bar():
    ht_map = (
        f"{BAR}:CC;{LF}:LF,LTF;{RF}:RF,RTF;"
        f"{LR}:LR,LTR;{RR}:RR,RTR;{SW}:SW"
    )
    assert parse(ht_map, BAR) == {
        LF: "LF", RF: "RF", LR: "LR", RR: "RR", SW: "SW",
    }


def test_height_suffix_is_stripped_to_base():
    assert parse(f"{BAR}:CC;{LF}:LF,LTF", BAR) == {LF: "LF"}
    assert parse(f"{BAR}:CC;{RR}:RR,RTR", BAR) == {RR: "RR"}


def test_sub_channel_has_no_suffix():
    assert parse(f"{BAR}:CC;{SW}:SW", BAR) == {SW: "SW"}


def test_bar_only_map_yields_empty_dict():
    assert parse(f"{BAR}:CC", BAR) == {}


def test_empty_none_and_whitespace_maps_yield_empty_dict():
    assert parse("", BAR) == {}
    assert parse(None, BAR) == {}
    assert parse("   ", BAR) == {}


def test_malformed_tokens_are_skipped():
    # A stray token with no ":" is ignored, valid neighbours still parse.
    assert parse(f"{BAR}:CC;garbage;{LF}:LF", BAR) == {LF: "LF"}


def test_surrounding_whitespace_and_delimiters_are_tolerated():
    assert parse(f" {BAR}:CC ; {LF}:LF ; {RF}:RF ", BAR) == {LF: "LF", RF: "RF"}


def test_soundbar_uid_never_appears_even_if_oddly_mapped():
    # The soundbar's own UID is excluded regardless of the channel it carries.
    assert parse(f"{BAR}:CC;{BAR}:LF;{LF}:LF", BAR) == {LF: "LF"}
