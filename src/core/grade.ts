import { allMet, checkGoals, type Goal, type GoalResult } from "./goals.ts"
import { type Op, replay } from "./ops.ts"
import { type BrowserState, buildState, type StartSpec, type Web } from "./state.ts"

/** What the server needs from a scenario to grade an answer. */
export interface GradedTask {
  readonly start: StartSpec
  readonly goals: ReadonlyArray<Goal>
}

export type GradeResult =
  | { readonly ok: true; readonly solved: boolean; readonly results: ReadonlyArray<GoalResult>; readonly state: BrowserState }
  | { readonly ok: false; readonly index: number; readonly error: string }

/** Builds the start state, replays the student's log and checks every goal. Never throws. */
export const gradeIn = (web: Web, task: GradedTask, ops: ReadonlyArray<Op>): GradeResult => {
  const replayed = replay(web, buildState(web, task.start), ops)
  if (!replayed.ok) return replayed
  const results = checkGoals(web, replayed.state, task.goals)
  return { ok: true, solved: allMet(results), results, state: replayed.state }
}
