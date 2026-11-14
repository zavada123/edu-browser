import { canonicalUrl, type Site, type SiteMap, siteMap, titleOf } from "./sites.ts"
import { NEW_TAB, type Url } from "./url.ts"

/** How a page got into a tab. Goals can ask for it: «відкрий сторінку з історії», «надрукуй адресу». */
export type How = "start" | "typed" | "link" | "bookmark" | "history" | "home" | "back" | "forward"

export interface TabEntry {
  readonly url: Url
  readonly how: How
}

/** A tab keeps its own list of pages for «Назад» and «Вперед». */
export interface Tab {
  readonly id: number
  readonly stack: ReadonlyArray<TabEntry>
  readonly index: number
  /** How the page in front got here; after «Назад» it is `back`, whatever opened the page first. */
  readonly via: How
}

/** `folder: ""` is the bookmarks bar itself. */
export interface Bookmark {
  readonly id: number
  readonly url: Url
  readonly title: string
  readonly folder: string
}

/** `day: 0` is today, `-1` yesterday, and so on. */
export interface HistoryEntry {
  readonly id: number
  readonly url: Url
  readonly title: string
  readonly day: number
}

/** Actions counted for goals like «повернись кнопкою „Назад“». */
export type Action = "back" | "forward" | "reload" | "newTab" | "closeTab" | "home" | "deleteHistory" | "clearHistory"

export interface BrowserState {
  readonly tabs: ReadonlyArray<Tab>
  readonly activeTab: number
  readonly nextTabId: number
  /** Ids of bookmarks and history entries. They only grow, so the same log always gives the same ids. */
  readonly nextId: number
  readonly bookmarks: ReadonlyArray<Bookmark>
  readonly folders: ReadonlyArray<string>
  /** Newest last. */
  readonly history: ReadonlyArray<HistoryEntry>
  /** Every page the student opened in this attempt, also the ones later removed from history. */
  readonly visits: ReadonlyArray<TabEntry>
  readonly used: Readonly<Partial<Record<Action, number>>>
  readonly home: Url
}

/** The made-up web a scenario runs in. */
export interface Web {
  readonly list: ReadonlyArray<Site>
  readonly map: SiteMap
}

export const makeWeb = (list: ReadonlyArray<Site>): Web => ({ list, map: siteMap(list) })

export interface StartSpec {
  /** Open tabs; none gives one new tab. */
  readonly tabs?: ReadonlyArray<Url>
  /** Which of `tabs` is in front, from 0. Default: the first. */
  readonly active?: number
  readonly bookmarks?: ReadonlyArray<{ readonly url: Url; readonly title?: string; readonly folder?: string }>
  /** Bookmark folders that exist at the start, even empty. */
  readonly folders?: ReadonlyArray<string>
  /** Pages visited before the lesson; `day` −1 is yesterday (the default). */
  readonly history?: ReadonlyArray<{ readonly url: Url; readonly day?: number }>
  /** The page of «Домашня сторінка». Default: the search site. */
  readonly home?: Url
}

export const DEFAULT_HOME: Url = "пошук.edu"

export const currentEntry = (tab: Tab): TabEntry => tab.stack[tab.index] ?? { url: NEW_TAB, how: "start" }
export const currentUrl = (tab: Tab): Url => currentEntry(tab).url

export const activeTabOf = (state: BrowserState): Tab | undefined => state.tabs.find((t) => t.id === state.activeTab)

export const buildState = (web: Web, start: StartSpec = {}): BrowserState => {
  const url = (u: Url) => canonicalUrl(web.map, u)
  const tabUrls = start.tabs !== undefined && start.tabs.length > 0 ? start.tabs.map(url) : [NEW_TAB]
  const tabs: Tab[] = tabUrls.map((u, i) => ({ id: i + 1, stack: [{ url: u, how: "start" }], index: 0, via: "start" }))
  let nextId = 1
  const bookmarks: Bookmark[] = (start.bookmarks ?? []).map((b) => ({
    id: nextId++,
    url: url(b.url),
    title: b.title ?? titleOf(web.map, url(b.url)),
    folder: b.folder ?? ""
  }))
  const folders = [...new Set([...(start.folders ?? []), ...bookmarks.map((b) => b.folder).filter((f) => f !== "")])]
  const startHistory: HistoryEntry[] = (start.history ?? []).map((h) => ({ id: nextId++, url: url(h.url), title: titleOf(web.map, url(h.url)), day: h.day ?? -1 }))
  // Tabs open at the start were visited today, as if the student had just opened them.
  const tabHistory: HistoryEntry[] = tabUrls.filter((u) => u !== NEW_TAB).map((u) => ({ id: nextId++, url: u, title: titleOf(web.map, u), day: 0 }))
  const active = tabs[Math.min(Math.max(start.active ?? 0, 0), tabs.length - 1)]?.id ?? 1
  return {
    tabs,
    activeTab: active,
    nextTabId: tabs.length + 1,
    nextId,
    bookmarks,
    folders,
    history: [...startHistory, ...tabHistory],
    visits: [],
    used: {},
    home: url(start.home ?? DEFAULT_HOME)
  }
}
