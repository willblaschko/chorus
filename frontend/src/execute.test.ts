import { describe, it, expect, vi } from "vitest";
import type { Op } from "./apply.js";
import { runApply, type HassLike, type OpProgress, type OpStatus } from "./execute.js";

// ── Test helpers ──────────────────────────────────────────────────────────────

// Minimal Op matching apply.ts's shape. The service name doubles as the lookup
// key in the controllable fake, so each op in a test gets a distinct name.
function op(service: string, touches: string[] = [service]): Op {
  return {
    type: "move",
    touches,
    service: { domain: "chorus", service, data: { service } },
    summary: service,
  };
}

interface Deferred {
  resolve: (v?: unknown) => void;
  reject: (e: unknown) => void;
  promise: Promise<unknown>;
}

// A HassLike whose every callService returns a promise we control by hand,
// keyed by the service name. Records all calls in order so tests can assert
// what started, when, and with which args.
function makeHass() {
  const calls: Array<{ domain: string; service: string; data?: Record<string, unknown> }> = [];
  const deferreds = new Map<string, Deferred>();

  const hass: HassLike = {
    callService(domain, service, data) {
      calls.push({ domain, service, data });
      let resolve!: (v?: unknown) => void;
      let reject!: (e: unknown) => void;
      const promise = new Promise<unknown>((res, rej) => {
        resolve = res as (v?: unknown) => void;
        reject = rej;
      });
      deferreds.set(service, { resolve, reject, promise });
      return promise;
    },
  };

  return {
    hass,
    calls,
    // Has callService(service) been invoked yet?
    started: (service: string) => deferreds.has(service),
    resolve: (service: string, value?: unknown) => deferreds.get(service)!.resolve(value),
    reject: (service: string, err: unknown) => {
      const d = deferreds.get(service)!;
      d.reject(err);
      // runApply awaits and handles this; swallow the raw rejection so the test
      // runner doesn't flag it as unhandled.
      d.promise.catch(() => {});
    },
    serviceNames: () => calls.map((c) => c.service),
  };
}

// A macrotask tick drains the pending microtask queue.
const flush = () => new Promise((r) => setTimeout(r, 0));

function statusOf(progress: readonly OpProgress[], service: string) {
  return progress.find((p) => p.op.service.service === service)?.status;
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("runApply", () => {
  it("happy path: every op ends done; each service called once with right args", async () => {
    const c = makeHass();
    const lanes: Op[][] = [
      [op("a1", ["x"]), op("a2", ["x"])],
      [op("b1", ["y"])],
    ];

    const p = runApply(c.hass, lanes);

    // Lane 1's first op (a1) and lane 2's op (b1) start immediately (parallel).
    await flush();
    expect(c.started("a1")).toBe(true);
    expect(c.started("b1")).toBe(true);
    // a2 waits behind a1.
    expect(c.started("a2")).toBe(false);

    c.resolve("a1");
    c.resolve("b1");
    await flush();
    // Now a2 is unblocked.
    expect(c.started("a2")).toBe(true);
    c.resolve("a2");

    const progress = await p;
    expect(progress.map((x) => x.status)).toEqual(["done", "done", "done"]);
    expect(progress.every((x) => x.error === undefined)).toBe(true);

    // Each service called exactly once, with the op's exact args.
    expect(c.calls).toHaveLength(3);
    expect(c.calls).toEqual([
      { domain: "chorus", service: "a1", data: { service: "a1" } },
      { domain: "chorus", service: "b1", data: { service: "b1" } },
      { domain: "chorus", service: "a2", data: { service: "a2" } },
    ]);
  });

  it("parallelism across lanes: both lanes have a running op concurrently", async () => {
    const c = makeHass();
    const lanes: Op[][] = [[op("L1", ["x"])], [op("L2", ["y"])]];

    const p = runApply(c.hass, lanes);
    await flush();

    // Neither has resolved yet, yet BOTH lanes' first op has started —
    // they are running concurrently.
    expect(c.started("L1")).toBe(true);
    expect(c.started("L2")).toBe(true);
    expect(c.serviceNames()).toEqual(["L1", "L2"]);

    c.resolve("L1");
    c.resolve("L2");
    const progress = await p;
    expect(progress.map((x) => x.status)).toEqual(["done", "done"]);
  });

  it("serial within a lane: op 2 does not start until op 1 resolves", async () => {
    const c = makeHass();
    const lanes: Op[][] = [[op("first", ["x"]), op("second", ["x"])]];

    const p = runApply(c.hass, lanes);
    await flush();

    // Only op 1 has started.
    expect(c.started("first")).toBe(true);
    expect(c.started("second")).toBe(false);

    // Even after several ticks, op 2 stays blocked while op 1 is pending.
    await flush();
    expect(c.started("second")).toBe(false);

    c.resolve("first");
    await flush();
    // Now — and only now — op 2 starts.
    expect(c.started("second")).toBe(true);
    expect(c.serviceNames()).toEqual(["first", "second"]);

    c.resolve("second");
    const progress = await p;
    expect(progress.map((x) => x.status)).toEqual(["done", "done"]);
  });

  it("failure isolation: a lane's op errors, its rest is skipped, other lanes finish", async () => {
    const c = makeHass();
    const lanes: Op[][] = [
      [op("boom", ["x"]), op("after", ["x"])], // lane 1: boom fails, after skipped
      [op("ok", ["y"])], // lane 2: unaffected
    ];

    const p = runApply(c.hass, lanes);
    await flush();

    // Lane 1's first op and lane 2's op start in parallel.
    expect(c.started("boom")).toBe(true);
    expect(c.started("ok")).toBe(true);
    expect(c.started("after")).toBe(false);

    c.reject("boom", new Error("nope"));
    c.resolve("ok");
    const progress = await p;

    // Order preserved: [boom, after, ok].
    expect(progress.map((x) => x.status)).toEqual(["error", "skipped", "done"]);
    expect(statusOf(progress, "boom")).toBe("error");
    expect(statusOf(progress, "after")).toBe("skipped");
    expect(statusOf(progress, "ok")).toBe("done");

    // Error message extracted from the thrown Error.
    expect(progress.find((x) => x.op.service.service === "boom")?.error).toBe("nope");
    // The skipped op's service was never actually called.
    expect(c.started("after")).toBe(false);
  });

  it("extracts a string error when a non-Error is thrown", async () => {
    const c = makeHass();
    const lanes: Op[][] = [[op("bad", ["x"])]];

    const p = runApply(c.hass, lanes);
    await flush();
    c.reject("bad", "plain string failure");
    const progress = await p;

    expect(progress[0].status).toBe("error");
    expect(progress[0].error).toBe("plain string failure");
  });

  it("onUpdate fires on every transition, ending with correct statuses in order", async () => {
    const c = makeHass();
    // The contract permits reusing the same array identity, so snapshot the
    // statuses at each call rather than trusting the (mutating) array later.
    const snapshots: OpStatus[][] = [];
    const onUpdate = vi.fn((progress: readonly OpProgress[]) => {
      snapshots.push(progress.map((x) => x.status));
    });
    const lanes: Op[][] = [[op("a1", ["x"]), op("a2", ["x"])], [op("b1", ["y"])]];

    const p = runApply(c.hass, lanes, { onUpdate });

    // First call is the initial all-pending render.
    expect(onUpdate).toHaveBeenCalled();
    expect(snapshots[0]).toEqual(["pending", "pending", "pending"]);

    await flush();
    c.resolve("a1");
    c.resolve("b1");
    await flush();
    c.resolve("a2");
    const progress = await p;

    // Final resolved array: original lane/op order.
    expect(progress.map((x) => x.status)).toEqual(["done", "done", "done"]);

    // Transitions observed: initial + running/done per op → several updates.
    // (3 ops × running+done = 6, plus 1 initial = 7 total.)
    expect(onUpdate).toHaveBeenCalledTimes(7);

    // Last snapshot reflects the final state.
    expect(snapshots[snapshots.length - 1]).toEqual(["done", "done", "done"]);
  });
});
