# Chorus — services, scripting & internals

The power-user reference: every bonding action as a Home Assistant service, how to
script it, how it works under the hood, and the caveats. For the overview, see the
[main README](../README.md).

---

## Services

Everything the panel does is also a service, under **Developer Tools → Actions** — the
panel calls these same ones. Speakers are referenced by **Sonos zone name or RINCON UID**
(the integration resolves either; UIDs survive renames).

| Service | What it does |
| --- | --- |
| `chorus.create_stereo_pair` | Bond two speakers into a stereo pair (mixed models allowed). |
| `chorus.separate` | Split a stereo pair back into two standalone speakers. |
| `chorus.set_home_theater` | Bond surrounds + sub to a soundbar — snapshots first, then adds each channel one satellite at a time with poll-until-settled + retry. |
| `chorus.remove_home_theater` | Remove one satellite, or (none named) dissolve the whole home theater. |
| `chorus.add_pair_sub` / `chorus.remove_pair_sub` | Bond/unbond a sub to a stereo pair or a lone speaker. |
| `chorus.move` | Move a speaker to another room (renames its zone + reassigns the HA Area). |
| `chorus.rename` | Rename a speaker's Sonos zone in place. |
| `chorus.identify` | Play a chime on one speaker so you can tell which unit it is. |
| `chorus.set_volume` | Set a zone's volume (0–100). |
| `chorus.set_fixed_output` | Toggle fixed line-out volume (Connect / Port / Amp / Five). |
| `chorus.snapshot` / `chorus.restore` | Save / re-apply a soundbar's home-theater layout. |

---

## Scripting

Every speaker is referenced by its **Sonos zone name** (what the speaker is called now)
**or its RINCON UID** — the integration resolves either. UIDs are more robust because they
survive renames; names are friendlier. Each standalone speaker is its own zone with a
unique name, so the values below are just examples — use your speakers' actual names (or
UIDs).

```yaml
# Build a 5.1 home theater around a soundbar
action: chorus.set_home_theater
data:
  soundbar: Media Room       # your Arc/Beam/Ray's zone name
  lf: Front Left             # or a RINCON UID, e.g. RINCON_542A1B51BBA401400
  rf: Front Right
  lr: Rear Left
  rr: Rear Right
  sw: Sub

# Pair two standalone speakers into a stereo pair (mixed models allowed)
action: chorus.create_stereo_pair
data:
  left: Bedroom              # becomes the left/primary
  right: Bedroom 2           # the other speaker's current zone name
```

---

## How it works (architecture)

Everything lives in `custom_components/chorus/` and is **discovery-driven** — speakers,
IPs, UIDs and models are pulled live; nothing about your home is baked in.

- **`sonos.py`** — the local SOAP backend. Implements the hardware-validated recipes
  (`CreateStereoPair` / `SeparateStereoPair`, `AddHTSatellite` / `RemoveHTSatellite`,
  `SetZoneAttributes`) and the hard-won write strategy: **one satellite per call**,
  **poll-until-settled**, and **retry-on-`800`** to survive the transient state Sonos
  passes through after a bond change. It treats the **doubly-unescaped `ZoneGroupState`**
  (specifically `HTSatChanMapSet`) as the source of truth.
- **`const.py`** — the model → capability registry (`primary` / `surround` / `pair` /
  `sub` / `height`) matched against the model string, with a **graceful fallback** so
  unknown or future Sonos models still work (treated as a generic home speaker) instead of
  breaking.
- **`coordinator.py`** — `soco` discovery into a live inventory keyed by UID (name / IP /
  model), plus each zone's current volume.
- **`config_flow.py`** — a single, local, account-free config entry.
- **service layer (`__init__.py` + `services.yaml`)** — resolves names against the live
  inventory, validates capabilities, and calls the backend off the event loop.

The bond map is a compact channel string, e.g.:

```
<soundbar-uid>:CC;<sat-uid>:LF|RF|LR|RR|SW
```

Full recipes, the channel-map format, the error taxonomy, and the write-strategy gotchas
are documented in [`SPIKE_FINDINGS.md`](SPIKE_FINDINGS.md).

---

## Safety & caveats

- **Undocumented API.** These calls use Sonos's local UPnP/SOAP interface; a future
  firmware or app change could alter or remove them. There's no compatibility matrix —
  treat it as best-effort.
- **Staged, but no global undo.** The editor stages changes locally — nothing reaches your
  speakers until you Apply. Building a home theater snapshots the soundbar's layout first,
  and `snapshot`/`restore` cover HT layouts — but there's no one-click undo for every
  operation, so review the summary before you Apply.
- **Trueplay / tuning.** Custom layouts (mixed-model satellites, dedicated fronts) are ones
  the Sonos app won't build itself, so some of its tuning (like Trueplay) may not fully
  apply. Everything else works normally.
- **"Needs attention" in the Sonos app.** A room Chorus configures may briefly show "needs
  attention" in the Sonos app. The bond is correct and works — verified byte-identical to
  an app-made pair; the flag is a cloud-side "was this set up through our app?" marker
  Chorus can't set (it's local-only, no account). It clears on its own over time, or
  immediately if you re-pair once in the app.
