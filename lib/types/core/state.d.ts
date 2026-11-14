import { type Site, type SiteMap } from "./sites.ts";
import { type Url } from "./url.ts";
/** How a page got into a tab. Goals can ask for it: «відкрий сторінку з історії», «надрукуй адресу». */
export type How = "start" | "typed" | "link" | "bookmark" | "history" | "home" | "back" | "forward" | "popup";
export interface TabEntry {
    readonly url: Url;
    readonly how: How;
}
/** A tab keeps its own list of pages for «Назад» and «Вперед». */
export interface Tab {
    readonly id: number;
    readonly stack: ReadonlyArray<TabEntry>;
    readonly index: number;
    /** How the page in front got here; after «Назад» it is `back`, whatever opened the page first. */
    readonly via: How;
}
/** `folder: ""` is the bookmarks bar itself. */
export interface Bookmark {
    readonly id: number;
    readonly url: Url;
    readonly title: string;
    readonly folder: string;
}
/** `day: 0` is today, `-1` yesterday, and so on. */
export interface HistoryEntry {
    readonly id: number;
    readonly url: Url;
    readonly title: string;
    readonly day: number;
}
/** Actions counted for goals like «повернись кнопкою „Назад“». */
export type Action = "back" | "forward" | "reload" | "newTab" | "closeTab" | "home" | "deleteHistory" | "clearHistory" | "callAdult" | "report";
/**
 * A window that pops up over the page: an advert, «Дозволити сповіщення?», a prize. The scenario decides
 * what it says and when it shows: at the start, or when the student opens the page `at`.
 */
export interface PopupSpec {
    readonly id: string;
    readonly icon?: string;
    readonly title: string;
    readonly text: string;
    /** The tempting button: «Забрати приз». */
    readonly accept: string;
    /** Where the tempting button leads; it opens in a new tab. */
    readonly acceptUrl?: Url;
    /** The other button. The ✕ in the corner does the same. */
    readonly decline?: string;
    /** Shows when this page (or any page of this site, for a bare host) opens. Without it: at the start. */
    readonly at?: Url;
}
export type PopupStatus = "waiting" | "open" | "closed" | "accepted";
export interface PopupState {
    readonly spec: PopupSpec;
    readonly status: PopupStatus;
}
/** `warned`: the antivirus found a threat and waits for the student's choice. */
export type DownloadStatus = "done" | "warned" | "deleted" | "opened";
export interface Download {
    readonly id: number;
    readonly file: string;
    readonly from: Url;
    readonly virus: boolean;
    readonly status: DownloadStatus;
}
export interface BrowserState {
    readonly tabs: ReadonlyArray<Tab>;
    readonly activeTab: number;
    readonly nextTabId: number;
    /** Ids of bookmarks and history entries. They only grow, so the same log always gives the same ids. */
    readonly nextId: number;
    readonly bookmarks: ReadonlyArray<Bookmark>;
    readonly folders: ReadonlyArray<string>;
    /** Newest last. */
    readonly history: ReadonlyArray<HistoryEntry>;
    /** Every page the student opened in this attempt, also the ones later removed from history. */
    readonly visits: ReadonlyArray<TabEntry>;
    readonly used: Readonly<Partial<Record<Action, number>>>;
    readonly home: Url;
    readonly popups: ReadonlyArray<PopupState>;
    /** Ids of forms and chats the student sent something from. What they typed is never kept. */
    readonly submitted: ReadonlyArray<string>;
    readonly downloads: ReadonlyArray<Download>;
}
/** The made-up web a scenario runs in. */
export interface Web {
    readonly list: ReadonlyArray<Site>;
    readonly map: SiteMap;
}
export declare const makeWeb: (list: ReadonlyArray<Site>) => Web;
export interface StartSpec {
    /** Open tabs; none gives one new tab. */
    readonly tabs?: ReadonlyArray<Url>;
    /** Which of `tabs` is in front, from 0. Default: the first. */
    readonly active?: number;
    readonly bookmarks?: ReadonlyArray<{
        readonly url: Url;
        readonly title?: string;
        readonly folder?: string;
    }>;
    /** Bookmark folders that exist at the start, even empty. */
    readonly folders?: ReadonlyArray<string>;
    /** Pages visited before the lesson; `day` −1 is yesterday (the default). */
    readonly history?: ReadonlyArray<{
        readonly url: Url;
        readonly day?: number;
    }>;
    /** The page of «Домашня сторінка». Default: the search site. */
    readonly home?: Url;
    readonly popups?: ReadonlyArray<PopupSpec>;
}
export declare const DEFAULT_HOME: Url;
export declare const currentEntry: (tab: Tab) => TabEntry;
export declare const currentUrl: (tab: Tab) => Url;
export declare const activeTabOf: (state: BrowserState) => Tab | undefined;
/** A bare host covers every page of its site. */
export declare const popupMatches: (at: Url, url: Url) => boolean;
export declare const buildState: (web: Web, start?: StartSpec) => BrowserState;
