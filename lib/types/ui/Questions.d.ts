import type { Question } from "../core/state.ts";
import type { UiAction } from "./store.ts";
/** The questions of the task: the student writes what they found on the sites. */
export declare const Questions: ({ questions, answers, dispatch }: {
    readonly questions: ReadonlyArray<Question>;
    readonly answers: Readonly<Record<string, string>>;
    readonly dispatch: (a: UiAction) => void;
}) => import("react").JSX.Element | null;
