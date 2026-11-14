import type { Goal } from "../core/goals.ts"
import type { StartSpec } from "../core/state.ts"

/** One exercise: what is open at the start, what to do, and how to check it. */
export interface Scenario {
  readonly id: string
  /** School grade shown on the task card; 0 hides it. */
  readonly grade: number
  readonly title: string
  /** The lesson passport it practises, `inf3-09`. */
  readonly lesson?: string
  /** The task as the student reads it. Short sentences, one action each. */
  readonly task: ReadonlyArray<string>
  readonly start: StartSpec
  readonly goals: ReadonlyArray<Goal>
  /** Large buttons and text for younger students (grades 3–4). */
  readonly large?: boolean
}
