import { describe, expect, test } from "vitest"
import { grade } from "../core.ts"
import { scenarios } from "../scenarios/index.ts"
import { defaultWeb } from "../sites/index.ts"
import { normalizeAnswer } from "./goals.ts"
import { applyOp, MAX_ANSWER, type Op, replay } from "./ops.ts"
import { buildState, type PopupSpec } from "./state.ts"

const web = defaultWeb
const failed = (id: string, ops: ReadonlyArray<Op>) => {
  const sc = scenarios.find((s) => s.id === id)
  if (!sc) throw new Error(id)
  const result = grade(sc, ops)
  if (!result.ok) throw new Error(result.error)
  return result.results.filter((r) => !r.ok).map((r) => r.text)
}

describe("normalizeAnswer", () => {
  test.each([
    ["  Остап   КВІТКОВИЙ ", "остап квітковий"],
    ["«Бджола на соняшнику».", "бджола на соняшнику"],
    ["від трьох до п’яти", "від трьох до п'яти"],
    ["3 – 5", "3-5"],
    ["ведмежа́тко", "ведмежатко"],
    ["Їжак й ґудзик", "їжак й ґудзик"]
  ])("%s → %s", (raw, want) => {
    expect(normalizeAnswer(raw)).toBe(want)
  })
})

describe("answers", () => {
  const start = buildState(web, { tabs: ["пошук.edu"], questions: [{ id: "q", text: "?" }] })

  test("only questions of the task, with a length limit; the last answer counts", () => {
    expect(applyOp(web, start, { op: "answer", question: "x", text: "1" }).ok).toBe(false)
    expect(applyOp(web, start, { op: "answer", question: "q", text: "я".repeat(MAX_ANSWER + 1) }).ok).toBe(false)
    const r = replay(web, start, [
      { op: "answer", question: "q", text: "1" },
      { op: "answer", question: "q", text: " 2 " }
    ])
    expect(r.ok && r.state.answers).toEqual({ q: "2" })
  })

  test("answering works while a popup is open", () => {
    const popup: PopupSpec = { id: "p", title: "!", text: "!", accept: "Так" }
    const s = buildState(web, { tabs: ["пошук.edu"], popups: [popup], questions: [{ id: "q", text: "?" }] })
    expect(applyOp(web, s, { op: "answer", question: "q", text: "1" }).ok).toBe(true)
  })
})

describe("photos", () => {
  test("a photo with a file can be downloaded, and has no virus", () => {
    const s = buildState(web, { tabs: ["фото-природа.edu/бджола"] })
    const r = replay(web, s, [{ op: "download", file: "бджола.jpg" }])
    expect(r.ok && r.state.downloads[0]).toMatchObject({ file: "бджола.jpg", virus: false, status: "done" })
    expect(applyOp(web, s, { op: "download", file: "лелеки.jpg" }).ok).toBe(false)
  })
})

describe("learning scenarios catch wrong answers", () => {
  test("a misspelled word", () => {
    const ops: Op[] = [
      { op: "navigate", url: "словник.edu/ведмежатко", how: "typed" },
      { op: "answer", question: "word", text: "ведмедятко" }
    ]
    expect(failed("g4-spelling", ops)).toEqual(["Слово надруковано правильно"])
  })

  test("one source only, and its number written for both", () => {
    const ops: Op[] = [
      { op: "navigate", url: "вікі-діти.edu/лелека", how: "typed" },
      { op: "answer", question: "encyclopedia", text: "4" },
      { op: "answer", question: "wiki", text: "4" }
    ]
    expect(failed("g4-two-sources", ops)).toEqual(["Прочитано статтю в «Дитячій енциклопедії»", "Записано число з «Дитячої енциклопедії»"])
  })

  test("the photo of another author", () => {
    const ops: Op[] = [
      { op: "navigate", url: "фото-природа.edu/соняшники", how: "typed" },
      { op: "download", file: "соняшники.jpg" },
      { op: "answer", question: "author", text: "Марта Полева" },
      { op: "answer", question: "title", text: "Поле соняшників" },
      { op: "answer", question: "site", text: "https://фото-природа.edu" }
    ]
    expect(failed("g4-photo-author", ops)).toEqual(["Фото бджоли завантажено", "Автора записано правильно", "Назву фото записано правильно"])
  })
})
