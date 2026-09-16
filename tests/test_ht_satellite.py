"""add_ht_satellite (sonos.py): a sub takes one settled shot; other satellites poll+retry.

A sub is Invisible bonded OR free, so the is_standalone settle-poll never confirms it, and
retrying a sub bond thrashes it. On the SW channel we wait on is_free, pause, then fire the
AddHTSatellite exactly once (no retry loop). Every other channel keeps the visible-satellite
standalone poll + retry.
"""
import sonos


class HTRecorder(sonos.SonosBackend):
    def __init__(self):
        super().__init__(sub_settle_pause=0)  # don't actually sleep in tests
        self.calls = []          # (action, body) issued via _dp
        self.freed = []          # uids waited via is_free
        self.settle_waits = []   # (wait_uid, wait_ip) passed to _apply_with_settle

    def _dp(self, ip, action, body=""):
        self.calls.append((action, body))
        return "OK"

    def _wait_free(self, ip, uid, **_kw):
        self.freed.append(uid)

    def _apply_with_settle(self, fn, wait_uid=None, wait_ip=None):
        self.settle_waits.append((wait_uid, wait_ip))
        return fn()


def test_sub_on_sw_waits_on_is_free_then_fires_once_no_retry():
    b = HTRecorder()
    b.add_ht_satellite("bar_ip", "BAR", "SUB", "SW", "sub_ip")
    assert b.freed == ["SUB"]          # waited on is_free
    assert b.settle_waits == []        # single shot — the retry loop is not used for a sub
    assert b.calls == [("AddHTSatellite", "<HTSatChanMapSet>BAR:CC;SUB:SW</HTSatChanMapSet>")]


def test_sw_match_is_case_insensitive():
    b = HTRecorder()
    b.add_ht_satellite("bar_ip", "BAR", "SUB", "sw")
    assert b.freed == ["SUB"]
    assert b.settle_waits == []


def test_a_surround_still_polls_the_satellite_to_standalone_with_retry():
    b = HTRecorder()
    b.add_ht_satellite("bar_ip", "BAR", "SAT", "LR", "sat_ip")
    assert b.freed == []                       # not a sub — no is_free wait
    assert b.settle_waits == [("SAT", "sat_ip")]  # uses the poll+retry loop
    assert b.calls == [("AddHTSatellite", "<HTSatChanMapSet>BAR:CC;SAT:LR</HTSatChanMapSet>")]


def test_surround_wait_ip_falls_back_to_the_soundbar():
    b = HTRecorder()
    b.add_ht_satellite("bar_ip", "BAR", "SAT", "RF")  # no sat_ip given
    assert b.settle_waits == [("SAT", "bar_ip")]
