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
_RC_NS = "urn:schemas-upnp-org:service:RenderingControl:1"
_AV_NS = "urn:schemas-upnp-org:service:AVTransport:1"

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
        except (urllib.error.URLError, TimeoutError, OSError) as err:
            # A connection reset / timeout while the device is mid-reconfigure (the
            # window right after a Separate/Remove). Surface as a code-less SoapError
            # so callers wrap it cleanly (a 400, not a raw 500) and the settle-retry
            # loop can try again instead of the exception escaping unhandled.
            raise SonosSoapError(None, f"{type(err).__name__}: {err}") from err

    def _dp(self, ip: str, action: str, body: str = "") -> str:
        return self._soap(ip, "/DeviceProperties/Control", _DP_NS, action, body)

    def _rc(self, ip: str, action: str, inner: str = "") -> str:
        # RenderingControl actions always carry InstanceID 0.
        return self._soap(
            ip,
            "/MediaRenderer/RenderingControl/Control",
            _RC_NS,
            action,
            f"<InstanceID>0</InstanceID>{inner}",
        )

    def _av(self, ip: str, action: str, inner: str = "") -> str:
        # AVTransport actions always carry InstanceID 0.
        return self._soap(
            ip,
            "/MediaRenderer/AVTransport/Control",
            _AV_NS,
            action,
            f"<InstanceID>0</InstanceID>{inner}",
        )

    @staticmethod
    def _field(xml: str, tag: str) -> str:
        m = re.search(rf"<{tag}>([^<]*)</{tag}>", xml)
        return m.group(1) if m else ""

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

    def speaker_ips(self, ip: str) -> dict:
        """{uid: ip} for EVERY speaker in the topology (bonded + standalone), from a
        FRESH ZoneGroupState read.

        Lets us locate a speaker by UID even when the coordinator's discovery cache is
        stale mid-Apply (a just-removed satellite isn't in soco.discover yet). UUID
        precedes Location in both ZoneGroupMember and Satellite elements.
        """
        state = self.zone_group_state(ip)
        out: dict[str, str] = {}
        for m in re.finditer(
            r'UUID="(RINCON_[0-9A-F]+)"[^>]*?Location="https?://([0-9.]+):1400', state
        ):
            out.setdefault(m.group(1), m.group(2))
        return out

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

    def is_free(self, ip: str, uid: str) -> bool:
        """True once `uid` is UNBONDED — the readiness signal for an Invisible sub,
        where is_standalone (which rejects Invisible members) never returns True.

        A bonded sub is a nested <Satellite> of its set; a freed one becomes its own
        <ZoneGroupMember>. So: not a Satellite anywhere, but present as a member.
        """
        state = self.zone_group_state(ip)
        if re.search(rf'<Satellite[^>]*UUID="{re.escape(uid)}"', state):
            return False  # still a satellite of some set
        return re.search(rf'<ZoneGroupMember[^>]*UUID="{re.escape(uid)}"', state) is not None

    # -- settle + retry (the crux of reliable bonding) --------------------
    def _wait_free(self, ip: str, uid: str) -> None:
        """Poll (via the reachable `ip`'s global topology) until `uid` is unbonded, or
        the settle deadline passes. Used before re-bonding a sub that was just freed —
        an Invisible sub can't be checked with is_standalone, so we watch is_free."""
        deadline = time.monotonic() + self.settle_timeout
        while time.monotonic() < deadline:
            try:
                if self.is_free(ip, uid):
                    return
            except Exception:  # noqa: BLE001 - transient during transition
                pass
            time.sleep(1.0)

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
                # Retry the transient states while there's still time: 800 (not
                # settled) and a code-less error (a connection reset/timeout while the
                # device is still cycling). Past the deadline it raises -> a clean 400.
                if err.code in ("800", None) and time.monotonic() < deadline:
                    time.sleep(2.0)
                    continue
                raise

    # -- stereo pair -------------------------------------------------------
    def create_stereo_pair(self, left_ip: str, left_uid: str, right_uid: str) -> str:
        body = f"<ChannelMapSet>{left_uid}:LF,LF;{right_uid}:RF,RF</ChannelMapSet>"
        # A swap re-pairs a speaker that was JUST separated (an L/R swap = separate ->
        # re-create reversed); the freed speaker passes through limbo, so CreateStereoPair
        # returns 800 if fired too soon. Wait for the left speaker to settle to a
        # standalone, then apply with retry-on-800 (same crux as add_ht_satellite).
        return self._apply_with_settle(
            lambda: self._dp(left_ip, "CreateStereoPair", body),
            wait_uid=left_uid,
            wait_ip=left_ip,
        )

    def separate_stereo_pair(self, left_ip: str, left_uid: str, right_uid: str) -> str:
        body = f"<ChannelMapSet>{left_uid}:LF,LF;{right_uid}:RF,RF</ChannelMapSet>"
        return self._dp(left_ip, "SeparateStereoPair", body)

    # -- sub bonded to a SET: a stereo pair OR a lone speaker (both verified) ---
    # A sub joins a set by (re-)issuing CreateStereoPair with the sub appended to the
    # set's ChannelMapSet as `SW,SW` (CreateStereoPair is additive). A PAIR keeps its
    # two halves (L:LF,LF;R:RF,RF); a lone SPEAKER takes both channels (P:LF,RF).
    # Removing can't shrink the map (402), so SeparateStereoPair the whole set; for a
    # pair we then re-create the 2-member pair (a lone speaker just falls to standalone).
    @staticmethod
    def _set_map(primary_uid: str, sub_uid: str, right_uid: str | None = None) -> str:
        if right_uid:
            return f"{primary_uid}:LF,LF;{right_uid}:RF,RF;{sub_uid}:SW,SW"
        return f"{primary_uid}:LF,RF;{sub_uid}:SW,SW"

    def add_pair_sub(
        self, primary_ip: str, primary_uid: str, sub_uid: str, right_uid: str | None = None
    ) -> str:
        # A sub freed from a home theater in the SAME Apply lags the soundbar: the bar
        # drops it from its map (which remove_ht_satellite waits for) before the sub
        # itself comes up as its own zone, and CreateStereoPair 800s if it fires first.
        # is_standalone can't see an Invisible sub, so wait on is_free (via the reachable
        # primary's global topology) until the sub is genuinely unbonded.
        self._wait_free(primary_ip, sub_uid)
        body = f"<ChannelMapSet>{self._set_map(primary_uid, sub_uid, right_uid)}</ChannelMapSet>"
        # Belt-and-suspenders: still retry transient 800s while the sub finishes settling.
        return self._apply_with_settle(lambda: self._dp(primary_ip, "CreateStereoPair", body))

    def remove_pair_sub(
        self, primary_ip: str, primary_uid: str, sub_uid: str, right_uid: str | None = None
    ) -> str:
        # Dissolve the whole set (the sub falls free).
        self._dp(
            primary_ip,
            "SeparateStereoPair",
            f"<ChannelMapSet>{self._set_map(primary_uid, sub_uid, right_uid)}</ChannelMapSet>",
        )
        if not right_uid:
            return "OK"  # a lone speaker is already standalone — nothing to rebuild
        # Re-pair the two speakers once the right half settles to a visible standalone.
        body = f"<ChannelMapSet>{primary_uid}:LF,LF;{right_uid}:RF,RF</ChannelMapSet>"
        return self._apply_with_settle(
            lambda: self._dp(primary_ip, "CreateStereoPair", body),
            wait_uid=right_uid,
            wait_ip=primary_ip,
        )

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

    def remove_ht_satellite(
        self, soundbar_ip: str, sat_uid: str, soundbar_uid: str | None = None
    ) -> str:
        """Remove a satellite; if `soundbar_uid` is given, wait for the device to
        actually drop it before returning (so callers don't report 'done' while the
        soundbar is still cycling)."""
        result = self._dp(
            soundbar_ip, "RemoveHTSatellite", f"<SatRoomUUID>{sat_uid}</SatRoomUUID>"
        )
        if soundbar_uid:
            deadline = time.monotonic() + self.settle_timeout
            while time.monotonic() < deadline:
                try:
                    if sat_uid not in self.ht_sat_map(soundbar_ip, soundbar_uid):
                        break
                except Exception:  # noqa: BLE001 - transient during transition
                    pass
                time.sleep(1.0)
        return result

    # -- move / rename (SetZoneAttributes) --------------------------------
    def set_zone_name(self, ip: str, name: str) -> str:
        body = (
            f"<DesiredZoneName>{html.escape(name)}</DesiredZoneName>"
            "<DesiredIcon></DesiredIcon><DesiredConfiguration></DesiredConfiguration>"
        )
        return self._dp(ip, "SetZoneAttributes", body)

    # -- fixed line-out volume (Port / Connect / Amp / Five) ---------------
    def supports_output_fixed(self, ip: str) -> bool:
        return self._field(self._rc(ip, "GetSupportsOutputFixed"), "CurrentSupportsFixed") == "1"

    def output_fixed(self, ip: str) -> bool:
        return self._field(self._rc(ip, "GetOutputFixed"), "CurrentFixed") == "1"

    def set_output_fixed(self, ip: str, fixed: bool) -> str:
        return self._rc(
            ip, "SetOutputFixed", f"<DesiredFixed>{'1' if fixed else '0'}</DesiredFixed>"
        )

    # -- zone volume (RenderingControl Master channel) --------------------
    def get_volume(self, ip: str) -> int:
        v = self._field(self._rc(ip, "GetVolume", "<Channel>Master</Channel>"), "CurrentVolume")
        return int(v) if v.isdigit() else 0

    def set_volume(self, ip: str, level: int) -> str:
        level = max(0, min(100, int(level)))
        return self._rc(
            ip, "SetVolume", f"<Channel>Master</Channel><DesiredVolume>{level}</DesiredVolume>"
        )

    # -- identify: play a short clip on ONE speaker ----------------------
    def play_chime(self, ip: str, url: str) -> None:
        """Play `url` on ONE speaker for Identify, restoring what it was doing. Uses raw
        AVTransport SOAP (NOT soco.play_uri, whose coordinator gate rejects these freed
        zones) — so it's independent of HA's Sonos integration and works on a speaker HA
        still lists unavailable.

        Snapshots the current source + transport state, plays the chime, then restores.
        If the speaker is a playback-group SLAVE (Sonos rejects transport control on a
        slave), break it out with BecomeCoordinatorOfStandaloneGroup and retry — the saved
        `x-rincon:` follow-URI rejoins the group on restore."""
        # Snapshot (best-effort — a freed speaker is usually idle anyway).
        cur_uri = cur_meta = ""
        state = "STOPPED"
        try:
            mi = self._av(ip, "GetMediaInfo")
            cur_uri = self._field(mi, "CurrentURI")
            m = re.search(r"<CurrentURIMetaData>(.*?)</CurrentURIMetaData>", mi, re.S)
            cur_meta = m.group(1) if m else ""
            state = self._field(self._av(ip, "GetTransportInfo"), "CurrentTransportState") or state
        except SonosSoapError:
            pass

        def start() -> None:
            self._av(
                ip, "SetAVTransportURI",
                f"<CurrentURI>{html.escape(url)}</CurrentURI><CurrentURIMetaData></CurrentURIMetaData>",
            )
            self._av(ip, "Play", "<Speed>1</Speed>")

        try:
            start()
        except SonosSoapError as err:
            if not err.code:  # timeout/unreachable — nothing we can do
                raise
            # Coded rejection: the speaker is a group slave. Make it standalone and retry.
            self._av(ip, "BecomeCoordinatorOfStandaloneGroup")
            time.sleep(0.4)
            start()

        time.sleep(3.2)  # let the ~2.5s chime finish

        # Restore the previous source. A slave's saved URI is `x-rincon:<coord>`, so this
        # rejoins its group; a standalone's is its own queue/stream.
        try:
            if cur_uri:
                self._av(
                    ip, "SetAVTransportURI",
                    f"<CurrentURI>{cur_uri}</CurrentURI><CurrentURIMetaData>{cur_meta}</CurrentURIMetaData>",
                )
                if state == "PLAYING":
                    self._av(ip, "Play", "<Speed>1</Speed>")
                else:
                    self._av(ip, "Stop")
            else:
                self._av(ip, "Stop")
        except SonosSoapError:
            _LOGGER.warning("Chorus identify: could not restore playback on %s", ip)

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
                self.remove_ht_satellite(soundbar_ip, uid, soundbar_uid)
        # Add satellites that are missing, or need re-adding on the right channel.
        for uid, base in desired.items():
            if current.get(uid) != base:
                self.add_ht_satellite(
                    soundbar_ip, soundbar_uid, uid, base, sat_ip=sat_ips.get(uid)
                )

    # -- live bond graph (the state the panel binds to) -------------------
    @staticmethod
    def _attrs(fragment: str) -> dict:
        """All key="value" attributes of an XML element's opening tag."""
        return dict(re.findall(r'(\w+)="([^"]*)"', fragment))

    @staticmethod
    def _ip_from_location(location: str) -> str | None:
        """Pull the LAN IP out of a Sonos Location URL (http://IP:1400/...)."""
        match = re.search(r"https?://([0-9.]+):1400", location or "")
        return match.group(1) if match else None

    @staticmethod
    def parse_bond_graph(zgs: str) -> list:
        """Parse a (doubly-unescaped) ZoneGroupState into a list of bonded units.

        Each unit is exactly one of: a standalone speaker, a stereo pair, or a home
        theater. Shape:

            {"primary_uid", "name", "kind", "members": [
                {"uid", "channel", "ip", "name", "invisible", "is_primary"}, ...]}

        `kind` is "standalone" | "stereo_pair" | "home_theater". `channel` is CC for a
        soundbar, LF/RF for fronts or a pair's left/right, LR/RR for rears, SW for a
        sub, or None for a standalone. IPs come from each element's Location, so even
        invisible bonded members (which soco.discover never returns) resolve.

        The two bonding shapes differ in the wire format, both handled here:
          - home theater: one visible primary carries HTSatChanMapSet and NESTS its
            satellites as <Satellite> children.
          - stereo pair: TWO sibling <ZoneGroupMember>s share one ChannelMapSet; the
            visible one is the primary/left, the Invisible="1" one is the right.
        """
        attrs = SonosBackend._attrs
        ip_of = SonosBackend._ip_from_location

        # Index every top-level member (attrs + inner XML) for partner lookups.
        members = {}
        for m in re.finditer(
            r"<ZoneGroupMember\b([^>]*?)(?:/>|>(.*?)</ZoneGroupMember>)", zgs, re.S
        ):
            at = attrs(m.group(1))
            uid = at.get("UUID")
            if uid:
                members[uid] = (at, m.group(2) or "")

        units = []
        claimed = set()  # uids already represented (pair partners, HT satellites)
        for uid, (at, inner) in members.items():
            if uid in claimed:
                continue
            hts = at.get("HTSatChanMapSet")
            cms = at.get("ChannelMapSet")

            if hts:  # ---- home theater ----
                channels = SonosBackend._parse_ht_map(hts, uid)  # {sat_uid: base}
                nested = {}
                for s in re.finditer(r"<Satellite\b([^>]*?)/?>", inner):
                    sa = attrs(s.group(1))
                    if sa.get("UUID"):
                        nested[sa["UUID"]] = sa
                mem = [{
                    "uid": uid, "channel": "CC", "ip": ip_of(at.get("Location", "")),
                    "name": at.get("ZoneName"), "invisible": False, "is_primary": True,
                }]
                for suid, base in channels.items():
                    sa = nested.get(suid, {})
                    mem.append({
                        "uid": suid, "channel": base, "ip": ip_of(sa.get("Location", "")),
                        "name": sa.get("ZoneName"),
                        "invisible": sa.get("Invisible", "0") == "1", "is_primary": False,
                    })
                    claimed.add(suid)
                units.append({
                    "primary_uid": uid, "name": at.get("ZoneName"),
                    "kind": "home_theater", "members": mem,
                })
                claimed.add(uid)

            elif cms:  # ---- stereo pair ----
                if at.get("Invisible", "0") == "1":
                    continue  # the visible half emits the unit
                # soundbar_uid="" so both halves survive (_parse_ht_map still drops CC)
                pair = SonosBackend._parse_ht_map(cms, "")
                mem = []
                for puid, base in pair.items():
                    p_at = members.get(puid, ({}, ""))[0]
                    mem.append({
                        "uid": puid, "channel": base, "ip": ip_of(p_at.get("Location", "")),
                        "name": p_at.get("ZoneName"),
                        "invisible": p_at.get("Invisible", "0") == "1",
                        "is_primary": puid == uid,
                    })
                    claimed.add(puid)
                units.append({
                    "primary_uid": uid, "name": at.get("ZoneName"),
                    "kind": "stereo_pair", "members": mem,
                })

            else:  # ---- standalone (visible), OR an unbonded, still-invisible sub ----
                # A regular speaker unbonds to a VISIBLE standalone. A sub has no
                # standalone playback role, so it stays Invisible="1" even when
                # unbonded -- surface it anyway (flagged invisible) so the UI can
                # offer to re-home it; the frontend decides by model that it's a sub.
                # Skip true infrastructure (a Boost/Bridge) and any ghost with no IP.
                if at.get("IsZoneBridge", "0") == "1" or not at.get("Location"):
                    continue
                invisible = at.get("Invisible", "0") == "1"
                units.append({
                    "primary_uid": uid, "name": at.get("ZoneName"), "kind": "standalone",
                    "members": [{
                        "uid": uid, "channel": None, "ip": ip_of(at.get("Location", "")),
                        "name": at.get("ZoneName"), "invisible": invisible, "is_primary": True,
                    }],
                })
        return units

    # -- model enrichment (for invisible members soco can't see) ----------
    def device_description(self, ip: str) -> str:
        """Fetch a player's UPnP device-description XML (blocking)."""
        url = f"http://{ip}:1400/xml/device_description.xml"
        with urllib.request.urlopen(
            urllib.request.Request(url), timeout=self.timeout
        ) as resp:
            return resp.read().decode("utf-8", "replace")

    @staticmethod
    def _parse_model(device_xml: str) -> str:
        """Canonical model name from a device description, or ''.

        The description embeds several UPnP sub-devices (MediaServer/Renderer), each
        with its own <modelName>; the FIRST is the root device — the real model
        (e.g. 'Sonos Arc SL'). Falls back to displayName, then modelDescription.
        """
        for tag in ("modelName", "displayName", "modelDescription"):
            match = re.search(rf"<{tag}>([^<]*)</{tag}>", device_xml or "")
            if match and match.group(1).strip():
                return match.group(1).strip()
        return ""

    def fetch_model(self, ip: str) -> str:
        """Best-effort model name for the player at `ip` ('' on any failure)."""
        try:
            return self._parse_model(self.device_description(ip))
        except Exception:  # noqa: BLE001 - enrichment is best-effort, never fatal
            return ""
