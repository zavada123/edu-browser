import { describe, expect, test } from "vitest"
import { grade } from "../core.ts"
import { allMet, checkGoals } from "../core/goals.ts"
import type { Op } from "../core/ops.ts"
import { buildState } from "../core/state.ts"
import { defaultWeb } from "../sites/index.ts"
import { scenarios } from "./index.ts"
import { referenceOps } from "./solutions.ts"

const web = defaultWeb
const scenario = (id: string) => {
  const found = scenarios.find((s) => s.id === id)
  if (!found) throw new Error(`немає сценарію ${id}`)
  return found
}
const failed = (id: string, ops: ReadonlyArray<Op>) => {
  const result = grade(scenario(id), ops)
  if (!result.ok) throw new Error(result.error)
  return result.results.filter((r) => !r.ok).map((r) => r.text)
}

describe("scenarios", () => {
  test.each(scenarios.map((s) => [s.id, s] as const))("%s is not solved at the start", (_id, sc) => {
    expect(allMet(checkGoals(web, buildState(web, sc.start), sc.goals))).toBe(false)
  })

  test.each(scenarios.map((s) => [s.id, s] as const))("%s: the reference log solves the task", (_id, sc) => {
    const result = grade(sc, referenceOps(sc))
    expect(result.ok && result.results.filter((r) => !r.ok).map((r) => r.text)).toEqual([])
  })

  test("ids are unique", () => {
    expect(new Set(scenarios.map((s) => s.id)).size).toBe(scenarios.length)
  })

  test("every address in a goal or a start leads to a real page", () => {
    for (const sc of scenarios) {
      const urls = [...(sc.start.tabs ?? []), ...(sc.start.history ?? []).map((h) => h.url), ...sc.goals.flatMap((g) => ("url" in g ? [g.url] : []))]
      for (const url of urls) expect(buildState(web, { tabs: [url] }).tabs[0], `${sc.id}: ${url}`).toBeDefined()
    }
  })
})

describe("wrong ways are caught", () => {
  test("typing the address of «Місяць» is not following links", () => {
    expect(failed("g3-links", [{ op: "navigate", url: "космос.edu/місяць", how: "typed" }])).toHaveLength(1)
  })

  test("going to «Місяць» by a link instead of «Назад»", () => {
    const ops: Op[] = [
      { op: "navigate", url: "космос.edu/сонце", how: "link" },
      { op: "navigate", url: "космос.edu/місяць", how: "link" }
    ]
    expect(failed("g3-back-forward", ops)).toEqual(["Ти повернувся на «Місяць» кнопкою **Назад**"])
  })

  test("clicking the tile on the new-tab page is not typing", () => {
    const ops: Op[] = [
      { op: "navigate", url: "казки.edu", how: "link" },
      { op: "navigate", url: "казки.edu/рукавичка", how: "link" }
    ]
    expect(failed("g3-type-address", ops)).toEqual(["Адресу `казки.edu` надруковано в адресному рядку"])
  })

  test("a bookmark on the bar instead of the folder", () => {
    const ops: Op[] = [
      { op: "navigate", url: "словник.edu", how: "typed" },
      { op: "addFolder", name: "Навчання" },
      { op: "addBookmark", title: "", folder: "" }
    ]
    expect(failed("g4-bookmark-folder", ops)).toContain("Словник лежить у папці «Навчання»")
  })

  test("typing the address instead of opening it from history", () => {
    expect(failed("g4-history", [{ op: "navigate", url: "енциклопедія.edu/лелека", how: "typed" }])).toHaveLength(1)
  })

  test("clearing history without deleting one entry first", () => {
    expect(failed("g5-clean-history", [{ op: "clearHistory" }])).toEqual(["Окремий запис видалено"])
  })
})
