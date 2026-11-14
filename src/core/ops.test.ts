import { describe, expect, test } from "vitest"
import { defaultWeb } from "../sites/index.ts"
import { applyOp, MAX_OPS, MAX_TABS, type Op, replay } from "./ops.ts"
import { activeTabOf, type BrowserState, buildState, currentUrl } from "./state.ts"
import { NEW_TAB } from "./url.ts"

const web = defaultWeb
const run = (state: BrowserState, ...ops: ReadonlyArray<Op>): BrowserState => {
  const result = replay(web, state, ops)
  if (!result.ok) throw new Error(`${result.index}: ${result.error}`)
  return result.state
}
const front = (s: BrowserState) => {
  const tab = activeTabOf(s)
  if (!tab) throw new Error("немає вкладки")
  return currentUrl(tab)
}

describe("buildState", () => {
  test("no tabs gives one new tab; open tabs are in today's history", () => {
    expect(front(buildState(web))).toBe(NEW_TAB)
    const s = buildState(web, { tabs: ["kosmos.edu"], history: [{ url: "казки.edu" }] })
    expect(s.history.map((h) => [h.url, h.day])).toEqual([["казки.edu", -1], ["космос.edu", 0]])
  })
})

describe("navigation", () => {
  const start = buildState(web, { tabs: ["космос.edu"] })

  test("a link must be on the page", () => {
    expect(applyOp(web, start, { op: "navigate", url: "космос.edu/місяць", how: "link" }).ok).toBe(true)
    expect(applyOp(web, start, { op: "navigate", url: "казки.edu/колобок", how: "link" }).ok).toBe(false)
  })

  test("a typed address can be anything, even a site that does not exist", () => {
    const s = run(start, { op: "navigate", url: "https://нема.edu", how: "typed" })
    expect(front(s)).toBe("нема.edu")
  })

  test("back and forward walk the tab's own pages", () => {
    let s = run(start, { op: "navigate", url: "космос.edu/місяць", how: "link" }, { op: "navigate", url: "космос.edu/сонце", how: "link" })
    s = run(s, { op: "back" })
    expect(front(s)).toBe("космос.edu/місяць")
    s = run(s, { op: "forward" })
    expect(front(s)).toBe("космос.edu/сонце")
    expect(applyOp(web, s, { op: "forward" }).ok).toBe(false)
    expect(s.used).toEqual({ back: 1, forward: 1 })
  })

  test("a new page after «Назад» drops the pages ahead", () => {
    const s = run(
      start,
      { op: "navigate", url: "космос.edu/місяць", how: "link" },
      { op: "back" },
      { op: "navigate", url: "космос.edu/ракети", how: "link" }
    )
    expect(applyOp(web, s, { op: "forward" }).ok).toBe(false)
  })

  test("bookmark, history and home steps must be real", () => {
    expect(applyOp(web, start, { op: "navigate", url: "казки.edu", how: "bookmark" }).ok).toBe(false)
    expect(applyOp(web, start, { op: "navigate", url: "казки.edu", how: "history" }).ok).toBe(false)
    expect(applyOp(web, start, { op: "navigate", url: "пошук.edu", how: "home" }).ok).toBe(true)
    expect(applyOp(web, start, { op: "navigate", url: "казки.edu", how: "home" }).ok).toBe(false)
  })
})

describe("tabs", () => {
  const start = buildState(web, { tabs: ["казки.edu"] })

  test("a link opens in a new tab right after the current one", () => {
    const s = run(start, { op: "newTab", url: "казки.edu/колобок", how: "link" })
    expect(s.tabs.map(currentUrl)).toEqual(["казки.edu", "казки.edu/колобок"])
    expect(front(s)).toBe("казки.edu/колобок")
  })

  test("closing the tab in front shows its neighbour; closing the last leaves an empty tab", () => {
    let s = run(start, { op: "newTab" })
    s = run(s, { op: "closeTab", tab: s.activeTab })
    expect(front(s)).toBe("казки.edu")
    s = run(s, { op: "closeTab", tab: s.activeTab })
    expect(s.tabs).toHaveLength(1)
    expect(front(s)).toBe(NEW_TAB)
  })

  test("there is a limit on tabs", () => {
    const ops: Op[] = Array.from({ length: MAX_TABS }, () => ({ op: "newTab" }))
    expect(replay(web, start, ops).ok).toBe(false)
  })
})

describe("bookmarks", () => {
  const start = buildState(web, { tabs: ["казки.edu/колобок"] })

  test("bookmark the page in front, into a folder that exists", () => {
    expect(applyOp(web, start, { op: "addBookmark", title: "", folder: "Навчання" }).ok).toBe(false)
    const s = run(start, { op: "addFolder", name: "Навчання" }, { op: "addBookmark", title: "", folder: "Навчання" })
    expect(s.bookmarks).toEqual([{ id: s.bookmarks[0]?.id, url: "казки.edu/колобок", title: "Колобок — Бібліотека казок", folder: "Навчання" }])
  })

  test("rename, move and delete", () => {
    let s = run(start, { op: "addBookmark", title: "Казка", folder: "" }, { op: "addFolder", name: "Казки" })
    const id = s.bookmarks[0]?.id ?? 0
    s = run(s, { op: "renameBookmark", id, title: "  Колобок  " }, { op: "moveBookmark", id, folder: "Казки" })
    expect(s.bookmarks[0]).toMatchObject({ title: "Колобок", folder: "Казки" })
    expect(run(s, { op: "deleteBookmark", id }).bookmarks).toEqual([])
    expect(applyOp(web, s, { op: "renameBookmark", id, title: " " }).ok).toBe(false)
  })

  test("a folder name is unique", () => {
    const s = run(start, { op: "addFolder", name: "Навчання" })
    expect(applyOp(web, s, { op: "addFolder", name: "навчання" }).ok).toBe(false)
  })

  test("the new-tab page cannot be bookmarked", () => {
    expect(applyOp(web, buildState(web), { op: "addBookmark", title: "", folder: "" }).ok).toBe(false)
  })
})

describe("history", () => {
  test("every opened page goes into history; delete one or clear all", () => {
    let s = run(buildState(web, { tabs: ["космос.edu"] }), { op: "navigate", url: "космос.edu/місяць", how: "link" })
    expect(s.history.map((h) => h.url)).toEqual(["космос.edu", "космос.edu/місяць"])
    s = run(s, { op: "deleteHistory", id: s.history[0]?.id ?? 0 })
    expect(s.history.map((h) => h.url)).toEqual(["космос.edu/місяць"])
    s = run(s, { op: "clearHistory" })
    expect(s.history).toEqual([])
    // Visits stay: the teacher still sees where the student went.
    expect(s.visits.map((v) => v.url)).toEqual(["космос.edu/місяць"])
  })
})

describe("replay", () => {
  test("rejects a too long log and reports the first impossible step", () => {
    const start = buildState(web)
    expect(replay(web, start, Array.from({ length: MAX_OPS + 1 }, () => ({ op: "reload" }) as const))).toMatchObject({ ok: false, index: -1 })
    expect(replay(web, start, [{ op: "reload" }, { op: "back" }])).toMatchObject({ ok: false, index: 1 })
  })
})
