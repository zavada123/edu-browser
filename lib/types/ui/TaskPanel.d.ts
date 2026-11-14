import type { Scenario } from "../scenarios/types.ts";
import type { UiAction, UiState } from "./store.ts";
interface Props {
    readonly scenario: Scenario;
    readonly state: UiState;
    readonly open: boolean;
    readonly onToggle: () => void;
    readonly onReset: () => void;
    readonly dispatch: (action: UiAction) => void;
    readonly selfCheck: boolean;
    readonly next?: NextExercise | undefined;
    readonly onNext: () => void;
}
/** The exercise the page opens after this one. */
export interface NextExercise {
    readonly title: string;
    readonly go: () => void;
}
/** The task card: what to do, the "Перевірити" button and the result of each condition. */
export declare const TaskPanel: ({ scenario, state, open, onToggle, onReset, dispatch, selfCheck, next, onNext }: Props) => import("react").JSX.Element;
export {};
