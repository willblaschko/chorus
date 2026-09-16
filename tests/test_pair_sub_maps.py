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
        super().__init__(sub_settle_pause=0)  # don't actually sleep in tests
        self.calls = []  # (action, body)
        self.freed = []  # uids add_pair_sub waited to become free

    def _dp(self, ip, action, body=""):
        self.calls.append((action, body))
        return "OK"

    def _apply_with_settle(self, fn, **_kw):
        return fn()  # skip the poll-until-settled loop (used by remove_pair_sub's re-pair)

    def _wait_free(self, ip, uid, **_kw):
        self.freed.append(uid)  # skip the topology poll; just record the wait


def test_add_pair_sub_creates_stereo_pair_with_the_sub_map():
    b = RecordingDP()
    b.add_pair_sub("ip", "PL", "SUB", "PR")
    assert b.calls == [
        ("CreateStereoPair", "<ChannelMapSet>PL:LF,LF;PR:RF,RF;SUB:SW,SW</ChannelMapSet>")
    ]


def test_add_pair_sub_waits_for_the_sub_to_be_free_then_fires_once():
    # A sub freed from an HT must settle before we claim it. add_pair_sub waits on is_free
    # (the sub, not the pair speakers) and then issues a SINGLE CreateStereoPair — no retry
    # loop, because retrying thrashes the sub.
    b = RecordingDP()
    b.add_pair_sub("ip", "PL", "SUB", "PR")
    assert b.freed == ["SUB"]
    assert len(b.calls) == 1  # exactly one attempt


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
