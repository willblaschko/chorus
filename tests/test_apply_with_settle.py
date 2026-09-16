"""_apply_with_settle (sonos.py): ride out transient SOAP faults, raise hard ones.

The retry loop is what makes bonding reliable through a device's settle window. It must
retry the transient codes (800, 1034, code-less resets) and re-raise anything else. We
neutralize time.sleep so the loop spins fast, and drive it with a fn that fails N times.
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


def test_rides_out_1034_then_succeeds():
    # The sub-just-left-a-home-theater case: CreateStereoPair 1034s until the sub is
    # fully bondable, then takes. Regression for the reported failure.
    with _NoSleep():
        fn = _fails_then_ok("1034", 2)
        assert sonos.SonosBackend()._apply_with_settle(fn) == "OK"
        assert fn.state["n"] == 3


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


def test_retry_free_waits_for_the_device_to_return_between_attempts():
    # For a sub, a failed attempt pulls it out and it reverts; retry_free makes the loop
    # wait for it to come back (via _wait_free) before each retry, not fire on a timer.
    with _NoSleep():
        b = sonos.SonosBackend()
        waited = []
        b._wait_free = lambda ip, uid: waited.append(uid)  # stub the return-wait
        fn = _fails_then_ok("1034", 2)
        assert b._apply_with_settle(fn, retry_free=("ip", "SUB")) == "OK"
        assert fn.state["n"] == 3
        assert waited == ["SUB", "SUB"]  # waited for the sub to return before each retry


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
        fn = _fails_then_ok("1034", 999)
        try:
            b._apply_with_settle(fn)
            assert False, "should have raised"
        except sonos.SonosSoapError as err:
            assert err.code == "1034"
