"""add_ht_satellite (sonos.py): a sub waits on is_free; other satellites poll standalone.

A sub is Invisible bonded OR free, so the is_standalone settle-poll never confirms it and
would just burn the full timeout. On the SW channel we wait on is_free instead; every other
channel keeps the visible-satellite standalone poll. Both then apply with retry-on-800.
"""
import sonos


class HTRecorder(sonos.SonosBackend):
    def __init__(self):
        super().__init__()
        self.calls = []          # (action, body)
        self.freed = []          # uids waited via is_free
        self.settle_waits = []   # (wait_uid, wait_ip) passed to _apply_with_settle
        self.timeouts = []       # timeout override passed to _apply_with_settle

    def _dp(self, ip, action, body=""):
        self.calls.append((action, body))
        return "OK"

    def _wait_free(self, ip, uid, **_kw):
        self.freed.append(uid)

    def _apply_with_settle(self, fn, wait_uid=None, wait_ip=None, timeout=None):
        self.settle_waits.append((wait_uid, wait_ip))
        self.timeouts.append(timeout)
        return fn()


def test_sub_on_sw_waits_on_is_free_and_skips_the_standalone_poll():
    b = HTRecorder()
    b.add_ht_satellite("bar_ip", "BAR", "SUB", "SW", "sub_ip")
    assert b.freed == ["SUB"]                # waited on is_free
    assert b.settle_waits == [(None, None)]  # no is_standalone poll (would never settle)
    assert b.timeouts == [b.sub_settle_timeout]  # wider window for the slow sub settle
    assert b.calls == [("AddHTSatellite", "<HTSatChanMapSet>BAR:CC;SUB:SW</HTSatChanMapSet>")]


def test_sw_match_is_case_insensitive():
    b = HTRecorder()
    b.add_ht_satellite("bar_ip", "BAR", "SUB", "sw")
    assert b.freed == ["SUB"]


def test_a_surround_still_polls_the_satellite_to_standalone():
    b = HTRecorder()
    b.add_ht_satellite("bar_ip", "BAR", "SAT", "LR", "sat_ip")
    assert b.freed == []                       # not a sub — no is_free wait
    assert b.settle_waits == [("SAT", "sat_ip")]
    assert b.timeouts == [None]                 # general path keeps the default window
    assert b.calls == [("AddHTSatellite", "<HTSatChanMapSet>BAR:CC;SAT:LR</HTSatChanMapSet>")]


def test_surround_wait_ip_falls_back_to_the_soundbar():
    b = HTRecorder()
    b.add_ht_satellite("bar_ip", "BAR", "SAT", "RF")  # no sat_ip given
    assert b.settle_waits == [("SAT", "bar_ip")]
