# Phase 0 spike findings — Sonos bonding via local UPnP/SOAP

Empirically validated on real hardware (2026-09-13): a Sonos Arc 5.1 (Media Room)
with dedicated fronts + rears + Sub Mini, plus two standalone test speakers
"Media Room 2" (`.104`) and "Media Room 3" (`.105`, likely IKEA Symfonisk).
All calls made with plain `curl` from a LAN host (Mac curl reaches `:1400`;
Mac Python is Local-Network-blocked). Every mutation was reversed; the Arc was
returned to its exact original 5.1 (`== ORIGINAL: True`) after each test.

## Transport
- Endpoint: `POST http://<player-ip>:1400/DeviceProperties/Control`
- Header: `SOAPAction: "urn:schemas-upnp-org:service:DeviceProperties:1#<Action>"`
- Body: standard SOAP envelope; **no `<InstanceID>`** for DeviceProperties actions
  (unlike AVTransport). Namespace `urn:schemas-upnp-org:service:DeviceProperties:1`.
- Read/topology truth: `POST :1400/ZoneGroupTopology/Control` `GetZoneGroupState`
  (body is HTML-entity-encoded XML — unescape twice). The `HTSatChanMapSet` /
  `ChannelMapSet` attributes are the authoritative bond state.
- IP→UID: `GET :1400/status/zp` → `<LocalUID>RINCON_…</LocalUID>`.

## Validated recipes

### Stereo pair (both action variants work — 200, observed)
POST to the intended **master/left** speaker:
- Create: `CreateStereoPair` **or** `AddBondedZones`
  `<ChannelMapSet><master>:LF,LF;<slave>:RF,RF</ChannelMapSet>`
  → slave becomes an invisible satellite adopting the master's zone name.
- Separate: `SeparateStereoPair` (same ChannelMapSet) **or**
  `RemoveBondedZones` `<ChannelMapSet></ChannelMapSet><KeepGrouped>0</KeepGrouped>`
  → both return to visible standalone zones.
- Prefer `CreateStereoPair`/`SeparateStereoPair` (semantic, symmetric input).

### Home-theater satellite bonding (POST to the **soundbar**)
- Add: `AddHTSatellite` `<HTSatChanMapSet><soundbar>:CC;<sat>:<channel></HTSatChanMapSet>`
  - Channels: `LF`/`RF` (fronts), `LR`/`RR` (rears), `SW` (sub), `CC` (soundbar/center).
  - Assigning a front/rear **auto-adds the matching height** — a speaker mapped to
    `LF` shows up as `LF,LTF`; `RR` → `RR,RTR`, etc.
  - **Additive**: adds to the existing HT map without wiping other channels.
  - **One satellite per call.** A single `AddHTSatellite` carrying *two*
    satellites (`…;a:LR;b:RR`) → **UPnPError 800**. Loop, one per call.
- Remove: `RemoveHTSatellite` `<SatRoomUUID><sat-uid></SatRoomUUID>`.
- **Mixed-model confirmed**: `.104`/`.105` (non-Arc, likely Symfonisk) worked as
  both the Arc's rears *and* its dedicated fronts — the exact config the official
  app refuses.

## Gotchas / write-strategy (learned the hard way — each caused a real failure)
1. **One satellite per `AddHTSatellite`** (see above). Batch → 800.
2. **Settle before re-bond.** After `RemoveHTSatellite`, the removed speaker
   passes through a limbo state (Invisible, transient names like "TV Surround
   Left") before becoming a clean standalone zone. Re-adding too soon → 800.
3. **The soundbar also needs to settle**, not just the satellite. A poll that only
   checked the satellite still hit 800 because the Arc was mid-transition from the
   prior remove; a second attempt seconds later succeeded.
4. **Therefore: poll-until-ready + retry-on-800 with backoff.** Poll
   `GetZoneGroupState` until the target speaker is a visible standalone
   `ZoneGroupMember` (`Invisible=0`), pause a few seconds for the primary, issue
   the add, and **retry on 800** — the valid op succeeds once things settle.
   Settle time is variable (~3 s to >15 s); do not fixed-sleep.
5. **Topology entries lag the channel map** by a few seconds — trust
   `HTSatChanMapSet`, not the presence of `<Satellite>` elements, for success.
6. **Restore/undo** = capture the soundbar's full `HTSatChanMapSet` up front, and
   on restore re-add each satellite one at a time (poll + retry). Verified: the
   Arc returned byte-for-byte to its original map after every test.

## Test matrix run (all reversed, Arc restored each time)
- U1 stereo pair: `CreateStereoPair`/`SeparateStereoPair` + `AddBondedZones`/
  `RemoveBondedZones` — all 200. ✓
- HT rear swap: rears → MR2/MR3 → restore. ✓ (first restore exposed gotcha #2)
- U2 multi-sat single call → 800 (→ one-per-call rule). ✓
- U3 settle characterization → poll-until-standalone, variable timing. ✓
- U4 dedicated fronts: fronts → MR2/MR3 (`LF,LTF`/`RF,RTF`) → restore. ✓
  (restore exposed gotcha #3 → retry-on-800 recovers immediately)

### Edge cases (validated)
- **Sub (`SW`) channel** round-trips exactly like any satellite: `RemoveHTSatellite`
  the Sub Mini → Arc map drops `SW`; `AddHTSatellite <soundbar>:CC;<sub>:SW` → back.
- **Error taxonomy** (both fail **atomically** — no partial state):
  - `errorCode 401` = **primary is not a soundbar** (e.g. `AddHTSatellite` to a
    Symfonisk). → integration should validate the primary is a soundbar up front.
  - `errorCode 800` = bad/invalid satellite UID, target **not settled**, or
    **multi-satellite in one call**. → validate inputs + poll/retry.

## Implication for the integration
The backend (`sonos.py`) should implement: `create_stereo_pair`,
`separate_stereo_pair`, `add_ht_satellite(soundbar, sat, channel)` (one per call),
`remove_ht_satellite`, a `snapshot`/`restore` using the soundbar's
`HTSatChanMapSet`, and a shared `_apply_with_settle()` helper doing
poll-until-standalone + retry-on-800. Validate primary-is-soundbar to avoid 401.
`soco` covers stereo pairs and the simple rear case; front/full-HT layouts use the
raw SOAP above.

## Test household inventory (2026-09-13, for reference)
16 Sonos/IKEA devices. The Media Room Arc HT: **Arc SL** `.99` (CC) + **Sub Mini**
`.72` (SW) + SYMFONISK Bookshelves `.74`/`.85` (LF/RF) + SYMFONISK Picture frames
`.89`/`.91` (LR/RR). Standalone test speakers **Media Room 2/3 = Sonos Era 300**
`.104`/`.105` (destined to replace the rears). Other zones: Pantry, Office,
Dining Room (Connect), Kitchen, Bedroom (Symfonisk Table Lamp pair), Guest Bedroom
(Table Lamp pair). Mixed-model bonding (Era 300 / Symfonisk as Arc satellites)
confirmed working — the config the official app refuses.
