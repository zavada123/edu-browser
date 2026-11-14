import type { Op } from "../core/ops.ts";
import { type Web } from "../core/state.ts";
import type { Scenario } from "./types.ts";
/** The reference log of a scenario. Throws when the scenario has no solution or the solution is broken. */
export declare const referenceOps: (scenario: Scenario, web?: Web) => ReadonlyArray<Op>;
