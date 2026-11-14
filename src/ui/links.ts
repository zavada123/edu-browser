import type { MouseEvent, PointerEvent } from "react"
import type { Url } from "../core/url.ts"

/** Hold a finger this long on a link to get its menu, as on a phone. */
const LONG_PRESS_MS = 550
/** A finger that moves farther than this scrolls the page instead. */
const MOVE_PX = 10

export interface LinkHandlers {
  readonly open: (url: Url) => void
  readonly openInNewTab: (url: Url) => void
  readonly menu: (url: Url, x: number, y: number) => void
}

let pressTimer: number | undefined
let pressStart: { readonly x: number; readonly y: number } | null = null
/** A long press opened the menu: the click that follows it must not also follow the link. */
let swallowClick = false

const cancelPress = () => {
  window.clearTimeout(pressTimer)
  pressStart = null
}

/**
 * Props for a link of a made-up page: a click follows it, Ctrl+click or the middle button opens it
 * in a new tab, the right button or a long press shows «Відкрити в новій вкладці».
 */
export const linkProps = (url: Url, handlers: LinkHandlers) => ({
  href: `#${url}`,
  onClick: (e: MouseEvent) => {
    e.preventDefault()
    if (swallowClick) {
      swallowClick = false
      return
    }
    if (e.ctrlKey || e.metaKey) handlers.openInNewTab(url)
    else handlers.open(url)
  },
  onAuxClick: (e: MouseEvent) => {
    if (e.button !== 1) return
    e.preventDefault()
    handlers.openInNewTab(url)
  },
  onContextMenu: (e: MouseEvent) => {
    e.preventDefault()
    cancelPress()
    handlers.menu(url, e.clientX, e.clientY)
  },
  onPointerDown: (e: PointerEvent) => {
    if (e.pointerType === "mouse") return
    cancelPress()
    swallowClick = false
    pressStart = { x: e.clientX, y: e.clientY }
    const { clientX, clientY } = e
    pressTimer = window.setTimeout(() => {
      swallowClick = true
      pressStart = null
      handlers.menu(url, clientX, clientY)
    }, LONG_PRESS_MS)
  },
  onPointerMove: (e: PointerEvent) => {
    if (pressStart && Math.hypot(e.clientX - pressStart.x, e.clientY - pressStart.y) > MOVE_PX) cancelPress()
  },
  onPointerUp: cancelPress,
  onPointerCancel: cancelPress
})
