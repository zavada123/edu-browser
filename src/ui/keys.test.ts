import { describe, expect, test } from "vitest"
import { commandFor, type KeyPress } from "./keys.ts"

const press = (key: string, code: string, mods: Partial<Pick<KeyPress, "ctrl" | "shift" | "alt">> = {}): KeyPress => ({ key, code, ctrl: false, shift: false, alt: false, ...mods })

describe("commandFor", () => {
  test("Ctrl shortcuts work in the Ukrainian layout", () => {
    expect(commandFor(press("е", "KeyT", { ctrl: true }))).toBe("newTab")
    expect(commandFor(press("ц", "KeyW", { ctrl: true }))).toBe("closeTab")
    expect(commandFor(press("р", "KeyH", { ctrl: true }))).toBe("history")
    expect(commandFor(press("в", "KeyD", { ctrl: true }))).toBe("bookmark")
  })

  test("Alt+arrows go back and forward, F5 reloads", () => {
    expect(commandFor(press("ArrowLeft", "ArrowLeft", { alt: true }))).toBe("back")
    expect(commandFor(press("ArrowRight", "ArrowRight", { alt: true }))).toBe("forward")
    expect(commandFor(press("F5", "F5"))).toBe("reload")
  })

  test("Ctrl+Tab cycles tabs", () => {
    expect(commandFor(press("Tab", "Tab", { ctrl: true }))).toBe("nextTab")
    expect(commandFor(press("Tab", "Tab", { ctrl: true, shift: true }))).toBe("prevTab")
  })

  test("Ctrl+F finds on the page, Ctrl with + − 0 zooms", () => {
    expect(commandFor(press("а", "KeyF", { ctrl: true }))).toBe("find")
    expect(commandFor(press("=", "Equal", { ctrl: true }))).toBe("zoomIn")
    expect(commandFor(press("+", "Equal", { ctrl: true, shift: true }))).toBe("zoomIn")
    expect(commandFor(press("+", "NumpadAdd", { ctrl: true }))).toBe("zoomIn")
    expect(commandFor(press("-", "Minus", { ctrl: true }))).toBe("zoomOut")
    expect(commandFor(press("0", "Digit0", { ctrl: true }))).toBe("zoomReset")
    expect(commandFor(press("-", "Minus"))).toBeNull()
  })

  test("plain letters and Ctrl+Alt are not shortcuts", () => {
    expect(commandFor(press("t", "KeyT"))).toBeNull()
    expect(commandFor(press("t", "KeyT", { ctrl: true, alt: true }))).toBeNull()
  })
})
