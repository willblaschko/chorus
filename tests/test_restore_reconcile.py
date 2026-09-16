"""restore_ht reconcile logic (sonos.py): snapshot + live map -> add/remove ops.

The crown jewel: restore is a *diff*, not a blind replay. We stub the three I/O
seams — snapshot_ht returns a canned live map, add/remove_ht_satellite just
record their args — and assert the decided sequence of adds and removes. The SOAP
transport (_soap/_dp/_apply_with_settle/urllib) is intentionally untouched.
"""
from sonos import SonosBackend

BAR = "RINCON_ARC0000000000001400"
LF = "RINCON_BOOKSHELF0000LF01400"
RF = "RINCON_BOOKSHELF0000RF01400"
LR = "RINCON_PICFRAME00000LR01400"
RR = "RINCON_PICFRAME00000RR01400"
SW = "RINCON_SUBMINI000000SW01400"

FULL_5_1 = (
    f"{BAR}:CC;{LF}:LF,LTF;{RF}:RF,RTF;"
    f"{LR}:LR,LTR;{RR}:RR,RTR;{SW}:SW"
)


class RecordingBackend(SonosBackend):
    """Stubs the three I/O seams; records add/remove decisions."""

    def __init__(self, current_map):
        super().__init__()
        self._current = current_map
        self.adds = []       # list of (sat_uid, channel)
        self.removes = []    # list of sat_uid

    def snapshot_ht(self, soundbar_ip, soundbar_uid):
        return self._current

    def add_ht_satellite(self, soundbar_ip, soundbar_uid, sat_uid, channel, sat_ip=None):
        self.adds.append((sat_uid, channel))
        return "ok"

    def remove_ht_satellite(self, soundbar_ip, sat_uid, soundbar_uid=None):
        self.removes.append(sat_uid)
        return "ok"


def restore(current_map, snapshot):
    b = RecordingBackend(current_map)
    b.restore_ht("10.0.0.1", BAR, snapshot)
    return b


def test_missing_sub_adds_only_sw_and_removes_nothing():
    current = FULL_5_1.replace(f";{SW}:SW", "")  # sub dropped
    b = restore(current, FULL_5_1)
    assert b.adds == [(SW, "SW")]
    assert b.removes == []


def test_already_full_is_a_noop():
    b = restore(FULL_5_1, FULL_5_1)
    assert b.adds == []
    assert b.removes == []


def test_fully_dissolved_re_adds_all_satellites():
    b = restore(f"{BAR}:CC", FULL_5_1)
    assert b.removes == []
    # Every satellite from the snapshot is re-added, on its base channel.
    assert set(b.adds) == {
        (LF, "LF"), (RF, "RF"), (LR, "LR"), (RR, "RR"), (SW, "SW"),
    }


def test_channel_swap_removes_both_then_re_adds_on_correct_channels():
    # Live map has the two rears on each other's channel.
    swapped = f"{BAR}:CC;{LR}:RR,RTR;{RR}:LR,LTR"
    snapshot = f"{BAR}:CC;{LR}:LR,LTR;{RR}:RR,RTR"
    b = restore(swapped, snapshot)
    assert set(b.removes) == {LR, RR}
    assert set(b.adds) == {(LR, "LR"), (RR, "RR")}


def test_extra_satellite_not_in_snapshot_is_removed():
    extra = "RINCON_ERA300000000EX01400"
    snapshot = f"{BAR}:CC;{LF}:LF,LTF;{RF}:RF,RTF"
    current = f"{snapshot};{extra}:LR,LTR"
    b = restore(current, snapshot)
    assert b.removes == [extra]
    assert b.adds == []


def test_removes_are_decided_before_adds():
    # Restore must clear conflicting channels before re-adding (avoids 800).
    swapped = f"{BAR}:CC;{LR}:RR,RTR;{RR}:LR,LTR"
    snapshot = f"{BAR}:CC;{LR}:LR,LTR;{RR}:RR,RTR"

    class OrderTracker(RecordingBackend):
        def __init__(self, current_map):
            super().__init__(current_map)
            self.order = []

        def add_ht_satellite(self, *a, **k):
            self.order.append("add")
            return super().add_ht_satellite(*a, **k)

        def remove_ht_satellite(self, *a, **k):
            self.order.append("remove")
            return super().remove_ht_satellite(*a, **k)

    b = OrderTracker(swapped)
    b.restore_ht("10.0.0.1", BAR, snapshot)
    assert b.order == ["remove", "remove", "add", "add"]
