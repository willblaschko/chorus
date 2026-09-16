"""The sub-on-pair / sub-on-speaker channel-map recipe.

These map strings were hardware-verified (see docs/SPIKE_FINDINGS.md); this locks them
so a refactor can't silently corrupt the bond. `_set_map` is pure; the add/remove paths
are exercised with a subclass that records the SOAP action + body instead of sending it.
"""
import sonos

_set_map = sonos.SonosBackend._set_map


# --- the pure map builder --------------------------------------------------
def test_sub_on_a_pair_appends_the_sub_and_keeps_l_r():
    # The pair stays L:LF,LF ; R:RF,RF and the sub is appended as SW,SW.
    assert _set_map("PL", "SUB", "PR") == "PL:LF,LF;PR:RF,RF;SUB:SW,SW"


def test_sub_on_a_lone_speaker_gives_it_both_channels():
    # One speaker takes both fronts (LF,RF) with the sub on SW.
    assert _set_map("SPK", "SUB") == "SPK:LF,RF;SUB:SW,SW"


# --- the add/remove orchestration (SOAP body + action) ---------------------
class RecordingDP(sonos.SonosBackend):
    def __init__(self):
        super().__init__()
        self.calls = []  # (action, body)

    def _dp(self, ip, action, body=""):
        self.calls.append((action, body))
        return "OK"

    def _apply_with_settle(self, fn, **_kw):
        return fn()  # skip the poll-until-settled loop


def test_add_pair_sub_creates_stereo_pair_with_the_sub_map():
    b = RecordingDP()
    b.add_pair_sub("ip", "PL", "SUB", "PR")
    assert b.calls == [
        ("CreateStereoPair", "<ChannelMapSet>PL:LF,LF;PR:RF,RF;SUB:SW,SW</ChannelMapSet>")
    ]


def test_add_pair_sub_on_lone_speaker_uses_both_fronts():
    b = RecordingDP()
    b.add_pair_sub("ip", "SPK", "SUB")  # no right_uid
    assert b.calls == [
        ("CreateStereoPair", "<ChannelMapSet>SPK:LF,RF;SUB:SW,SW</ChannelMapSet>")
    ]


def test_remove_pair_sub_separates_then_re_pairs_the_two_speakers():
    b = RecordingDP()
    b.remove_pair_sub("ip", "PL", "SUB", "PR")
    assert b.calls[0] == (
        "SeparateStereoPair",
        "<ChannelMapSet>PL:LF,LF;PR:RF,RF;SUB:SW,SW</ChannelMapSet>",
    )
    # ...then rebuild the plain 2-member pair (sub gone).
    assert b.calls[1] == ("CreateStereoPair", "<ChannelMapSet>PL:LF,LF;PR:RF,RF</ChannelMapSet>")


def test_remove_pair_sub_from_lone_speaker_only_separates():
    b = RecordingDP()
    result = b.remove_pair_sub("ip", "SPK", "SUB")  # no right_uid -> nothing to rebuild
    assert b.calls == [
        ("SeparateStereoPair", "<ChannelMapSet>SPK:LF,RF;SUB:SW,SW</ChannelMapSet>")
    ]
    assert result == "OK"
