import { type Site, type SiteMap } from "./sites.ts";
import { type Url } from "./url.ts";
/** How a page got into a tab. Goals can ask for it: «відкрий сторінку з історії», «надрукуй адресу». */
export type How = "start" | "typed" | "link" | "bookmark" | "history" | "home" | "back" | "forward";
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
export type Action = "back" | "forward" | "reload" | "newTab" | "closeTab" | "home" | "deleteHistory" | "clearHistory";
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
}
export declare const DEFAULT_HOME: Url;
export declare const currentEntry: (tab: Tab) => TabEntry;
export declare const currentUrl: (tab: Tab) => Url;
export declare const activeTabOf: (state: BrowserState) => Tab | undefined;
export declare const buildState: (web: Web, start?: StartSpec) => BrowserState;
