import { type FormEvent, type RefObject, useEffect, useState } from "react"
import { canonicalUrl, iconOf, resolve, searchUrl, titleOf } from "../core/sites.ts"
import { type BrowserState, currentUrl, type Tab, type Web } from "../core/state.ts"
import { looksLikeAddress, NEW_TAB, type Url } from "../core/url.ts"
import type { UiAction } from "./store.ts"

/** The tabs along the top. On a phone they are hidden and the tab counter opens a list instead. */
export const TabStrip = ({ web, browser, dispatch }: { readonly web: Web; readonly browser: BrowserState; readonly dispatch: (a: UiAction) => void }) => (
  <div className="eb-tabs" role="tablist" aria-label="Вкладки">
    {browser.tabs.map((tab) => {
      const url = currentUrl(tab)
      const active = tab.id === browser.activeTab
      return (
        <div key={tab.id} className={`eb-tab${active ? " is-active" : ""}`} title={titleOf(web.map, url)}>
          <button
            type="button"
            role="tab"
            aria-selected={active}
            className="eb-tab-main"
            onClick={() => !active && dispatch({ type: "op", op: { op: "switchTab", tab: tab.id } })}
            onAuxClick={(e) => e.button === 1 && dispatch({ type: "op", op: { op: "closeTab", tab: tab.id } })}
          >
            <span className="eb-tab-icon" aria-hidden="true">
              {iconOf(web.map, url)}
            </span>
            <span className="eb-tab-title">{titleOf(web.map, url)}</span>
          </button>
          <button type="button" className="eb-tab-close" aria-label={`Закрити вкладку «${titleOf(web.map, url)}»`} title="Закрити вкладку (Ctrl+W)" onClick={() => dispatch({ type: "op", op: { op: "closeTab", tab: tab.id } })}>
            ✕
          </button>
        </div>
      )
    })}
    <button type="button" className="eb-tab-new" aria-label="Нова вкладка" title="Нова вкладка (Ctrl+T)" onClick={() => dispatch({ type: "op", op: { op: "newTab" } })}>
      +
    </button>
  </div>
)

const shownAddress = (url: Url): string => (url === NEW_TAB ? "" : url)

/** What the lock icon says about the page. */
const security = (web: Web, url: Url): { readonly icon: string; readonly label: string; readonly safe: boolean } | null => {
  if (url === NEW_TAB) return null
  const r = resolve(web.map, url)
  if (r.kind === "noSite") return { icon: "⚠️", label: "Сайт не знайдено", safe: false }
  if (r.kind === "newTab") return null
  if (!r.site.secure) return { icon: "⚠️", label: "Не захищено", safe: false }
  return { icon: "🔒", label: "З'єднання захищене (https)", safe: true }
}

interface AddressProps {
  readonly web: Web
  readonly url: Url
  readonly bookmarked: boolean
  readonly inputRef: RefObject<HTMLInputElement | null>
  readonly onGo: (url: Url) => void
  readonly onStar: () => void
}

/** The address bar: shows where the student is, takes an address or a search. The star bookmarks the page. */
export const AddressBar = ({ web, url, bookmarked, inputRef, onGo, onStar }: AddressProps) => {
  const [text, setText] = useState(shownAddress(url))
  const [editing, setEditing] = useState(false)
  useEffect(() => {
    setText(shownAddress(url))
    setEditing(false)
  }, [url])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const typed = text.trim()
    if (typed.length === 0) return
    inputRef.current?.blur()
    setEditing(false)
    onGo(looksLikeAddress(typed) ? canonicalUrl(web.map, typed) : searchUrl(typed))
  }
  const lock = security(web, url)
  return (
    <form className={`eb-address${editing ? " is-editing" : ""}`} onSubmit={submit} role="search" aria-label="Адресний рядок">
      {lock && !editing && (
        <span className={`eb-lock${lock.safe ? "" : " is-unsafe"}`} title={lock.label} role="img" aria-label={lock.label}>
          <span aria-hidden="true">{lock.icon}</span>
          {!lock.safe && (
            <span className="eb-lock-text" aria-hidden="true">
              {lock.label}
            </span>
          )}
        </span>
      )}
      <input
        ref={inputRef}
        className="eb-address-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={(e) => {
          setEditing(true)
          e.target.select()
        }}
        onBlur={() => {
          setEditing(false)
          setText(shownAddress(url))
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setText(shownAddress(url))
            e.currentTarget.blur()
          }
        }}
        placeholder="Шукай або введи адресу"
        aria-label="Адреса сторінки"
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        enterKeyHint="go"
      />
      {url !== NEW_TAB && !editing && (
        <button type="button" className={`eb-star${bookmarked ? " is-on" : ""}`} onClick={onStar} aria-label={bookmarked ? "Змінити закладку" : "Додати в закладки"} title={bookmarked ? "Змінити закладку" : "Додати в закладки (Ctrl+D)"}>
          {bookmarked ? "★" : "☆"}
        </button>
      )}
    </form>
  )
}

interface ToolbarProps {
  readonly web: Web
  readonly browser: BrowserState
  readonly tab: Tab
  readonly large: boolean
  readonly addressRef: RefObject<HTMLInputElement | null>
  readonly dispatch: (a: UiAction) => void
  readonly full: boolean
  readonly onFull: () => void
}

export const Toolbar = ({ web, browser, tab, large, addressRef, dispatch, full, onFull }: ToolbarProps) => {
  const url = currentUrl(tab)
  const bookmarked = browser.bookmarks.some((b) => b.url === url)
  const panel = (p: "history" | "bookmarks" | "tabs") => dispatch({ type: "panel", panel: p })
  return (
    <div className="eb-toolbar">
      <button type="button" className="eb-tool" disabled={tab.index === 0} onClick={() => dispatch({ type: "op", op: { op: "back" } })} aria-label="Назад" title="Назад (Alt+←)">
        ←
      </button>
      <button type="button" className="eb-tool eb-forward" disabled={tab.index >= tab.stack.length - 1} onClick={() => dispatch({ type: "op", op: { op: "forward" } })} aria-label="Вперед" title="Вперед (Alt+→)">
        →
      </button>
      <button type="button" className="eb-tool" onClick={() => dispatch({ type: "op", op: { op: "reload" } })} aria-label="Оновити" title="Оновити (F5)">
        ⟳
      </button>
      <button type="button" className="eb-tool eb-home" onClick={() => dispatch({ type: "op", op: { op: "navigate", url: browser.home, how: "home" } })} aria-label="Домашня сторінка" title="Домашня сторінка">
        🏠
      </button>
      <AddressBar
        web={web}
        url={url}
        bookmarked={bookmarked}
        inputRef={addressRef}
        onGo={(to) => dispatch({ type: "op", op: { op: "navigate", url: to, how: "typed" } })}
        onStar={() => dispatch({ type: "bookmarkDialog", open: true })}
      />
      <button type="button" className="eb-tool eb-tabs-count" onClick={() => panel("tabs")} aria-label={`Вкладки: ${browser.tabs.length}`} title="Усі вкладки">
        <span>{browser.tabs.length}</span>
      </button>
      <button type="button" className="eb-tool" onClick={() => panel("history")} aria-label="Історія" title="Історія (Ctrl+H)">
        🕘
      </button>
      {!large && (
        <button type="button" className="eb-tool" onClick={() => panel("bookmarks")} aria-label="Менеджер закладок" title="Менеджер закладок">
          📑
        </button>
      )}
      <button type="button" className="eb-tool eb-full" onClick={onFull} aria-label={full ? "Вийти з повного екрана" : "На весь екран"} title={full ? "Вийти з повного екрана" : "На весь екран"}>
        {full ? "🗗" : "⛶"}
      </button>
    </div>
  )
}
