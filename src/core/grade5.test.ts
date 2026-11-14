import { describe, expect, test } from "vitest"
import { grade } from "../core.ts"
import { scenarios } from "../scenarios/index.ts"
import { defaultWeb } from "../sites/index.ts"
import { applyOp, nextZoom, type Op, ZOOM_LEVELS } from "./ops.ts"
import { buildState } from "./state.ts"

const web = defaultWeb
const unmet = (id: string, ops: ReadonlyArray<Op>) => {
  const sc = scenarios.find((s) => s.id === id)
  if (!sc) throw new Error(id)
  const result = grade(sc, ops)
  if (!result.ok) throw new Error(result.error)
  return result.results.filter((r) => !r.ok).map((r) => r.text)
}

describe("find on page", () => {
  test("records the page and the words, and counts the action", () => {
    const start = buildState(web, { tabs: ["космос.edu/планети"] })
    const r = applyOp(web, start, { op: "find", text: "  Марс  " })
    expect(r.ok && r.state.finds).toEqual([{ url: "космос.edu/планети", text: "Марс" }])
    expect(r.ok && r.state.used.find).toBe(1)
  })

  test("refuses an empty or too long search", () => {
    const start = buildState(web, { tabs: ["космос.edu"] })
    expect(applyOp(web, start, { op: "find", text: "   " }).ok).toBe(false)
    expect(applyOp(web, start, { op: "find", text: "м".repeat(61) }).ok).toBe(false)
  })

  test("the goal wants the words on that page", () => {
    expect(unmet("g5-find", [{ op: "answer", question: "moons", text: "два" }])).toHaveLength(1)
    expect(unmet("g5-find", [{ op: "find", text: "марс" }, { op: "answer", question: "moons", text: "Два" }])).toEqual([])
  })
})

describe("zoom", () => {
  test("steps through the levels and stops at the ends", () => {
    expect(nextZoom(100, 1)).toBe(110)
    expect(nextZoom(100, -1)).toBe(90)
    expect(nextZoom(200, 1)).toBe(200)
    expect(nextZoom(50, -1)).toBe(50)
    expect(nextZoom(133, 1)).toBe(110)
  })

  test("accepts only the known levels", () => {
    const start = buildState(web, {})
    expect(start.zoom).toBe(100)
    for (const level of ZOOM_LEVELS) expect(applyOp(web, start, { op: "zoom", level }).ok).toBe(true)
    expect(applyOp(web, start, { op: "zoom", level: 1000 }).ok).toBe(false)
  })

  test("the goal checks the zoom at the end", () => {
    const answer: Op = { op: "answer", question: "time", text: "о 8:30" }
    expect(unmet("g5-zoom", [{ op: "zoom", level: 125 }, answer])).toHaveLength(1)
    expect(unmet("g5-zoom", [{ op: "zoom", level: 175 }, answer])).toEqual([])
    expect(unmet("g5-zoom", [{ op: "zoom", level: 175 }, { op: "zoom", level: 100 }, answer])).toHaveLength(1)
  })
})

describe("login on a fake site", () => {
  test("a password sent on the copy fails, even after logging in on the real site", () => {
    const real: ReadonlyArray<Op> = [
      { op: "switchTab", tab: 2 },
      { op: "navigate", url: "школа.edu/щоденник", how: "link" },
      { op: "submitForm", form: "school-login" }
    ]
    expect(unmet("g5-lock", real)).toEqual([])
    expect(unmet("g5-lock", [{ op: "submitForm", form: "fake-login" }, ...real])).toHaveLength(1)
  })

  test("the school login form is not on the fake site", () => {
    const sc = scenarios.find((s) => s.id === "g5-lock")
    if (!sc) throw new Error("g5-lock")
    expect(grade(sc, [{ op: "submitForm", form: "school-login" }]).ok).toBe(false)
  })

  test("the copy is not secure and is an advert in search", () => {
    const site = web.list.find((s) => s.host === "щоденник-школа.xyz")
    expect(site?.secure).toBe(false)
  })
})
