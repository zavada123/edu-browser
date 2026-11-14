import { type Goal, type GoalResult } from "../core/goals.ts";
import { type Op } from "../core/ops.ts";
import type { BrowserState, Web } from "../core/state.ts";
import type { Url } from "../core/url.ts";
export type Panel = "history" | "bookmarks" | "tabs" | "downloads";
export type Menu = {
    readonly kind: "link";
    readonly x: number;
    readonly y: number;
    readonly url: Url;
} | {
    readonly kind: "bookmark";
    readonly x: number;
    readonly y: number;
    readonly id: number;
} | {
    readonly kind: "folder";
    readonly x: number;
    readonly y: number;
    readonly folder: string;
};
export interface UiState {
    readonly web: Web;
    readonly browser: BrowserState;
    /** Every step the student made, for the server. Only steps that worked. */
    readonly ops: ReadonlyArray<Op>;
    readonly panel: Panel | null;
    readonly menu: Menu | null;
    /** The star dialog is open. */
    readonly bookmarkDialog: boolean;
    /** The bar of «Знайти на сторінці» (Ctrl+F) is open. */
    readonly findBar: boolean;
    readonly message: string | null;
    readonly results: ReadonlyArray<GoalResult> | null;
    /** Grows on «Оновити», so the page plays its loading look again. */
    readonly reloads: number;
    /** Grows on «Почати спочатку», so fields typed into are emptied. */
    readonly resets: number;
}
export type UiAction = {
    readonly type: "op";
    readonly op: Op;
}
/** Several steps that only make sense together, like a new folder and a bookmark in it. All or none. */
 | {
    readonly type: "ops";
    readonly ops: ReadonlyArray<Op>;
} | {
    readonly type: "panel";
    readonly panel: Panel | null;
} | {
    readonly type: "menu";
    readonly menu: Menu | null;
} | {
    readonly type: "bookmarkDialog";
    readonly open: boolean;
} | {
    readonly type: "findBar";
    readonly open: boolean;
} | {
    readonly type: "notify";
    readonly message: string;
} | {
    readonly type: "dismiss";
} | {
    readonly type: "check";
    readonly goals: ReadonlyArray<Goal>;
} | {
    readonly type: "reset";
    readonly browser: BrowserState;
};
export declare const initialUi: (web: Web, browser: BrowserState, ops?: ReadonlyArray<Op>) => UiState;
export declare const reducer: (state: UiState, action: UiAction) => UiState;
