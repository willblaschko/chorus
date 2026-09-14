# Chorus

*A Sonos speaker manager for Home Assistant.*

A Home Assistant integration for **configuring Sonos bonding** — stereo pairs and
home-theater surrounds, including **dedicated front surrounds and mixed-model
satellites the official Sonos app refuses to create** — through a visual,
room-by-room drag-and-drop UI.

> **Status: v0.1 (services).** The bonding mechanism is validated end-to-end on
> real hardware (`docs/SPIKE_FINDINGS.md`), the UI direction is prototyped
> (`design/`), and the **installable HACS integration exists** at
> `custom_components/chorus/` — discovery + services for stereo pairs and home
> theaters, with snapshot/restore. The drag-and-drop panel (v0.2) is next.

## Why

Home Assistant can adjust settings on an *already-bonded* home theater, but it
cannot **create or dissolve** bonds — no stereo pairing, no adding/removing
surrounds. (Confirmed by the built-in Sonos integration's own maintainer.) Chorus
fills that gap over the local UPnP/SOAP API on port 1400 — no cloud, no account,
everything stays on your network.

## What's here

- **`docs/SPIKE_FINDINGS.md`** — the validated backend spec: exact SOAP recipes,
  the channel-map format (`<soundbar>:CC;<sat>:LF` …), and the hard-won write
  strategy (one satellite per call, poll-until-settled, retry-on-`800`).
- **`design/ui-prototype.html`** — interactive UI prototype: a spatial
  home-theater stage, per-model speaker icons, chime-to-identify, and simple
  stereo pairing.
- **`design/icons.html`** — the line-icon set for the Sonos + Symfonisk range.
- **`custom_components/chorus/`** — the HACS-installable integration (v0.1):
  `sonos.py` (the SOAP backend implementing every validated recipe + the
  poll-until-settled/retry-on-800 strategy), `const.py` (the device-capability
  registry), a discovery `coordinator`, a `config_flow`, and the bonding
  `services`.

## Install (HACS custom repository)

1. HACS → Integrations → ⋮ → **Custom repositories** → add this repo, category
   **Integration**. Install **Chorus**, then restart Home Assistant.
2. Settings → Devices & Services → **Add Integration** → **Chorus**.

## Use (v0.1 services)

From **Developer Tools → Actions**, speakers are referenced by their Sonos room
name:

```yaml
# Build a 5.1 home theater around the Arc
action: chorus.set_home_theater
data:
  soundbar: Media Room
  lf: Media Room 2
  rf: Media Room 3
  lr: Rear Left
  rr: Rear Right
  sw: Sub Mini

# Pair two speakers (mixed models allowed)
action: chorus.create_stereo_pair
data: { left: Bedroom, right: Bedroom 2 }
```

Other services: `chorus.separate`, `chorus.remove_home_theater`, `chorus.move`
(rename/relocate a zone), `chorus.snapshot`, `chorus.restore`.

## Roadmap

1. **v0.1 — services (done):** HACS-installable custom component; `soco`
   discovery, coordinator, capability registry, and services for stereo pair /
   surrounds / full home theater, with snapshot/restore safety.
2. **v0.2 — UI:** the drag-and-drop panel (prototyped in `design/`) wired to
   these services.

## License

[MIT](LICENSE)
