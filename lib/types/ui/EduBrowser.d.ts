import { type Op } from "../core/ops.ts";
import { type Web } from "../core/state.ts";
import type { Scenario } from "../scenarios/types.ts";
import { type NextExercise } from "./TaskPanel.tsx";
import "./browser.css";
import "./rich-text.css";
interface Props {
    /** To show another scenario, give the component a new `key`, for example the scenario id. */
    readonly scenario: Scenario;
    /** Called after every check; `solved` is true when all conditions are met. */
    readonly onCheck?: (solved: boolean) => void;
    /** Called with the log of all steps each time it changes. A page that grades on its server sends this log. */
    readonly onChange?: (ops: ReadonlyArray<Op>) => void;
    /** A log saved earlier: the trainer starts with these steps made. An invalid log is ignored. */
    readonly initialOps?: ReadonlyArray<Op>;
    /** `false` hides «Перевірити» when the page checks the answer itself. */
    readonly selfCheck?: boolean;
    /** The exercise after this one: after a passed check the task card shows «Наступне завдання». */
    readonly next?: NextExercise;
    /** The made-up sites. Default: every built-in site. */
    readonly web?: Web;
}
/** The whole trainer for one scenario: a browser window with made-up sites and the task card. */
export declare const EduBrowser: ({ scenario, onCheck, onChange, initialOps, selfCheck, next, web }: Props) => import("react").JSX.Element;
export {};
