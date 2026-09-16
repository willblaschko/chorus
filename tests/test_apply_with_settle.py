"""_apply_with_settle (sonos.py): ride out transient SOAP faults, raise hard ones.

The retry loop is what makes bonding reliable through a device's settle window. It must
retry the transient codes (800 and code-less resets) and re-raise anything else — NOT
1034, which is the sub-in-transition fault that retrying only thrashes. We neutralize
time.sleep so the loop spins fast, and drive it with a fn that fails N times.
"""
import sonos


class _NoSleep:
    """Context manager: stub sonos.time.sleep so the retry loop doesn't actually wait."""

    def __enter__(self):
        self._orig = sonos.time.sleep
        sonos.time.sleep = lambda *_a, **_k: None
        return self

    def __exit__(self, *_exc):
        sonos.time.sleep = self._orig


def _fails_then_ok(code, times):
    """A callable that raises SonosSoapError(code) `times` times, then returns 'OK'."""
    state = {"n": 0}

    def fn():
        state["n"] += 1
        if state["n"] <= times:
            raise sonos.SonosSoapError(code, f"transient {code}")
        return "OK"

    fn.state = state
    return fn


def test_1034_is_not_retried():
    # 1034 = a sub mid-group-transition; retrying thrashes it. It must raise on the first
    # failure (subs don't use this loop, but lock the code out of the retry set anyway).
    with _NoSleep():
        fn = _fails_then_ok("1034", 5)
        try:
            sonos.SonosBackend()._apply_with_settle(fn)
            assert False, "should have raised"
        except sonos.SonosSoapError as err:
            assert err.code == "1034"
        assert fn.state["n"] == 1


def test_rides_out_800_then_succeeds():
    with _NoSleep():
        fn = _fails_then_ok("800", 2)
        assert sonos.SonosBackend()._apply_with_settle(fn) == "OK"
        assert fn.state["n"] == 3


def test_rides_out_a_codeless_reset_then_succeeds():
    with _NoSleep():
        fn = _fails_then_ok(None, 1)
        assert sonos.SonosBackend()._apply_with_settle(fn) == "OK"
        assert fn.state["n"] == 2


def test_a_hard_code_is_not_retried():
    # 402 (bad args) is a real rejection — raise immediately, don't waste the window.
    with _NoSleep():
        fn = _fails_then_ok("402", 5)
        try:
            sonos.SonosBackend()._apply_with_settle(fn)
            assert False, "should have raised"
        except sonos.SonosSoapError as err:
            assert err.code == "402"
        assert fn.state["n"] == 1  # tried once, no retry


def test_gives_up_after_the_deadline():
    # A transient that never clears eventually raises once the settle window closes.
    with _NoSleep():
        b = sonos.SonosBackend()
        b.settle_timeout = 0.0  # deadline is already past on the first failure
        fn = _fails_then_ok("800", 999)
        try:
            b._apply_with_settle(fn)
            assert False, "should have raised"
        except sonos.SonosSoapError as err:
            assert err.code == "800"


def test_set_zone_name_retries_a_codeless_unreachable_then_succeeds():
    # A rename runs after the bonds, so the speaker was often just reconfigured and is
    # briefly unreachable (code-less). SetZoneAttributes is idempotent, so it rides that
    # out through the settle window rather than failing the whole Apply.
    with _NoSleep():
        b = sonos.SonosBackend()
        sets = {"n": 0}

        def dp(ip, action, body=""):
            if action == "GetZoneAttributes":
                return "<CurrentZoneName>Media Room 3</CurrentZoneName>"  # name already took
            sets["n"] += 1  # SetZoneAttributes
            if sets["n"] < 3:
                raise sonos.SonosSoapError(None, "URLError: timed out")
            return "OK"

        b._dp = dp
        assert b.set_zone_name("1.2.3.4", "Media Room 3") == "OK"
        assert sets["n"] == 3


def test_set_zone_name_reissues_until_the_name_actually_takes():
    # The SOAP call can return OK while the name lags/reverts during settle. set_zone_name
    # verifies via GetZoneAttributes and re-issues until the zone reports the new name.
    with _NoSleep():
        b = sonos.SonosBackend()
        sets = {"n": 0}
        reads = {"n": 0}

        def dp(ip, action, body=""):
            if action == "GetZoneAttributes":
                reads["n"] += 1
                nm = "Media Room 3" if reads["n"] >= 3 else "Old Name"
                return f"<CurrentZoneName>{nm}</CurrentZoneName>"
            sets["n"] += 1  # SetZoneAttributes always returns OK
            return "OK"

        b._dp = dp
        assert b.set_zone_name("1.2.3.4", "Media Room 3") == "OK"
        assert sets["n"] == 3  # re-issued until the name reported back
        assert reads["n"] == 3


def test_wait_for_ip_polls_until_the_speaker_reappears():
    # A speaker freed in an L/R swap briefly drops out of the topology; wait_for_ip polls
    # until it re-registers rather than failing 'not found' on a single read.
    with _NoSleep():
        b = sonos.SonosBackend()
        calls = {"n": 0}

        def ips(_seed):
            calls["n"] += 1
            return {"RINCON_X": "1.2.3.4"} if calls["n"] >= 3 else {}

        b.speaker_ips = ips
        assert b.wait_for_ip("RINCON_X", "seed") == "1.2.3.4"
        assert calls["n"] == 3


def test_wait_for_ip_gives_up_past_the_deadline():
    # Bounded by settle_timeout — it does not poll forever.
    with _NoSleep():
        b = sonos.SonosBackend()
        b.settle_timeout = 0.0
        b.speaker_ips = lambda _seed: {}
        assert b.wait_for_ip("RINCON_X", "seed") is None
