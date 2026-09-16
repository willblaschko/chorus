// Thin orchestration layer: tie the pure scheduler (apply.ts) and executor
// (execute.ts) together into a plan + live change-bar rows for the editor.
//
// NO DOM, NO Lit — just pure functions over plain data. `chorus-changebar` is
// imported TYPE-ONLY so no Lit runtime is pulled in.

import { computeOps, planLanes, type LayoutMap, type Op } from "./apply.js";
import { runApply, type HassLike, type OpProgress } from "./execute.js";
import type { ChangeRow } from "./chorus-changebar.js";

export interface StagedPlan {
  ops: Op[]; // flattened in EXECUTION order (lane-flattened), matches rows 1:1
  lanes: Op[][]; // from planLanes
  rows: ChangeRow[]; // one per op, in the SAME order as `ops`, all status "pending"
}

/**
 * Diff `applied` -> `working`, plan lanes, and derive change-bar rows.
 *
 * `ops` and `rows` are ordered by FLATTENING `lanes` (lane 0's ops, then lane
 * 1's ops, ...), because runApply returns progress in that same order — so
 * row[i] corresponds to the flattened op[i]. Each row.summary = op.summary.
 */
export function planChanges(applied: LayoutMap, working: LayoutMap): StagedPlan {
  const lanes = planLanes(computeOps(applied, working));
  // Flatten in lane order to match runApply's flat progress ordering.
  const ops: Op[] = lanes.flat();
  const rows: ChangeRow[] = ops.map((op) => ({ summary: op.summary, status: "pending" }));
  return { ops, lanes, rows };
}

/**
 * Run the plan's lanes via runApply. On every progress update, map each
 * OpProgress to a ChangeRow (row[i].status = progress[i].status) and invoke
 * onRows with the fresh rows array so the UI re-renders live. Resolves with
 * the final rows.
 *
 * runApply's progress is in lane-flattened order (it builds a flat array over
 * lanes in order), so progress[i] lines up with plan.rows[i].
 */
export function applyPlan(
  hass: HassLike,
  plan: StagedPlan,
  onRows: (rows: ChangeRow[]) => void,
): Promise<ChangeRow[]> {
  const toRows = (progress: readonly OpProgress[]): ChangeRow[] =>
    progress.map((p) => ({ summary: p.op.summary, status: p.status, error: p.error }));

  return runApply(hass, plan.lanes, {
    onUpdate: (progress) => onRows(toRows(progress)),
  }).then((finalProgress) => toRows(finalProgress));
}

export function isEmpty(plan: StagedPlan): boolean {
  return plan.ops.length === 0;
}
