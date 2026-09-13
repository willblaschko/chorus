# Sonos Studio

A Home Assistant integration for **configuring Sonos bonding** — stereo pairs and
home-theater surrounds, including **dedicated front surrounds and mixed-model
satellites the official Sonos app refuses to create** — through a visual,
room-by-room drag-and-drop UI.

> **Status: early.** The bonding mechanism is validated end-to-end on real
> hardware (`docs/SPIKE_FINDINGS.md`) and the UI direction is prototyped
> (`design/`). The installable HACS integration is the next step.

## Why

Home Assistant can adjust settings on an *already-bonded* home theater, but it
cannot **create or dissolve** bonds — no stereo pairing, no adding/removing
surrounds. (Confirmed by the built-in Sonos integration's own maintainer.) Sonos
Studio fills that gap over the local UPnP/SOAP API on port 1400 — no cloud, no
account, everything stays on your network.

## What's here

- **`docs/SPIKE_FINDINGS.md`** — the validated backend spec: exact SOAP recipes,
  the channel-map format (`<soundbar>:CC;<sat>:LF` …), and the hard-won write
  strategy (one satellite per call, poll-until-settled, retry-on-`800`).
- **`design/ui-prototype.html`** — interactive UI prototype: a spatial
  home-theater stage, per-model speaker icons, chime-to-identify, and simple
  stereo pairing.
- **`design/icons.html`** — the line-icon set for the Sonos + Symfonisk range.

## Roadmap

1. **v0.1 — services:** HACS-installable custom component; `soco` discovery,
   coordinator, and services for stereo pair / surrounds / full home theater,
   with snapshot/restore safety.
2. **v0.2 — UI:** the drag-and-drop panel wired to those services.

## License

[MIT](LICENSE)
