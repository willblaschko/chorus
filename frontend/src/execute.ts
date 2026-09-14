// Pure executor: run the scheduler's lanes of ops against Home Assistant.
//
// The scheduler (apply.ts) groups atomic ops into "lanes". Ops sharing a device
// live in the same lane and MUST run one-at-a-time in order; different lanes are
// independent and run in parallel. This module owns nothing but the running of
// those lanes: no DOM, no Lit — just a HassLike + lanes in, progress out.

import type { Op } from "./apply.js";

export interface HassLike {
  callService(domain: string, service: string, data?: Record<string, unknown>): Promise<unknown>;
}

export type OpStatus = "pending" | "running" | "done" | "error" | "skipped";

export interface OpProgress {
  op: Op;
  status: OpStatus;
  error?: string;
}

export interface RunCallbacks {
  // Called with the FULL progress array whenever any op's status changes,
  // so a UI can re-render. Same array identity is fine to reuse; call it eagerly.
  onUpdate?(progress: readonly OpProgress[]): void;
}

// Read a human-readable message out of whatever was thrown.
function errorMessage(err: unknown): string {
  return (err as { message?: string } | null | undefined)?.message ?? String(err);
}

// Run all lanes. Lanes run concurrently (Promise.all across lanes). Within a lane,
// ops run strictly sequentially (await each before the next). If an op throws, mark
// it "error" and mark every REMAINING op in that SAME lane "skipped" (halt dependents);
// other lanes keep running. Never rejects for a service failure — it resolves once every
// lane settles, returning the final progress for all ops (in the original lane/op order).
export function runApply(
  hass: HassLike,
  lanes: Op[][],
  cb?: RunCallbacks
): Promise<OpProgress[]> {
  // Flat progress array in original lane/op order. Each lane's ops map to a
  // contiguous slice starting at that lane's base offset, so the returned array
  // preserves the exact lane-then-op ordering of the input.
  const progress: OpProgress[] = [];
  const laneOffsets: number[] = [];
  for (const lane of lanes) {
    laneOffsets.push(progress.length);
    for (const op of lane) {
      progress.push({ op, status: "pending" });
    }
  }

  const emit = (): void => {
    cb?.onUpdate?.(progress);
  };

  // Initial all-pending render.
  emit();

  async function runLane(lane: Op[], base: number): Promise<void> {
    let failed = false;
    for (let i = 0; i < lane.length; i++) {
      const entry = progress[base + i];
      if (failed) {
        entry.status = "skipped";
        emit();
        continue;
      }
      entry.status = "running";
      emit();
      try {
        await hass.callService(entry.op.service.domain, entry.op.service.service, entry.op.service.data);
        entry.status = "done";
        emit();
      } catch (err) {
        entry.status = "error";
        entry.error = errorMessage(err);
        emit();
        failed = true;
      }
    }
  }

  return Promise.all(lanes.map((lane, li) => runLane(lane, laneOffsets[li]))).then(() => progress);
}
