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
