/** A key press, as much of it as the shortcuts need. */
export interface KeyPress {
  readonly key: string
  readonly code: string
  readonly ctrl: boolean
  readonly shift: boolean
  readonly alt: boolean
}

export type Command =
  | "newTab"
  | "closeTab"
  | "nextTab"
  | "prevTab"
  | "history"
  | "bookmark"
  | "address"
  | "back"
  | "forward"
  | "reload"
  | "escape"
  | "find"
  | "zoomIn"
  | "zoomOut"
  | "zoomReset"

/**
 * The browser shortcuts from the textbooks. Letters are read from `code`, so they work in the Ukrainian
 * layout too (Ctrl+Т is still Ctrl+T). The real browser keeps Ctrl+T and Ctrl+W for itself in most cases;
 * the buttons do the same.
 */
export const commandFor = (k: KeyPress): Command | null => {
  if (k.key === "Escape") return "escape"
  if (k.key === "F5") return "reload"
  if (k.alt && !k.ctrl && k.key === "ArrowLeft") return "back"
  if (k.alt && !k.ctrl && k.key === "ArrowRight") return "forward"
  if (!k.ctrl || k.alt) return null
  if (k.key === "Tab") return k.shift ? "prevTab" : "nextTab"
  if (k.key === "+") return "zoomIn"
  switch (k.code) {
    case "KeyF":
      return "find"
    case "Equal":
    case "NumpadAdd":
      return "zoomIn"
    case "Minus":
    case "NumpadSubtract":
      return "zoomOut"
    case "Digit0":
    case "Numpad0":
      return "zoomReset"
    case "KeyT":
      return "newTab"
    case "KeyW":
      return "closeTab"
    case "KeyH":
      return "history"
    case "KeyD":
      return "bookmark"
    case "KeyL":
      return "address"
    case "KeyR":
      return "reload"
    default:
      return null
  }
}
