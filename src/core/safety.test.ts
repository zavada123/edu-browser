import { describe, expect, test } from "vitest"
import { grade } from "../core.ts"
import { scenarios } from "../scenarios/index.ts"
import { defaultWeb } from "../sites/index.ts"
import { applyOp, type Op, replay } from "./ops.ts"
import { activeTabOf, type BrowserState, buildState, currentUrl, type PopupSpec } from "./state.ts"
import { search } from "./sites.ts"

const web = defaultWeb
const run = (state: BrowserState, ...ops: ReadonlyArray<Op>): BrowserState => {
  const result = replay(web, state, ops)
  if (!result.ok) throw new Error(`${result.index}: ${result.error}`)
  return result.state
}
const front = (s: BrowserState) => currentUrl(activeTabOf(s) ?? s.tabs[0]!)
const failed = (id: string, ops: ReadonlyArray<Op>) => {
  const sc = scenarios.find((s) => s.id === id)
  if (!sc) throw new Error(id)
  const result = grade(sc, ops)
  if (!result.ok) throw new Error(result.error)
  return result.results.filter((r) => !r.ok).map((r) => r.text)
}

const prize: PopupSpec = { id: "p", title: "Приз", text: "!", accept: "Забрати", acceptUrl: "приз-телефон.win" }

describe("popups", () => {
  test("an open popup blocks the page until it is closed; «Покликати дорослого» still works", () => {
    const s = buildState(web, { tabs: ["казки.edu"], popups: [prize] })
    expect(applyOp(web, s, { op: "navigate", url: "казки.edu/колобок", how: "link" }).ok).toBe(false)
    expect(applyOp(web, s, { op: "callAdult" }).ok).toBe(true)
    const closed = run(s, { op: "closePopup", id: "p" })
    expect(closed.popups[0]?.status).toBe("closed")
    expect(applyOp(web, closed, { op: "closePopup", id: "p" }).ok).toBe(false)
  })

  test("the tempting button opens the bait site in a new tab", () => {
    const s = run(buildState(web, { tabs: ["казки.edu"], popups: [prize] }), { op: "acceptPopup", id: "p" })
    expect(s.tabs).toHaveLength(2)
    expect(front(s)).toBe("приз-телефон.win")
    expect(s.visits.at(-1)).toEqual({ url: "приз-телефон.win", how: "popup" })
  })

  test("a popup with `at` waits for its site", () => {
    let s = buildState(web, { tabs: ["пошук.edu"], popups: [{ ...prize, at: "казки.edu" }] })
    expect(s.popups[0]?.status).toBe("waiting")
    s = run(s, { op: "navigate", url: "казки.edu/колобок", how: "typed" })
    expect(s.popups[0]?.status).toBe("open")
  })
})

describe("forms and chats", () => {
  test("only a form on the page in front can be sent; what was typed is not kept", () => {
    const s = buildState(web, { tabs: ["приз-телефон.win"] })
    expect(applyOp(web, s, { op: "submitForm", form: "chat" }).ok).toBe(false)
    expect(run(s, { op: "submitForm", form: "prize" }).submitted).toEqual(["prize"])
  })

  test("report works only in a chat", () => {
    expect(applyOp(web, buildState(web, { tabs: ["приз-телефон.win"] }), { op: "report", form: "prize" }).ok).toBe(false)
    expect(run(buildState(web, { tabs: ["ігри-онлайн.edu/чат"] }), { op: "report", form: "chat" }).used.report).toBe(1)
  })
})

describe("downloads", () => {
  test("a file must be offered on the page; a virus waits for a choice", () => {
    const s = buildState(web, { tabs: ["безкоштовні-ігри.xyz"] })
    expect(applyOp(web, s, { op: "download", file: "інше.exe" }).ok).toBe(false)
    const got = run(s, { op: "download", file: "супер-гонки.exe" })
    expect(got.downloads).toMatchObject([{ file: "супер-гонки.exe", virus: true, status: "warned" }])
    const id = got.downloads[0]?.id ?? 0
    expect(run(got, { op: "deleteDownload", id }).downloads[0]?.status).toBe("deleted")
    expect(applyOp(web, run(got, { op: "deleteDownload", id }), { op: "openDownload", id }).ok).toBe(false)
  })
})

describe("search adverts", () => {
  test("the bait site comes first, marked as an advert, and only once", () => {
    const hits = search(web.list, "казки")
    expect(hits[0]).toMatchObject({ url: "приз-телефон.win", ad: true })
    expect(hits.filter((h) => h.url === "приз-телефон.win")).toHaveLength(1)
    expect(hits.map((h) => h.url)).toEqual(expect.arrayContaining(["казки.edu", "казки-безкоштовно.xyz"]))
  })

  test("unsafe sites are not on the new-tab page", () => {
    const s = buildState(web)
    expect(applyOp(web, s, { op: "navigate", url: "приз-телефон.win", how: "link" }).ok).toBe(false)
    expect(applyOp(web, s, { op: "navigate", url: "казки.edu", how: "link" }).ok).toBe(true)
  })
})

describe("safety scenarios catch wrong choices", () => {
  test("writing to the stranger", () => {
    expect(failed("g3-chat-password", [{ op: "submitForm", form: "chat" }, { op: "callAdult" }])).toEqual(["Ти нічого не написав Котику"])
  })

  test("taking the prize", () => {
    const wrong = failed("g3-prize-popup", [{ op: "acceptPopup", id: "prize" }, { op: "submitForm", form: "prize" }])
    expect(wrong).toEqual(["Вікно закрито без «Забрати приз»", "Сайт-приманку не відкрито", "Ти не вводив жодних даних", "На екрані знову казка «Колобок»"])
  })

  test("opening the advert or the .xyz site from search", () => {
    expect(failed("g3-safe-result", [{ op: "navigate", url: "приз-телефон.win", how: "link" }])).toHaveLength(2)
    expect(failed("g3-safe-result", [{ op: "navigate", url: "казки-безкоштовно.xyz", how: "link" }, { op: "back" }, { op: "navigate", url: "казки.edu/колобок", how: "link" }])).toEqual([
      "Підозрілий сайт .xyz не відкрито"
    ])
  })

  test("opening the infected file", () => {
    const ops: Op[] = [{ op: "download", file: "супер-гонки.exe" }]
    const s = run(buildState(web, { tabs: ["безкоштовні-ігри.xyz"] }), ...ops)
    const id = s.downloads[0]?.id ?? 0
    expect(failed("g3-virus-file", [...ops, { op: "openDownload", id }, { op: "callAdult" }])).toEqual(["Файл із вірусом видалено", "Файл із вірусом не відкривали"])
  })
})
