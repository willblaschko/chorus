import { describe, it, expect, vi } from "vitest";
import type { LayoutMap } from "./apply.js";
import type { HassLike } from "./execute.js";
import type { ChangeRow } from "./chorus-changebar.js";
import { planChanges, applyPlan, isEmpty } from "./staged.js";

// A layout with three standalone speakers.
function baseLayout(): LayoutMap {
  return {
    spk1: { room: "Kitchen", role: "solo", anchorUid: "spk1", name: "Kitchen One" },
    spk2: { room: "Office", role: "solo", anchorUid: "spk2", name: "Office L" },
    spk3: { room: "Office", role: "solo", anchorUid: "spk3", name: "Office R" },
  };
}

// Working state that differs by two independent edits:
//  - spk1 moves Kitchen -> Office  (move op, touches [spk1])
//  - spk2/spk3 become a stereo pair (create_pair op, touches [spk2, spk3])
function editedLayout(): LayoutMap {
  return {
    spk1: { room: "Office", role: "solo", anchorUid: "spk1", name: "Kitchen One" },
    spk2: { room: "Office", role: "pairL", anchorUid: "spk2", name: "Office L" },
    spk3: { room: "Office", role: "pairR", anchorUid: "spk2", name: "Office R" },
  };
}

// A HassLike that records every call and resolves.
function fakeHass(): HassLike & { calls: Array<[string, string, unknown]> } {
  const calls: Array<[string, string, unknown]> = [];
  return {
    calls,
    callService(domain, service, data) {
      calls.push([domain, service, data]);
      return Promise.resolve();
    },
  };
}

describe("planChanges", () => {
  it("produces an empty plan when there is no diff", () => {
    const layout = baseLayout();
    const plan = planChanges(layout, layout);
    expect(plan.ops).toEqual([]);
    expect(plan.rows).toEqual([]);
    expect(plan.lanes).toEqual([]);
    expect(isEmpty(plan)).toBe(true);
  });

  it("derives one pending row per op, summaries matching, in lane-flattened order", () => {
    const plan = planChanges(baseLayout(), editedLayout());

    // Two edits => two ops.
    expect(plan.ops.length).toBe(2);
    expect(isEmpty(plan)).toBe(false);

    // rows count == ops count.
    expect(plan.rows.length).toBe(plan.ops.length);

    // Each row matches its op and is pending.
    plan.rows.forEach((row, i) => {
      expect(row.summary).toBe(plan.ops[i].summary);
      expect(row.status).toBe("pending");
    });

    // ops order equals the lane-flattened order of lanes.
    expect(plan.ops).toEqual(plan.lanes.flat());

    // Sanity: the move is emitted before the pair creation, so it flattens first.
    expect(plan.ops[0].type).toBe("move");
    expect(plan.ops[1].type).toBe("create_pair");
  });
});

describe("applyPlan", () => {
  it("streams progressing rows and resolves with all rows done, in order", async () => {
    const plan = planChanges(baseLayout(), editedLayout());
    const hass = fakeHass();
    const onRows = vi.fn<(rows: ChangeRow[]) => void>();

    const finalRows = await applyPlan(hass, plan, onRows);

    // Every op was dispatched as a chorus service call.
    expect(hass.calls.length).toBe(plan.ops.length);
    expect(hass.calls.every(([domain]) => domain === "chorus")).toBe(true);

    // onRows fired live (initial all-pending render, plus each status change).
    expect(onRows.mock.calls.length).toBeGreaterThan(1);

    // The first callback is the initial all-pending snapshot.
    const firstRows = onRows.mock.calls[0][0];
    expect(firstRows.every((r) => r.status === "pending")).toBe(true);

    // At least one intermediate snapshot showed a "running" op.
    const sawRunning = onRows.mock.calls.some((c) => c[0].some((r) => r.status === "running"));
    expect(sawRunning).toBe(true);

    // Final rows: one per op, all done, summaries in the same (flattened) order.
    expect(finalRows.length).toBe(plan.ops.length);
    finalRows.forEach((row, i) => {
      expect(row.status).toBe("done");
      expect(row.summary).toBe(plan.ops[i].summary);
    });
  });
});
