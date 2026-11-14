import { type BrowserState, type Web } from "./state.ts";
import { type Url } from "./url.ts";
/**
 * One step of the student, as the trainer recorded it. A server builds the start state again,
 * replays the log and checks the goals itself, so the trainer cannot report a result that did not happen.
 * Every step acts on the tab in front, except the ones that name a tab.
 */
export type Op = 
/** `how: "link"` must be a link on the page in front; `"bookmark"` and `"history"` must exist there. */
{
    readonly op: "navigate";
    readonly url: Url;
    readonly how: "typed" | "link" | "bookmark" | "history" | "home";
} | {
    readonly op: "back";
} | {
    readonly op: "forward";
} | {
    readonly op: "reload";
}
/** Without `url`: an empty new tab. With it: a link (or a bookmark, a history entry) opened in a new tab. */
 | {
    readonly op: "newTab";
    readonly url?: Url;
    readonly how?: "link" | "bookmark" | "history";
} | {
    readonly op: "closeTab";
    readonly tab: number;
} | {
    readonly op: "switchTab";
    readonly tab: number;
}
/** Bookmarks the page in front. `folder: ""` is the bookmarks bar. */
 | {
    readonly op: "addBookmark";
    readonly title: string;
    readonly folder: string;
} | {
    readonly op: "renameBookmark";
    readonly id: number;
    readonly title: string;
} | {
    readonly op: "moveBookmark";
    readonly id: number;
    readonly folder: string;
} | {
    readonly op: "deleteBookmark";
    readonly id: number;
} | {
    readonly op: "addFolder";
    readonly name: string;
} | {
    readonly op: "deleteHistory";
    readonly id: number;
} | {
    readonly op: "clearHistory";
}
/** The student pressed the button of a form or sent a chat message on the page in front. */
 | {
    readonly op: "submitForm";
    readonly form: string;
}
/** «Поскаржитися» in a chat on the page in front. */
 | {
    readonly op: "report";
    readonly form: string;
}
/** «Покликати дорослого»: always possible. */
 | {
    readonly op: "callAdult";
} | {
    readonly op: "closePopup";
    readonly id: string;
} | {
    readonly op: "acceptPopup";
    readonly id: string;
}
/** The student's answer to a question of the task: a word, a number, an author. */
 | {
    readonly op: "answer";
    readonly question: string;
    readonly text: string;
}
/** Downloads a file offered on the page in front. */
 | {
    readonly op: "download";
    readonly file: string;
} | {
    readonly op: "deleteDownload";
    readonly id: number;
} | {
    readonly op: "openDownload";
    readonly id: number;
}
/** A search on the page in front (Ctrl+F), recorded when the student presses Enter. */
 | {
    readonly op: "find";
    readonly text: string;
}
/** Page zoom in percent: one of `ZOOM_LEVELS`. */
 | {
    readonly op: "zoom";
    readonly level: number;
};
export type OpResult = {
    readonly ok: true;
    readonly state: BrowserState;
} | {
    readonly ok: false;
    readonly error: string;
};
/** A real task takes 5–60 steps. The limits keep a forged log from using much time or memory on the server. */
export declare const MAX_OPS = 500;
export declare const MAX_TABS = 20;
export declare const MAX_BOOKMARKS = 100;
export declare const MAX_FOLDERS = 20;
export declare const MAX_HISTORY = 600;
export declare const MAX_NAME = 60;
export declare const MAX_URL = 200;
export declare const MAX_DOWNLOADS = 50;
export declare const MAX_ANSWER = 80;
export declare const MAX_FINDS = 50;
/** The zoom steps of Ctrl + and Ctrl −, as in desktop browsers. */
export declare const ZOOM_LEVELS: ReadonlyArray<number>;
/** The next zoom step up (`1`) or down (`-1`); the same level at the end of the list. */
export declare const nextZoom: (level: number, delta: 1 | -1) => number;
export declare const applyOp: (web: Web, state: BrowserState, op: Op) => OpResult;
export type ReplayResult = {
    readonly ok: true;
    readonly state: BrowserState;
}
/** `index` is the first step that could not be made; -1 when the log is too long. */
 | {
    readonly ok: false;
    readonly index: number;
    readonly error: string;
};
/** Applies the log in order. One impossible step makes the whole log invalid: the trainer never records one. */
export declare const replay: (web: Web, start: BrowserState, ops: ReadonlyArray<Op>) => ReplayResult;
