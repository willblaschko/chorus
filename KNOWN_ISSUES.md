# Known issues

A running list of rough edges we're aware of, with workarounds. Chorus configures Sonos
over the local, undocumented UPnP/SOAP API, so some behavior comes down to what the
speakers themselves accept — and a few of those edges are noted here rather than papered
over. If you hit something not listed, please open an issue.

---

## 1. Moving a sub directly between sets can occasionally fail

**Symptom.** Dragging a **Sub / Sub Mini** straight out of one bond and onto another in a
single **Apply** — e.g. from a home theater onto a stereo pair — sometimes fails on the
"add Sub" step with a Sonos rejection (SOAP error **1034**). Adding a sub that's already
free succeeds normally.

**Who sees it.** It's intermittent and seems tied to how quickly a given speaker settles.
In testing it was reliable on an **Arc** home theater and flaky on a **Symfonisk** stereo
pair — Symfonisk models appear to settle more slowly after un-bonding.

**Why.** A sub is invisible in the topology whether it's bonded or free, and it can't be
re-bonded until it has fully settled back to its own standalone zone. Chorus waits for
that "free" state, pauses to let it stabilize, then makes **one** clean bond attempt. (We
deliberately do *not* retry: each failed attempt briefly pulls the sub out and it reverts,
and retrying just fires into that transition and thrashes it — which made things worse,
not better.) If a slow speaker hasn't finished settling when that single attempt lands,
Sonos rejects it. The exact meaning of code 1034 is undocumented; Chorus now surfaces the
device's own error description alongside the code when it sends one.

**Workaround (reliable).** Do it in two steps instead of one:

1. Remove the sub from its current set and **Apply**.
2. Wait for it to appear in the **Available subs** card on the Overview.
3. Use **Add** on that card to bond it to the new set.

Bonding an already-free sub works every time.

**Status.** Low priority — moving a sub between sets is uncommon, and the two-step path is
dependable. Not currently worth more retry heuristics (they backfired).

---

<!-- Template for new entries:

## N. Short title

**Symptom.** What the user sees.
**Who sees it.** Conditions / hardware.
**Why.** Root cause as understood.
**Workaround.** Steps, if any.
**Status.** Priority / plan.

-->
