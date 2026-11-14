import { type Action, type BrowserState, type How, type Web } from "./state.ts";
import { type Url } from "./url.ts";
/**
 * Conditions a scenario checks at the end. Authors pick them from this list, no programming needed.
 * Addresses are written as in the address bar: `космос.edu/місяць`. An address of a whole site
 * (`приз-телефон.win`) in `notVisited` covers every page of that site.
 */
export type Goal = ({
    readonly type: "activeTab";
    readonly url: Url;
    readonly how?: How;
}
/** The page in front is any page of this site. */
 | {
    readonly type: "activeSite";
    readonly host: string;
} | {
    readonly type: "tabOpen";
    readonly url: Url;
} | {
    readonly type: "tabCount";
    readonly equals: number;
}
/** At least `pages` tabs show different pages of one site. */
 | {
    readonly type: "siteTabs";
    readonly host: string;
    readonly pages: number;
} | {
    readonly type: "visited";
    readonly url: Url;
    readonly how?: How;
}
/** The student searched on the search site, and the query held every one of these words. */
 | {
    readonly type: "searched";
    readonly words: ReadonlyArray<string>;
} | {
    readonly type: "notVisited";
    readonly url: Url;
}
/** The student searched on a page with Ctrl+F, and the search held every one of these words. Optional: on this page. */
 | {
    readonly type: "foundOnPage";
    readonly words: ReadonlyArray<string>;
    readonly url?: Url;
}
/** The page zoom at the end is in this range, in percent: «збільш масштаб до 150 %». */
 | {
    readonly type: "zoom";
    readonly min?: number;
    readonly max?: number;
} | {
    readonly type: "used";
    readonly action: Action;
    readonly times?: number;
} | {
    readonly type: "bookmark";
    readonly url: Url;
    readonly folder?: string;
    readonly title?: string;
} | {
    readonly type: "noBookmark";
    readonly url: Url;
} | {
    readonly type: "folder";
    readonly name: string;
} | {
    readonly type: "historyHas";
    readonly url: Url;
} | {
    readonly type: "historyHasNot";
    readonly url: Url;
} | {
    readonly type: "historyCount";
    readonly equals: number;
}
/** The student sent / did not send the form or chat message with this id. */
 | {
    readonly type: "submitted";
    readonly form: string;
} | {
    readonly type: "notSubmitted";
    readonly form: string;
}
/** The popup was closed with ✕ or its safe button, without pressing the tempting one. */
 | {
    readonly type: "popupClosed";
    readonly id: string;
} | {
    readonly type: "downloaded";
    readonly file: string;
}
/** The file was downloaded and then deleted (after the antivirus warning, for example). */
 | {
    readonly type: "downloadDeleted";
    readonly file: string;
}
/** The file was never opened. */
 | {
    readonly type: "notOpened";
    readonly file: string;
}
/**
 * The answer to the question matches one of `accept`. Case, spaces, quotes, the stress mark and
 * the kind of apostrophe do not matter: «Остап Квітковий» = «остап  квітковий».
 */
 | {
    readonly type: "answer";
    readonly question: string;
    readonly accept: ReadonlyArray<string>;
}) & {
    readonly text?: string;
    readonly hint?: string;
};
export interface GoalResult {
    readonly goal: Goal;
    readonly ok: boolean;
    /** What the student sees in the task list. */
    readonly text: string;
    /** Shown only when the condition is not met. */
    readonly hint: string;
}
/** Compares answers the way a teacher would: no case, extra spaces, quotes, stress marks or apostrophe kinds. */
export declare const normalizeAnswer: (s: string) => string;
/** Default wording of a goal for the task list. */
export declare const describeGoal: (web: Web, goal: Goal) => string;
export declare const checkGoals: (web: Web, state: BrowserState, goals: ReadonlyArray<Goal>) => ReadonlyArray<GoalResult>;
export declare const allMet: (results: ReadonlyArray<GoalResult>) => boolean;
