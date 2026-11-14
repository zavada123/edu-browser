import { checkGoals, type Goal, type GoalResult } from "../core/goals.ts"
import { applyOp, type Op } from "../core/ops.ts"
import type { BrowserState, Web } from "../core/state.ts"
import type { Url } from "../core/url.ts"

export type Panel = "history" | "bookmarks" | "tabs" | "downloads"

export type Menu =
  | { readonly kind: "link"; readonly x: number; readonly y: number; readonly url: Url }
  | { readonly kind: "bookmark"; readonly x: number; readonly y: number; readonly id: number }
  | { readonly kind: "folder"; readonly x: number; readonly y: number; readonly folder: string }

export interface UiState {
  readonly web: Web
  readonly browser: BrowserState
  /** Every step the student made, for the server. Only steps that worked. */
  readonly ops: ReadonlyArray<Op>
  readonly panel: Panel | null
  readonly menu: Menu | null
  /** The star dialog is open. */
  readonly bookmarkDialog: boolean
  readonly message: string | null
  readonly results: ReadonlyArray<GoalResult> | null
  /** Grows on «Оновити», so the page plays its loading look again. */
  readonly reloads: number
}

export type UiAction =
  | { readonly type: "op"; readonly op: Op }
  /** Several steps that only make sense together, like a new folder and a bookmark in it. All or none. */
  | { readonly type: "ops"; readonly ops: ReadonlyArray<Op> }
  | { readonly type: "panel"; readonly panel: Panel | null }
  | { readonly type: "menu"; readonly menu: Menu | null }
  | { readonly type: "bookmarkDialog"; readonly open: boolean }
  | { readonly type: "notify"; readonly message: string }
  | { readonly type: "dismiss" }
  | { readonly type: "check"; readonly goals: ReadonlyArray<Goal> }
  | { readonly type: "reset"; readonly browser: BrowserState }

export const initialUi = (web: Web, browser: BrowserState, ops: ReadonlyArray<Op> = []): UiState => ({
  web,
  browser,
  ops,
  panel: null,
  menu: null,
  bookmarkDialog: false,
  message: null,
  results: null,
  reloads: 0
})

/** Steps after which the menus and the star dialog close: the page in front changed. */
const MOVES: ReadonlySet<Op["op"]> = new Set(["navigate", "back", "forward", "newTab", "closeTab", "switchTab"])

/** What the trainer says after a step that has no other visible result. */
const FEEDBACK: Partial<Readonly<Record<Op["op"], string>>> = {
  callAdult: "🙋 Дорослий уже поруч. Молодець: коли щось лякає або дивує, треба розповісти дорослому!",
  openDownload: "😱 Вірус потрапив на комп'ютер! Так робити не можна. Натисни «Почати спочатку» і спробуй ще раз.",
  report: "🚩 Скаргу надіслано модераторам сайту.",
  deleteDownload: "🗑 Файл видалено."
}

const applyAll = (state: UiState, ops: ReadonlyArray<Op>): UiState => {
  let browser = state.browser
  for (const op of ops) {
    const result = applyOp(state.web, browser, op)
    if (!result.ok) return { ...state, message: result.error, menu: null }
    browser = result.state
  }
  const moved = ops.some((op) => MOVES.has(op.op))
  const said = ops.map((op) => FEEDBACK[op.op]).find((m) => m !== undefined)
  return {
    ...state,
    message: said ?? state.message,
    browser,
    ops: [...state.ops, ...ops],
    // The old result no longer describes what is on the screen.
    results: null,
    menu: null,
    bookmarkDialog: moved ? false : state.bookmarkDialog,
    // On a phone the tab list closes once a tab is chosen; the side panels stay, as in a desktop browser.
    panel: moved && state.panel === "tabs" ? null : state.panel,
    reloads: ops.some((op) => op.op === "reload") ? state.reloads + 1 : state.reloads
  }
}

export const reducer = (state: UiState, action: UiAction): UiState => {
  switch (action.type) {
    case "op":
      return applyAll(state, [action.op])
    case "ops":
      return applyAll(state, action.ops)
    case "panel":
      return { ...state, panel: action.panel, menu: null, bookmarkDialog: false }
    case "menu":
      return { ...state, menu: action.menu }
    case "bookmarkDialog":
      return { ...state, bookmarkDialog: action.open, menu: null }
    case "notify":
      return { ...state, message: action.message }
    case "dismiss":
      return { ...state, message: null }
    case "check":
      return { ...state, results: checkGoals(state.web, state.browser, action.goals), menu: null }
    case "reset":
      return initialUi(state.web, action.browser)
  }
}
