"""Local UPnP/SOAP backend for Sonos bonding.

Encodes the recipes validated on real hardware in docs/SPIKE_FINDINGS.md. Every
method here is blocking (uses urllib) and MUST be called from an executor thread,
never on the event loop.
"""
from __future__ import annotations

import html
import logging
import re
import time
import urllib.error
import urllib.request

_LOGGER = logging.getLogger(__name__)

_DP_NS = "urn:schemas-upnp-org:service:DeviceProperties:1"
_ZGT_NS = "urn:schemas-upnp-org:service:ZoneGroupTopology:1"

_ENVELOPE = (
    '<?xml version="1.0"?>'
    '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" '
    's:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">'
    "<s:Body><u:{action} xmlns:u=\"{ns}\">{body}</u:{action}></s:Body></s:Envelope>"
)


class SonosSoapError(Exception):
    """A UPnP SOAP fault. `code` is the Sonos errorCode, e.g. '800' or '401'."""

    def __init__(self, code: str | None, message: str) -> None:
        super().__init__(message)
        self.code = code


class SonosBackend:
    """Blocking SOAP client for Sonos DeviceProperties + ZoneGroupTopology."""

    def __init__(self, timeout: float = 10.0, settle_timeout: float = 25.0) -> None:
        self.timeout = timeout
        self.settle_timeout = settle_timeout

    # -- low level ---------------------------------------------------------
    def _soap(self, ip: str, path: str, ns: str, action: str, body: str) -> str:
        url = f"http://{ip}:1400{path}"
        payload = _ENVELOPE.format(action=action, ns=ns, body=body).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=payload,
            headers={
                "Content-Type": 'text/xml; charset="utf-8"',
                "SOAPAction": f'"{ns}#{action}"',
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                return resp.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as err:
            text = err.read().decode("utf-8", "replace")
            match = re.search(r"<errorCode>(\d+)</errorCode>", text)
            raise SonosSoapError(match.group(1) if match else None, text) from err

    def _dp(self, ip: str, action: str, body: str = "") -> str:
        return self._soap(ip, "/DeviceProperties/Control", _DP_NS, action, body)

    # -- topology (the source of truth) -----------------------------------
    def zone_group_state(self, ip: str) -> str:
        """Return the (doubly-unescaped) ZoneGroupState XML from a player."""
        raw = self._soap(ip, "/ZoneGroupTopology/Control", _ZGT_NS, "GetZoneGroupState", "")
        match = re.search(r"<ZoneGroupState>(.*)</ZoneGroupState>", raw, re.S)
        inner = match.group(1) if match else raw
        return html.unescape(html.unescape(inner))

    def ht_sat_map(self, soundbar_ip: str, soundbar_uid: str) -> str:
        """Return the soundbar's current HTSatChanMapSet string, or ''."""
        state = self.zone_group_state(soundbar_ip)
        match = re.search(
            rf'UUID="{re.escape(soundbar_uid)}"[^>]*HTSatChanMapSet="([^"]*)"', state
        )
        return match.group(1) if match else ""

    def _member(self, state: str, uid: str) -> dict | None:
        match = re.search(
            rf"<(?:ZoneGroupMember|Satellite)([^>]*UUID=\"{re.escape(uid)}\"[^>]*)/?>", state
        )
        if not match:
            return None
        return dict(re.findall(r'(\w+)="([^"]*)"', match.group(1)))

    def is_standalone(self, ip: str, uid: str) -> bool:
        """A visible, non-invisible ZoneGroupMember == settled standalone zone."""
        attrs = self._member(self.zone_group_state(ip), uid)
        return attrs is not None and attrs.get("Invisible", "0") != "1"

    # -- settle + retry (the crux of reliable bonding) --------------------
    def _apply_with_settle(self, apply_fn, wait_uid=None, wait_ip=None):
        """Poll-until-standalone (if given) then apply with retry-on-800.

        After a Remove/Separate both the satellite AND the soundbar pass through a
        transient "limbo" state; re-bonding too soon returns UPnPError 800. So we
        wait for the target to settle, pause for the primary, then retry the op
        until it takes or the deadline passes.
        """
        deadline = time.monotonic() + self.settle_timeout
        if wait_uid and wait_ip:
            while time.monotonic() < deadline:
                try:
                    if self.is_standalone(wait_ip, wait_uid):
                        break
                except Exception:  # noqa: BLE001 - transient during transition
                    pass
                time.sleep(1.0)
            time.sleep(2.0)  # give the primary a moment too
        while True:
            try:
                return apply_fn()
            except SonosSoapError as err:
                if err.code == "800" and time.monotonic() < deadline:
                    time.sleep(2.0)
                    continue
                raise

    # -- stereo pair -------------------------------------------------------
    def create_stereo_pair(self, left_ip: str, left_uid: str, right_uid: str) -> str:
        body = f"<ChannelMapSet>{left_uid}:LF,LF;{right_uid}:RF,RF</ChannelMapSet>"
        return self._dp(left_ip, "CreateStereoPair", body)

    def separate_stereo_pair(self, left_ip: str, left_uid: str, right_uid: str) -> str:
        body = f"<ChannelMapSet>{left_uid}:LF,LF;{right_uid}:RF,RF</ChannelMapSet>"
        return self._dp(left_ip, "SeparateStereoPair", body)

    # -- home theater ------------------------------------------------------
    def add_ht_satellite(
        self, soundbar_ip, soundbar_uid, sat_uid, channel, sat_ip=None
    ) -> str:
        """Add ONE satellite to the soundbar on `channel` (LF/RF/LR/RR/SW).

        One satellite per call — batching two into a single call returns 800.
        Poll+retry handles the settle window. Fronts/rears auto-gain the matching
        height channel (LF -> LF,LTF).
        """
        body = f"<HTSatChanMapSet>{soundbar_uid}:CC;{sat_uid}:{channel}</HTSatChanMapSet>"
        return self._apply_with_settle(
            lambda: self._dp(soundbar_ip, "AddHTSatellite", body),
            wait_uid=sat_uid,
            wait_ip=sat_ip or soundbar_ip,
        )

    def remove_ht_satellite(self, soundbar_ip: str, sat_uid: str) -> str:
        return self._dp(soundbar_ip, "RemoveHTSatellite", f"<SatRoomUUID>{sat_uid}</SatRoomUUID>")

    # -- move / rename (SetZoneAttributes) --------------------------------
    def set_zone_name(self, ip: str, name: str) -> str:
        body = (
            f"<DesiredZoneName>{html.escape(name)}</DesiredZoneName>"
            "<DesiredIcon></DesiredIcon><DesiredConfiguration></DesiredConfiguration>"
        )
        return self._dp(ip, "SetZoneAttributes", body)

    # -- snapshot / restore of a soundbar's HT map ------------------------
    def snapshot_ht(self, soundbar_ip: str, soundbar_uid: str) -> str:
        return self.ht_sat_map(soundbar_ip, soundbar_uid)

    @staticmethod
    def _parse_ht_map(ht_map: str, soundbar_uid: str) -> dict:
        """Parse an HTSatChanMapSet into {sat_uid: base_channel}, sans soundbar/CC.

        The auto height suffix (LF,LTF / RR,RTR) is dropped — we key on the base
        channel (LF/RF/LR/RR/SW) that AddHTSatellite takes.
        """
        out = {}
        for token in (ht_map or "").split(";"):
            token = token.strip()
            if not token or ":" not in token:
                continue
            uid, chan = token.split(":", 1)
            base = chan.split(",")[0]
            if uid == soundbar_uid or base == "CC":
                continue
            out[uid] = base
        return out

    # -- remove/dissolve selection (pure decision, no I/O) ----------------
    @staticmethod
    def resolve_channel_to_uid(current_map, soundbar_uid, channel) -> str | None:
        """Return the satellite UID currently bonded on `channel`, or None.

        `channel` is a base channel (LF/RF/LR/RR/SW); the auto height suffix
        (LF,LTF) is ignored — matching is on the base channel. The soundbar's own
        UID and the CC/center are never returned.
        """
        channel = (channel or "").upper()
        if not channel:
            return None
        for uid, base in SonosBackend._parse_ht_map(current_map, soundbar_uid).items():
            if base == channel:
                return uid
        return None

    @staticmethod
    def satellites_to_remove(current_map, soundbar_uid, channel=None) -> list:
        """Decide which satellite UID(s) to remove from the soundbar's HT map.

        With a `channel`, the single satellite on that channel (or [] if none is
        bonded there). Without a channel, every satellite currently bonded to the
        soundbar (a full dissolve). The soundbar's own UID and the CC/center are
        never included.
        """
        if channel:
            uid = SonosBackend.resolve_channel_to_uid(current_map, soundbar_uid, channel)
            return [uid] if uid else []
        return list(SonosBackend._parse_ht_map(current_map, soundbar_uid))

    def restore_ht(self, soundbar_ip, soundbar_uid, snapshot, sat_ips=None) -> None:
        """Reconcile the live layout to a snapshot: remove extras, add what's missing.

        Not a blind replay — re-adding an already-bonded satellite storms 800 and
        can abort before the truly-missing ones are restored. Instead we read the
        CURRENT map and diff it against the snapshot, so restore is idempotent from
        any state (full, partial, or fully dissolved). A satellite that needs adding
        is by definition not currently bonded, hence standalone/visible, hence its IP
        is discoverable for the settle-poll.
        """
        sat_ips = sat_ips or {}
        desired = self._parse_ht_map(snapshot, soundbar_uid)
        current = self._parse_ht_map(
            self.snapshot_ht(soundbar_ip, soundbar_uid), soundbar_uid
        )
        # Remove satellites that shouldn't be there, or are on the wrong channel.
        for uid, base in current.items():
            if desired.get(uid) != base:
                self.remove_ht_satellite(soundbar_ip, uid)
        # Add satellites that are missing, or need re-adding on the right channel.
        for uid, base in desired.items():
            if current.get(uid) != base:
                self.add_ht_satellite(
                    soundbar_ip, soundbar_uid, uid, base, sat_ip=sat_ips.get(uid)
                )
