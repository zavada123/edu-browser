import type { Op } from "../core/ops.ts"
import { applyOp } from "../core/ops.ts"
import { canonicalUrl } from "../core/sites.ts"
import { type BrowserState, buildState, currentUrl, type Web } from "../core/state.ts"
import type { Url } from "../core/url.ts"
import { defaultWeb } from "../sites/index.ts"
import type { Scenario } from "./types.ts"

/**
 * Reference solutions: one correct way through each scenario. A page that grades on its server stores
 * this log with the task, so it can show that the task has a solution. Steps use addresses, not ids.
 */
type Step =
  | { readonly do: "go"; readonly url: Url; readonly how: "typed" | "link" | "bookmark" | "history" | "home" }
  | { readonly do: "back" | "forward" | "newTab" }
  | { readonly do: "openInTab"; readonly url: Url }
  /** Closes or brings to front the tab that shows `url`. */
  | { readonly do: "close" | "switch"; readonly url: Url }
  | { readonly do: "bookmark"; readonly folder?: string; readonly title?: string }
  | { readonly do: "folder"; readonly name: string }
  | { readonly do: "forget"; readonly url: Url }
  | { readonly do: "clearHistory" | "callAdult" }
  | { readonly do: "closePopup"; readonly id: string }
  | { readonly do: "download"; readonly file: string }
  | { readonly do: "deleteDownload"; readonly file: string }

const tabWith = (web: Web, state: BrowserState, url: Url): number => {
  const want = canonicalUrl(web.map, url)
  const tab = state.tabs.find((t) => currentUrl(t) === want)
  if (!tab) throw new Error(`Помилка в розв'язку: немає вкладки ${url}`)
  return tab.id
}

const toOp = (web: Web, state: BrowserState, step: Step): Op => {
  switch (step.do) {
    case "go":
      return { op: "navigate", url: step.url, how: step.how }
    case "back":
    case "forward":
      return { op: step.do }
    case "newTab":
      return { op: "newTab" }
    case "openInTab":
      return { op: "newTab", url: step.url, how: "link" }
    case "close":
      return { op: "closeTab", tab: tabWith(web, state, step.url) }
    case "switch":
      return { op: "switchTab", tab: tabWith(web, state, step.url) }
    case "bookmark":
      return { op: "addBookmark", title: step.title ?? "", folder: step.folder ?? "" }
    case "folder":
      return { op: "addFolder", name: step.name }
    case "forget": {
      const want = canonicalUrl(web.map, step.url)
      const entry = state.history.find((h) => h.url === want)
      if (!entry) throw new Error(`Помилка в розв'язку: в історії немає ${step.url}`)
      return { op: "deleteHistory", id: entry.id }
    }
    case "clearHistory":
    case "callAdult":
      return { op: step.do }
    case "closePopup":
      return { op: "closePopup", id: step.id }
    case "download":
      return { op: "download", file: step.file }
    case "deleteDownload": {
      const item = state.downloads.find((d) => d.file === step.file)
      if (!item) throw new Error(`Помилка в розв'язку: не завантажено ${step.file}`)
      return { op: "deleteDownload", id: item.id }
    }
  }
}

const SOLUTIONS: Readonly<Record<string, ReadonlyArray<Step>>> = {
  "g3-links": [{ do: "go", url: "космос.edu/місяць", how: "link" }],
  "g3-back-forward": [{ do: "go", url: "космос.edu/сонце", how: "link" }, { do: "back" }],
  "g3-type-address": [
    { do: "go", url: "казки.edu", how: "typed" },
    { do: "go", url: "казки.edu/рукавичка", how: "link" }
  ],
  "g3-site-pages": [
    { do: "openInTab", url: "казки.edu/колобок" },
    { do: "switch", url: "казки.edu" },
    { do: "openInTab", url: "казки.edu/рукавичка" }
  ],
  "g3-chat-password": [{ do: "callAdult" }],
  "g3-prize-popup": [{ do: "closePopup", id: "prize" }],
  "g3-safe-result": [{ do: "go", url: "казки.edu", how: "link" }],
  "g3-virus-file": [{ do: "download", file: "супер-гонки.exe" }, { do: "deleteDownload", file: "супер-гонки.exe" }, { do: "callAdult" }],
  "g4-first-bookmark": [{ do: "go", url: "казки.edu/колобок", how: "link" }, { do: "bookmark" }],
  "g4-bookmark-folder": [
    { do: "go", url: "словник.edu", how: "typed" },
    { do: "folder", name: "Навчання" },
    { do: "bookmark", folder: "Навчання" },
    { do: "go", url: "енциклопедія.edu", how: "typed" },
    { do: "bookmark", folder: "Навчання" }
  ],
  "g4-history": [{ do: "go", url: "енциклопедія.edu/лелека", how: "history" }],
  "g5-search-clubs": [
    { do: "go", url: "пошук.edu/пошук?q=розклад гуртків", how: "typed" },
    { do: "go", url: "школа.edu/гуртки", how: "link" },
    { do: "bookmark" }
  ],
  "g5-tabs-order": [
    { do: "openInTab", url: "школа.edu/розклад" },
    { do: "switch", url: "школа.edu" },
    { do: "openInTab", url: "школа.edu/гуртки" },
    { do: "newTab" },
    { do: "go", url: "словник.edu", how: "typed" },
    { do: "close", url: "словник.edu" }
  ],
  "g5-clean-history": [{ do: "forget", url: "космос.edu/ракети" }, { do: "clearHistory" }]
}

/** The reference log of a scenario. Throws when the scenario has no solution or the solution is broken. */
export const referenceOps = (scenario: Scenario, web: Web = defaultWeb): ReadonlyArray<Op> => {
  const steps = SOLUTIONS[scenario.id]
  if (!steps) throw new Error(`Немає розв'язку для ${scenario.id}`)
  let state = buildState(web, scenario.start)
  const ops: Op[] = []
  for (const step of steps) {
    const op = toOp(web, state, step)
    const result = applyOp(web, state, op)
    if (!result.ok) throw new Error(`Помилка в розв'язку ${scenario.id}: ${result.error}`)
    state = result.state
    ops.push(op)
  }
  return ops
}
