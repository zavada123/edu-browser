import { blocksOn, canonicalUrl, linksOn, titleOf } from "./sites.ts"
import {
  type Action,
  activeTabOf,
  type BrowserState,
  currentUrl,
  type How,
  type PopupState,
  popupMatches,
  type Tab,
  type TabEntry,
  type Web
} from "./state.ts"
import { NEW_TAB, type Url } from "./url.ts"

/**
 * One step of the student, as the trainer recorded it. A server builds the start state again,
 * replays the log and checks the goals itself, so the trainer cannot report a result that did not happen.
 * Every step acts on the tab in front, except the ones that name a tab.
 */
export type Op =
  /** `how: "link"` must be a link on the page in front; `"bookmark"` and `"history"` must exist there. */
  | { readonly op: "navigate"; readonly url: Url; readonly how: "typed" | "link" | "bookmark" | "history" | "home" }
  | { readonly op: "back" }
  | { readonly op: "forward" }
  | { readonly op: "reload" }
  /** Without `url`: an empty new tab. With it: a link (or a bookmark, a history entry) opened in a new tab. */
  | { readonly op: "newTab"; readonly url?: Url; readonly how?: "link" | "bookmark" | "history" }
  | { readonly op: "closeTab"; readonly tab: number }
  | { readonly op: "switchTab"; readonly tab: number }
  /** Bookmarks the page in front. `folder: ""` is the bookmarks bar. */
  | { readonly op: "addBookmark"; readonly title: string; readonly folder: string }
  | { readonly op: "renameBookmark"; readonly id: number; readonly title: string }
  | { readonly op: "moveBookmark"; readonly id: number; readonly folder: string }
  | { readonly op: "deleteBookmark"; readonly id: number }
  | { readonly op: "addFolder"; readonly name: string }
  | { readonly op: "deleteHistory"; readonly id: number }
  | { readonly op: "clearHistory" }
  /** The student pressed the button of a form or sent a chat message on the page in front. */
  | { readonly op: "submitForm"; readonly form: string }
  /** «Поскаржитися» in a chat on the page in front. */
  | { readonly op: "report"; readonly form: string }
  /** «Покликати дорослого»: always possible. */
  | { readonly op: "callAdult" }
  | { readonly op: "closePopup"; readonly id: string }
  | { readonly op: "acceptPopup"; readonly id: string }
  /** The student's answer to a question of the task: a word, a number, an author. */
  | { readonly op: "answer"; readonly question: string; readonly text: string }
  /** Downloads a file offered on the page in front. */
  | { readonly op: "download"; readonly file: string }
  | { readonly op: "deleteDownload"; readonly id: number }
  | { readonly op: "openDownload"; readonly id: number }

export type OpResult = { readonly ok: true; readonly state: BrowserState } | { readonly ok: false; readonly error: string }

/** A real task takes 5–60 steps. The limits keep a forged log from using much time or memory on the server. */
export const MAX_OPS = 500
export const MAX_TABS = 20
export const MAX_BOOKMARKS = 100
export const MAX_FOLDERS = 20
export const MAX_HISTORY = 600
export const MAX_NAME = 60
export const MAX_URL = 200
export const MAX_DOWNLOADS = 50
export const MAX_ANSWER = 80

const fail = (error: string): OpResult => ({ ok: false, error })
const done = (state: BrowserState): OpResult => ({ ok: true, state })

const bump = (state: BrowserState, action: Action): BrowserState["used"] => ({ ...state.used, [action]: (state.used[action] ?? 0) + 1 })

/** The page joins today's history and the list of visits. The new-tab page does not. */
const recordVisit = (web: Web, state: BrowserState, entry: TabEntry): BrowserState => {
  if (entry.url === NEW_TAB) return state
  const history = [...state.history, { id: state.nextId, url: entry.url, title: titleOf(web.map, entry.url), day: 0 }].slice(-MAX_HISTORY)
  // A popup waiting for this page shows now, once.
  const popups = state.popups.map((p): PopupState => (p.status === "waiting" && p.spec.at !== undefined && popupMatches(p.spec.at, entry.url) ? { ...p, status: "open" } : p))
  return { ...state, history, popups, nextId: state.nextId + 1, visits: [...state.visits, entry].slice(-MAX_HISTORY) }
}

const replaceTab = (state: BrowserState, tab: Tab): BrowserState => ({ ...state, tabs: state.tabs.map((t) => (t.id === tab.id ? tab : t)) })

const cleanName = (name: string): string => name.replace(/\s+/g, " ").trim()

/** Checks that the student could really reach `url` this way from where they are. */
const reachable = (web: Web, state: BrowserState, url: Url, how: How): string | null => {
  if (url.length > MAX_URL) return "Задовга адреса"
  const tab = activeTabOf(state)
  switch (how) {
    case "typed":
      return url.trim().length > 0 ? null : "Порожня адреса"
    case "link":
      return tab && linksOn(web.list, web.map, currentUrl(tab)).includes(url) ? null : "На цій сторінці немає такого посилання"
    case "bookmark":
      return state.bookmarks.some((b) => b.url === url) ? null : "Немає такої закладки"
    case "history":
      return state.history.some((h) => h.url === url) ? null : "В історії немає такої сторінки"
    case "home":
      return url === state.home ? null : "Це не домашня сторінка"
    default:
      return "Невідомий спосіб переходу"
  }
}

const go = (web: Web, state: BrowserState, raw: Url, how: "typed" | "link" | "bookmark" | "history" | "home"): OpResult => {
  const url = canonicalUrl(web.map, raw)
  const problem = reachable(web, state, url, how)
  if (problem !== null) return fail(problem)
  const tab = activeTabOf(state)
  if (!tab) return fail("Немає відкритої вкладки")
  const entry: TabEntry = { url, how }
  // A new page drops the pages «Вперед» could return to, as in every browser.
  const next: Tab = { ...tab, stack: [...tab.stack.slice(0, tab.index + 1), entry].slice(-MAX_HISTORY), index: Math.min(tab.index + 1, MAX_HISTORY - 1), via: how }
  const moved = replaceTab(state, next)
  return done(recordVisit(web, how === "home" ? { ...moved, used: bump(moved, "home") } : moved, entry))
}

const step = (web: Web, state: BrowserState, delta: -1 | 1): OpResult => {
  const tab = activeTabOf(state)
  if (!tab) return fail("Немає відкритої вкладки")
  const index = tab.index + delta
  const target = tab.stack[index]
  if (!target) return fail(delta < 0 ? "Назад іти нікуди" : "Вперед іти нікуди")
  const how: How = delta < 0 ? "back" : "forward"
  const moved = replaceTab(state, { ...tab, index, via: how })
  return done(recordVisit(web, { ...moved, used: bump(moved, how) }, { url: target.url, how }))
}

const openTab = (web: Web, state: BrowserState, raw: Url | undefined, how: "link" | "bookmark" | "history"): OpResult => {
  if (state.tabs.length >= MAX_TABS) return fail(`Забагато вкладок, можна не більше ${MAX_TABS}`)
  const url = raw === undefined ? NEW_TAB : canonicalUrl(web.map, raw)
  if (url !== NEW_TAB) {
    const problem = reachable(web, state, url, how)
    if (problem !== null) return fail(problem)
  }
  const entry: TabEntry = { url, how: url === NEW_TAB ? "start" : how }
  const tab: Tab = { id: state.nextTabId, stack: [entry], index: 0, via: entry.how }
  const active = activeTabOf(state)
  // The new tab goes right after the one in front.
  const at = active ? state.tabs.indexOf(active) + 1 : state.tabs.length
  const tabs = [...state.tabs.slice(0, at), tab, ...state.tabs.slice(at)]
  const opened: BrowserState = { ...state, tabs, activeTab: tab.id, nextTabId: state.nextTabId + 1, used: bump(state, "newTab") }
  return done(recordVisit(web, opened, entry))
}

const closeTab = (state: BrowserState, id: number): OpResult => {
  const index = state.tabs.findIndex((t) => t.id === id)
  if (index < 0) return fail("Немає такої вкладки")
  const tabs = state.tabs.filter((t) => t.id !== id)
  const used = bump(state, "closeTab")
  // The last tab closed: the browser stays with one empty tab, so the student is never left without a window.
  if (tabs.length === 0) {
    const fresh: Tab = { id: state.nextTabId, stack: [{ url: NEW_TAB, how: "start" }], index: 0, via: "start" }
    return done({ ...state, tabs: [fresh], activeTab: fresh.id, nextTabId: state.nextTabId + 1, used })
  }
  const activeTab = state.activeTab === id ? (tabs[Math.min(index, tabs.length - 1)]?.id ?? 0) : state.activeTab
  return done({ ...state, tabs, activeTab, used })
}

const addBookmark = (web: Web, state: BrowserState, title: string, folder: string): OpResult => {
  const tab = activeTabOf(state)
  if (!tab) return fail("Немає відкритої вкладки")
  const url = currentUrl(tab)
  if (url === NEW_TAB) return fail("Нову вкладку не можна додати в закладки")
  if (state.bookmarks.length >= MAX_BOOKMARKS) return fail(`Забагато закладок, можна не більше ${MAX_BOOKMARKS}`)
  const name = cleanName(title)
  if (name.length > MAX_NAME) return fail("Задовга назва")
  if (folder !== "" && !state.folders.includes(folder)) return fail("Немає такої папки")
  const bookmark = { id: state.nextId, url, title: name.length > 0 ? name : titleOf(web.map, url), folder }
  return done({ ...state, bookmarks: [...state.bookmarks, bookmark], nextId: state.nextId + 1 })
}

const changeBookmark = (state: BrowserState, id: number, change: (b: BrowserState["bookmarks"][number]) => OpResult | BrowserState["bookmarks"][number]): OpResult => {
  const found = state.bookmarks.find((b) => b.id === id)
  if (!found) return fail("Немає такої закладки")
  const changed = change(found)
  if ("ok" in changed) return changed
  return done({ ...state, bookmarks: state.bookmarks.map((b) => (b.id === id ? changed : b)) })
}

const addFolder = (state: BrowserState, raw: string): OpResult => {
  const name = cleanName(raw)
  if (name.length === 0) return fail("Порожня назва папки")
  if (name.length > MAX_NAME) return fail("Задовга назва")
  if (state.folders.length >= MAX_FOLDERS) return fail(`Забагато папок, можна не більше ${MAX_FOLDERS}`)
  if (state.folders.some((f) => f.toLocaleLowerCase("uk") === name.toLocaleLowerCase("uk"))) return fail(`Папка «${name}» уже є`)
  return done({ ...state, folders: [...state.folders, name] })
}

/** Ids of the forms and chats on the page in front. */
const formsInFront = (web: Web, state: BrowserState, kinds: ReadonlyArray<"form" | "chat">): ReadonlyArray<string> => {
  const tab = activeTabOf(state)
  return tab ? blocksOn(web.map, currentUrl(tab)).flatMap((b) => ((b.type === "form" || b.type === "chat") && kinds.includes(b.type) ? [b.id] : [])) : []
}

/** While a popup is open, the page under it cannot be used: only the popup's buttons and «Покликати дорослого». */
const POPUP_FREE: ReadonlySet<Op["op"]> = new Set(["closePopup", "acceptPopup", "callAdult", "answer"])

const changePopup = (web: Web, state: BrowserState, id: string, accept: boolean): OpResult => {
  const popup = state.popups.find((p) => p.spec.id === id)
  if (!popup || popup.status !== "open") return fail("Немає такого відкритого вікна")
  const popups = state.popups.map((p): PopupState => (p.spec.id === id ? { ...p, status: accept ? "accepted" : "closed" } : p))
  const changed = { ...state, popups }
  return accept && popup.spec.acceptUrl !== undefined ? openPopupTab(web, changed, popup.spec.acceptUrl) : done(changed)
}

/** The tempting button of a popup opens its page in a new tab, as adverts do. */
const openPopupTab = (web: Web, state: BrowserState, raw: Url): OpResult => {
  if (state.tabs.length >= MAX_TABS) return done(state)
  const entry: TabEntry = { url: canonicalUrl(web.map, raw), how: "popup" }
  const tab: Tab = { id: state.nextTabId, stack: [entry], index: 0, via: "popup" }
  return done(recordVisit(web, { ...state, tabs: [...state.tabs, tab], activeTab: tab.id, nextTabId: state.nextTabId + 1 }, entry))
}

const download = (web: Web, state: BrowserState, file: string): OpResult => {
  const tab = activeTabOf(state)
  if (!tab) return fail("Немає відкритої вкладки")
  const url = currentUrl(tab)
  const offer = blocksOn(web.map, url).find((b) => (b.type === "download" || b.type === "photo") && b.file === file)
  if (!offer) return fail("На цій сторінці немає такого файлу")
  if (state.downloads.length >= MAX_DOWNLOADS) return fail(`Забагато завантажень, можна не більше ${MAX_DOWNLOADS}`)
  const virus = offer.type === "download" && offer.virus === true
  const item = { id: state.nextId, file, from: url, virus, status: virus ? ("warned" as const) : ("done" as const) }
  return done({ ...state, downloads: [...state.downloads, item], nextId: state.nextId + 1 })
}

const changeDownload = (state: BrowserState, id: number, status: "deleted" | "opened"): OpResult => {
  const item = state.downloads.find((d) => d.id === id)
  if (!item || item.status === "deleted") return fail("Немає такого файлу")
  return done({ ...state, downloads: state.downloads.map((d) => (d.id === id ? { ...d, status } : d)) })
}

export const applyOp = (web: Web, state: BrowserState, op: Op): OpResult => {
  if (!POPUP_FREE.has(op.op) && state.popups.some((p) => p.status === "open")) return fail("Спершу закрий спливне вікно")
  switch (op.op) {
    case "submitForm":
      return formsInFront(web, state, ["form", "chat"]).includes(op.form)
        ? done({ ...state, submitted: state.submitted.includes(op.form) ? state.submitted : [...state.submitted, op.form] })
        : fail("На цій сторінці немає такої форми")
    case "report":
      return formsInFront(web, state, ["chat"]).includes(op.form) ? done({ ...state, used: bump(state, "report") }) : fail("На цій сторінці немає такого чату")
    case "callAdult":
      return done({ ...state, used: bump(state, "callAdult") })
    case "answer":
      if (!state.questions.some((q) => q.id === op.question)) return fail("Немає такого питання")
      if (op.text.length > MAX_ANSWER) return fail("Задовга відповідь")
      return done({ ...state, answers: { ...state.answers, [op.question]: op.text.trim() } })
    case "closePopup":
      return changePopup(web, state, op.id, false)
    case "acceptPopup":
      return changePopup(web, state, op.id, true)
    case "download":
      return download(web, state, op.file)
    case "deleteDownload":
      return changeDownload(state, op.id, "deleted")
    case "openDownload":
      return changeDownload(state, op.id, "opened")
    default:
      return applyBrowsing(web, state, op)
  }
}

const applyBrowsing = (web: Web, state: BrowserState, op: Op): OpResult => {
  switch (op.op) {
    case "navigate":
      return go(web, state, op.url, op.how)
    case "back":
      return step(web, state, -1)
    case "forward":
      return step(web, state, 1)
    case "reload":
      return activeTabOf(state) ? done({ ...state, used: bump(state, "reload") }) : fail("Немає відкритої вкладки")
    case "newTab":
      return openTab(web, state, op.url, op.how ?? "link")
    case "closeTab":
      return closeTab(state, op.tab)
    case "switchTab":
      return state.tabs.some((t) => t.id === op.tab) ? done({ ...state, activeTab: op.tab }) : fail("Немає такої вкладки")
    case "addBookmark":
      return addBookmark(web, state, op.title, op.folder)
    case "renameBookmark":
      return changeBookmark(state, op.id, (b) => {
        const title = cleanName(op.title)
        if (title.length === 0) return fail("Порожня назва")
        return title.length > MAX_NAME ? fail("Задовга назва") : { ...b, title }
      })
    case "moveBookmark":
      return changeBookmark(state, op.id, (b) => (op.folder === "" || state.folders.includes(op.folder) ? { ...b, folder: op.folder } : fail("Немає такої папки")))
    case "deleteBookmark":
      return state.bookmarks.some((b) => b.id === op.id) ? done({ ...state, bookmarks: state.bookmarks.filter((b) => b.id !== op.id) }) : fail("Немає такої закладки")
    case "addFolder":
      return addFolder(state, op.name)
    case "deleteHistory":
      return state.history.some((h) => h.id === op.id) ? done({ ...state, history: state.history.filter((h) => h.id !== op.id), used: bump(state, "deleteHistory") }) : fail("Немає такого запису в історії")
    case "clearHistory":
      return done({ ...state, history: [], used: bump(state, "clearHistory") })
    default:
      return fail("Невідома дія")
  }
}

export type ReplayResult =
  | { readonly ok: true; readonly state: BrowserState }
  /** `index` is the first step that could not be made; -1 when the log is too long. */
  | { readonly ok: false; readonly index: number; readonly error: string }

/** Applies the log in order. One impossible step makes the whole log invalid: the trainer never records one. */
export const replay = (web: Web, start: BrowserState, ops: ReadonlyArray<Op>): ReplayResult => {
  if (ops.length > MAX_OPS) return { ok: false, index: -1, error: `Забагато дій: ${ops.length}, можна не більше ${MAX_OPS}` }
  let state = start
  for (const [index, op] of ops.entries()) {
    const result = applyOp(web, state, op)
    if (!result.ok) return { ok: false, index, error: result.error }
    state = result.state
  }
  return { ok: true, state }
}
