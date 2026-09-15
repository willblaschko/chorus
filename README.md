# Chorus

*Sonos bonding for Home Assistant — stereo pairs, home theaters, and surrounds the app won't build.*

> **TL;DR** — Chorus is a **Home Assistant integration** that **configures Sonos
> bonding over your local network** (no cloud, no Sonos account): create and
> dissolve stereo pairs and home-theater surrounds — including dedicated front
> surrounds and mixed-model satellites the official Sonos app won't build.
>
> **Install:** HACS → ⋮ → *Custom repositories* → add this repo with category
> **Integration** → **Download** → **restart Home Assistant** → **Settings →
> Devices & Services → Add Integration → Chorus**.
>
> **Maturity:** Chorus ships a **native sidebar panel** — a drag-and-drop /
> tap-to-assign **editor** for building pairs and home theaters, plus a live
> **Overview** — all backed by Home Assistant **services** you can also call from
> **Developer Tools → Actions**. Validated on real hardware.

Chorus is a Home Assistant integration for **configuring Sonos bonding** — stereo
pairs and home-theater surrounds, including **dedicated front surrounds and
mixed-model satellites the official Sonos app refuses to create**. It talks to
your speakers over the local network only (no cloud, no account), through a
visual, room-by-room drag-and-drop panel for building layouts by hand.

---

## Status

**v0.2 — editor panel.** Installed and running on real Home Assistant.

- ✅ **Bonding on hardware** — create/dissolve stereo pairs, add/remove
  home-theater satellites (rears *and* front surrounds), bond a sub to a pair or
  a lone speaker, snapshot & restore. Topology parsed live from `ZoneGroupState`,
  including bonded/invisible members, so everything resolves by name or UID.
- ✅ **Native editor panel** — drag-and-drop (desktop) / tap-to-assign (mobile)
  for building layouts, a live **Overview**, and a settle-progress bar that names
  each speaker as it reconnects.
- ✅ **Zone names follow the room** — a bonded set is one zone with one name;
  swapping L/R never renames it, moving/creating adopts the room name.
- ✅ **Identify** — chime one speaker to find it, played directly over SOAP (no
  dependency on HA's Sonos integration, so it works on freshly-freed speakers).
- ✅ **Fixed line-out volume** toggle for a Connect / Port / Amp / Five.
- 🔜 **Next:** HACS default-store submission + a brand icon.

---

## Why Chorus exists

Home Assistant can adjust settings on an *already-bonded* home theater (sub gain,
night sound, and so on), but it **cannot create or dissolve the bonds
themselves** — no stereo pairing, no adding or removing surrounds, no building a
5.1 layout. This is a long-standing gap, confirmed by the built-in Sonos
integration's own maintainer.

The capability exists in the undocumented **local UPnP/SOAP API on port 1400** —
the same API third-party tools use — but no HA-native, installable product
exposed it. Chorus does, entirely on your LAN:

- **No cloud, no Sonos account** — everything stays on your network.
- **Layouts the Sonos app won't build** — dedicated front surrounds, mixed-model
  satellites (e.g. Era 300s or Symfonisks as an Arc's rears *or* fronts).
- **Reversible** — snapshot before every change; restore to exactly where you
  were.

---

## End goals / vision

The destination is a visual bonding manager anyone can install from HACS and use
without touching YAML:

- **Rooms = Home Assistant Areas.** Moving or creating a room syncs the HA area
  and renames the Sonos zone.
- **Desktop drag-and-drop + mobile tap-to-assign** — the same operations, two
  input models, so it's usable on a phone (where native drag doesn't exist).
- **A spatial home-theater stage** — a top-down room with Front / Rear / Sub
  positions around your seat; drop a speaker onto a position to bond it.
- **Flexible pairs** — multiple stereo pairs per room, and a sub bonded to a
  pair, not just to a soundbar.
- **Staged changes with a plain-language Apply** — you arrange freely, see a
  clear summary of what will change, and commit it in one step (independent
  changes apply in parallel; dependent ones serialize).
- **Surface, don't reinvent, audio settings** — EQ (bass/treble/loudness), sub /
  surround / height levels, night sound, speech/dialog, Trueplay already exist as
  HA entities; Chorus shows them in the room view rather than reimplementing
  them. Chorus owns the one thing HA can't do: the **bonding topology**.

The interactive prototype of this panel lives in `design/ui-prototype.html`.

---

## Current features (v0.1 services)

Available under **Developer Tools → Actions**. Speakers are referenced by their
Sonos room name.

| Service | What it does |
| --- | --- |
| `chorus.create_stereo_pair` | Bond two speakers into a stereo pair (mixed models allowed). |
| `chorus.separate` | Split a stereo pair back into two standalone speakers. |
| `chorus.set_home_theater` | Bond surrounds + sub to a soundbar — **snapshots first**, then adds each channel **one satellite at a time** with poll-until-settled + retry. |
| `chorus.remove_home_theater` | Remove one satellite, or (with none named) **dissolve** the whole home theater. |
| `chorus.move` | Rename a speaker's Sonos zone (`SetZoneAttributes`) — how you move a speaker between rooms. |
| `chorus.snapshot` | Save a soundbar's current home-theater layout. |
| `chorus.restore` | Re-apply the last snapshotted layout, one satellite at a time. |

**Guardrails baked in:**

- **Capability validation** — Chorus won't let you use a non-soundbar as a
  home-theater primary, pair a speaker that can't be paired, or drop a
  non-sub into the sub slot.
- **Friendly errors** — the raw SOAP faults are translated: `401` → "that must
  target a soundbar," `800` → "it hasn't settled yet — try again in a moment."
- **Everything is discovery-driven** — no hardcoded IPs, UIDs, or room names.

---

## Install (HACS custom repository)

1. In **HACS → ⋮ → Custom repositories**, add this repo with category
   **Integration**.
2. Open **Chorus** and **Download** it, then **restart Home Assistant**.
3. **Settings → Devices & Services → Add Integration → Chorus.** (It's local and
   account-free — one click to enable.)

## Use (v0.1 services)

```yaml
# Build a 5.1 home theater around a soundbar
action: chorus.set_home_theater
data:
  soundbar: Living Room
  lf: Front Left
  rf: Front Right
  lr: Rear Left
  rr: Rear Right
  sw: Sub

# Pair two speakers (mixed models allowed)
action: chorus.create_stereo_pair
data:
  left: Living Room
  right: Living Room (right)
```

---

## How it works (architecture)

Everything lives in `custom_components/chorus/` and is **discovery-driven** —
speakers, IPs, UIDs and models are pulled live; nothing about your home is baked
in.

- **`sonos.py`** — the local SOAP backend. Implements the hardware-validated
  recipes (`CreateStereoPair` / `SeparateStereoPair`, `AddHTSatellite` /
  `RemoveHTSatellite`, `SetZoneAttributes`) and the hard-won write strategy:
  **one satellite per call**, **poll-until-settled**, and **retry-on-`800`** to
  survive the transient state Sonos passes through after a bond change. It treats
  the **doubly-unescaped `ZoneGroupState`** (specifically `HTSatChanMapSet`) as
  the source of truth.
- **`const.py`** — the model → capability registry (`primary` / `surround` /
  `pair` / `sub` / `height`) matched against the model string, with a **graceful
  fallback** so unknown or future Sonos models still work (treated as a generic
  home speaker) instead of breaking.
- **`coordinator.py`** — `soco` discovery into a live inventory keyed by UID
  (name / IP / model).
- **`config_flow.py`** — a single, local, account-free config entry.
- **service layer (`__init__.py` + `services.yaml`)** — resolves names against
  the live inventory, validates capabilities, and calls the backend off the event
  loop.

The bond map is a compact channel string, e.g.:

```
<soundbar-uid>:CC;<sat-uid>:LF|RF|LR|RR|SW
```

Full recipes, the channel-map format, the error taxonomy, and the write-strategy
gotchas are documented in **[`docs/SPIKE_FINDINGS.md`](docs/SPIKE_FINDINGS.md)**.

---

## Design

- **`design/ui-prototype.html`** — the interactive prototype of the v0.2 panel: a
  spatial home-theater stage, drag-and-drop + tap-to-assign, multiple stereo
  pairs per room, staged changes with a plain-language Apply, and per-room audio
  settings.
- **`design/icons.html`** — the line-icon set for the Sonos + Symfonisk range.

---

## Roadmap

1. **v0.1 — services** *(shipping)* — HACS-installable component: discovery,
   coordinator, capability registry, and the bonding services with
   snapshot/restore safety.
2. **v0.2 — the panel** — the drag-and-drop / tap-to-assign UI wired to these
   services, plus live **bond-graph** parsing so the panel reflects reality
   (current pairs / home theaters, not a guess).
3. **Later** — submit to the HACS default store and add a brand icon via
   `home-assistant/brands`.

---

## Safety & caveats

- **Undocumented API.** These calls use Sonos's local UPnP/SOAP interface; a
  future firmware or app change could alter or remove them. There's no
  compatibility matrix — treat it as best-effort.
- **Snapshot before writes.** Chorus captures the current layout before changing
  it, and every operation is reversible.
- **Trueplay / tuning.** Custom layouts (mixed-model satellites, dedicated
  fronts) are ones the Sonos app won't build itself, so some of its tuning (like
  Trueplay) may not fully apply. Everything else works normally.
- **"Needs attention" in the Sonos app.** A room Chorus configures may briefly
  show "needs attention" in the Sonos app. The bond is correct and works — verified
  byte-identical to an app-made pair; the flag is a cloud-side "was this set up
  through our app?" marker Chorus can't set (it's local-only, no account). It
  clears on its own over time, or immediately if you re-pair once in the app.

---

## License

Chorus is **dual-licensed**:

- **Open source:** [GNU AGPL-3.0](LICENSE) — free to use, study, modify, and
  share. Note the AGPL's strong copyleft: ship it (or run a modified version as a
  network service) and you must release your complete corresponding source under
  the AGPL too. For home and hobby use this changes nothing.
- **Commercial:** if you want to build on Chorus **without** the AGPL's
  source-disclosure obligations — e.g. inside a closed-source product, appliance,
  or hosted service — a separate paid commercial license is available. See
  [`COMMERCIAL-LICENSE.md`](COMMERCIAL-LICENSE.md).

Contributions are welcome under the terms in [`CLA.md`](CLA.md), which keeps this
dual-licensing possible. © 2026 Will Blaschko.
