/** Entry `edu-browser/core`: browser state, steps, goals, the made-up sites and the scenarios. No React, so a server can use it. */
import { type GradedTask, type GradeResult } from "./core/grade.ts";
import type { Op } from "./core/ops.ts";
export * from "./core/index.ts";
export { allSites, defaultWeb } from "./sites/index.ts";
export { scenarios } from "./scenarios/index.ts";
export { referenceOps } from "./scenarios/solutions.ts";
export type { Scenario } from "./scenarios/types.ts";
/** Grades a log against a task on the built-in sites: builds the start, replays the steps and checks the goals. */
export declare const grade: (task: GradedTask, ops: ReadonlyArray<Op>) => GradeResult;
