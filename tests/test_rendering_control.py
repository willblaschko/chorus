"""RenderingControl reads/writes: volume and fixed line-out.

These parse SOAP responses and build SOAP bodies, so we stub `_rc` (the transport)
with a canned response + a call recorder — no network, no hardware.
"""
import sonos


class FakeRC(sonos.SonosBackend):
    """A backend whose `_rc` returns a canned XML and records (action, inner)."""

    def __init__(self, canned=""):
        super().__init__()
        self.canned = canned
        self.calls = []  # list of (action, inner)

    def _rc(self, ip, action, inner=""):
        self.calls.append((action, inner))
        return self.canned


# --- volume ----------------------------------------------------------------
def test_get_volume_parses_current_volume():
    b = FakeRC("<u:GetVolumeResponse><CurrentVolume>42</CurrentVolume></u:GetVolumeResponse>")
    assert b.get_volume("1.2.3.4") == 42
    assert b.calls == [("GetVolume", "<Channel>Master</Channel>")]


def test_get_volume_defaults_to_zero_on_garbage():
    assert FakeRC("no volume here").get_volume("x") == 0


def test_set_volume_clamps_to_0_100_and_targets_master():
    b = FakeRC()
    b.set_volume("x", 150)
    action, inner = b.calls[-1]
    assert action == "SetVolume"
    assert "<Channel>Master</Channel>" in inner
    assert "<DesiredVolume>100</DesiredVolume>" in inner  # clamped high

    b.set_volume("x", -5)
    assert "<DesiredVolume>0</DesiredVolume>" in b.calls[-1][1]  # clamped low

    b.set_volume("x", 37)
    assert "<DesiredVolume>37</DesiredVolume>" in b.calls[-1][1]  # in range


# --- fixed line-out --------------------------------------------------------
def test_supports_output_fixed_reads_the_flag():
    assert FakeRC("<CurrentSupportsFixed>1</CurrentSupportsFixed>").supports_output_fixed("x") is True
    assert FakeRC("<CurrentSupportsFixed>0</CurrentSupportsFixed>").supports_output_fixed("x") is False
    assert FakeRC("<other/>").supports_output_fixed("x") is False


def test_output_fixed_reads_the_flag():
    assert FakeRC("<CurrentFixed>1</CurrentFixed>").output_fixed("x") is True
    assert FakeRC("<CurrentFixed>0</CurrentFixed>").output_fixed("x") is False


def test_set_output_fixed_sends_desired_fixed():
    b = FakeRC()
    b.set_output_fixed("x", True)
    assert b.calls[-1] == ("SetOutputFixed", "<DesiredFixed>1</DesiredFixed>")
    b.set_output_fixed("x", False)
    assert b.calls[-1] == ("SetOutputFixed", "<DesiredFixed>0</DesiredFixed>")
