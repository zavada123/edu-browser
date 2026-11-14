import { type FormEvent, type RefObject, useEffect, useState } from "react"
import { nextZoom } from "../core/ops.ts"
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

/** The «⋮» menu: search on the page and the zoom, as in a desktop browser. Not in the large mode. */
const MoreMenu = ({ zoom, dispatch }: { readonly zoom: number; readonly dispatch: (a: UiAction) => void }) => {
  const [open, setOpen] = useState(false)
  const setZoom = (level: number) => dispatch({ type: "op", op: { op: "zoom", level } })
  return (
    <div className="eb-more">
      <button type="button" className="eb-tool" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} aria-label="Меню" title="Меню">
        ⋮
      </button>
      {open && (
        <>
          <div className="eb-backdrop" onPointerDown={() => setOpen(false)} />
          <div className="eb-menu eb-more-menu" role="menu" aria-label="Меню">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                dispatch({ type: "findBar", open: true })
              }}
            >
              🔍 Знайти на сторінці <kbd>Ctrl+F</kbd>
            </button>
            <div className="eb-zoom-row" role="group" aria-label="Масштаб">
              <span>Масштаб</span>
              <button type="button" role="menuitem" onClick={() => setZoom(nextZoom(zoom, -1))} disabled={zoom === nextZoom(zoom, -1)} aria-label="Зменшити масштаб" title="Зменшити (Ctrl −)">
                −
              </button>
              <button type="button" role="menuitem" onClick={() => setZoom(100)} aria-label={`Масштаб ${zoom} %, повернути 100 %`} title="Повернути 100 % (Ctrl+0)">
                {zoom} %
              </button>
              <button type="button" role="menuitem" onClick={() => setZoom(nextZoom(zoom, 1))} disabled={zoom === nextZoom(zoom, 1)} aria-label="Збільшити масштаб" title="Збільшити (Ctrl +)">
                +
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export const Toolbar = ({ web, browser, tab, large, addressRef, dispatch, full, onFull }: ToolbarProps) => {
  const url = currentUrl(tab)
  const bookmarked = browser.bookmarks.some((b) => b.url === url)
  const panel = (p: "history" | "bookmarks" | "tabs" | "downloads") => dispatch({ type: "panel", panel: p })
  return (
    <div className="eb-toolbar">
      <button type="button" className="eb-tool" disabled={tab.index === 0} onClick={() => dispatch({ type: "op", op: { op: "back" } })} aria-label="Назад" title="Назад (Alt+←)">
        ←
      </button>
      <button type="button" className="eb-tool eb-forward" disabled={tab.index >= tab.stack.length - 1} onClick={() => dispatch({ type: "op", op: { op: "forward" } })} aria-label="Вперед" title="Вперед (Alt+→)">
        →
      </button>
      <button type="button" className="eb-tool eb-reload" onClick={() => dispatch({ type: "op", op: { op: "reload" } })} aria-label="Оновити" title="Оновити (F5)">
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
      {browser.zoom !== 100 && (
        <button
          type="button"
          className="eb-zoom-badge"
          onClick={() => dispatch({ type: "op", op: { op: "zoom", level: 100 } })}
          aria-label={`Масштаб ${browser.zoom} %. Повернути 100 %`}
          title="Повернути 100 % (Ctrl+0)"
        >
          🔍 {browser.zoom} %
        </button>
      )}
      <button type="button" className="eb-tool eb-tabs-count" onClick={() => panel("tabs")} aria-label={`Вкладки: ${browser.tabs.length}`} title="Усі вкладки">
        <span>{browser.tabs.length}</span>
      </button>
      <button type="button" className="eb-tool" onClick={() => panel("history")} aria-label="Історія" title="Історія (Ctrl+H)">
        🕘
      </button>
      {browser.downloads.length > 0 && (
        <button type="button" className="eb-tool" onClick={() => panel("downloads")} aria-label="Завантаження" title="Завантаження">
          ⬇
        </button>
      )}
      <button type="button" className="eb-tool eb-adult" onClick={() => dispatch({ type: "op", op: { op: "callAdult" } })} aria-label="Покликати дорослого" title="Покликати дорослого">
        🙋
      </button>
      {!large && (
        <button type="button" className="eb-tool" onClick={() => panel("bookmarks")} aria-label="Менеджер закладок" title="Менеджер закладок">
          📑
        </button>
      )}
      {!large && <MoreMenu zoom={browser.zoom} dispatch={dispatch} />}
      <button type="button" className="eb-tool eb-full" onClick={onFull} aria-label={full ? "Вийти з повного екрана" : "На весь екран"} title={full ? "Вийти з повного екрана" : "На весь екран"}>
        {full ? "🗗" : "⛶"}
      </button>
    </div>
  )
}
