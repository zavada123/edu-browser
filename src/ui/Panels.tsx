import { type ReactNode, useState } from "react"
import { iconOf, titleOf } from "../core/sites.ts"
import { type BrowserState, currentUrl, type HistoryEntry, type Web } from "../core/state.ts"
import type { Menu, Panel, UiAction } from "./store.ts"

const dayName = (day: number): string => (day === 0 ? "Сьогодні" : day === -1 ? "Учора" : `${-day} дні тому`)

/** History: newest first, grouped by day, with a search, «✕» on every entry and «Очистити історію». */
export const HistoryPanel = ({ web, browser, dispatch }: { readonly web: Web; readonly browser: BrowserState; readonly dispatch: (a: UiAction) => void }) => {
  const [query, setQuery] = useState("")
  const [confirm, setConfirm] = useState(false)
  const q = query.trim().toLocaleLowerCase("uk")
  const shown = [...browser.history].reverse().filter((h) => q.length === 0 || `${h.title} ${h.url}`.toLocaleLowerCase("uk").includes(q))
  const days = [...new Set(shown.map((h) => h.day))].sort((a, b) => b - a)
  const byDay = (day: number): ReadonlyArray<HistoryEntry> => shown.filter((h) => h.day === day)
  return (
    <div className="eb-panel-body">
      <input className="eb-panel-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Пошук в історії" aria-label="Пошук в історії" />
      {browser.history.length === 0 && <p className="eb-muted">Історія порожня.</p>}
      {browser.history.length > 0 && shown.length === 0 && <p className="eb-muted">Нічого не знайдено.</p>}
      {days.map((day) => (
        <section key={day} className="eb-group">
          <h3>{dayName(day)}</h3>
          <ul className="eb-rows">
            {byDay(day).map((h) => (
              <li key={h.id} className="eb-row">
                <span className="eb-row-icon" aria-hidden="true">
                  {iconOf(web.map, h.url)}
                </span>
                <button type="button" className="eb-row-main" onClick={() => dispatch({ type: "op", op: { op: "navigate", url: h.url, how: "history" } })}>
                  <span className="eb-row-title">{h.title}</span>
                  <span className="eb-row-url">{h.url}</span>
                </button>
                <button type="button" className="eb-icon-btn" aria-label={`Видалити з історії «${h.title}»`} title="Видалити з історії" onClick={() => dispatch({ type: "op", op: { op: "deleteHistory", id: h.id } })}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {browser.history.length > 0 &&
        (confirm ? (
          <div className="eb-confirm" role="alertdialog" aria-label="Очистити історію">
            <p>Видалити всю історію? Це не можна скасувати.</p>
            <button
              type="button"
              className="eb-btn is-danger"
              onClick={() => {
                dispatch({ type: "op", op: { op: "clearHistory" } })
                setConfirm(false)
              }}
            >
              Так, очистити
            </button>
            <button type="button" className="eb-btn" onClick={() => setConfirm(false)}>
              Скасувати
            </button>
          </div>
        ) : (
          <button type="button" className="eb-btn eb-clear" onClick={() => setConfirm(true)}>
            🧹 Очистити історію
          </button>
        ))}
    </div>
  )
}

/** On a phone: every tab as a row. */
export const TabsPanel = ({ web, browser, dispatch }: { readonly web: Web; readonly browser: BrowserState; readonly dispatch: (a: UiAction) => void }) => (
  <div className="eb-panel-body">
    <ul className="eb-rows">
      {browser.tabs.map((tab) => {
        const url = currentUrl(tab)
        const active = tab.id === browser.activeTab
        return (
          <li key={tab.id} className={`eb-row${active ? " is-active" : ""}`}>
            <span className="eb-row-icon" aria-hidden="true">
              {iconOf(web.map, url)}
            </span>
            <button type="button" className="eb-row-main" aria-current={active} onClick={() => dispatch({ type: "op", op: { op: "switchTab", tab: tab.id } })}>
              <span className="eb-row-title">{titleOf(web.map, url)}</span>
              <span className="eb-row-url">{url === "about:newtab" ? "" : url}</span>
            </button>
            <button type="button" className="eb-icon-btn" aria-label={`Закрити вкладку «${titleOf(web.map, url)}»`} onClick={() => dispatch({ type: "op", op: { op: "closeTab", tab: tab.id } })}>
              ✕
            </button>
          </li>
        )
      })}
    </ul>
    <button type="button" className="eb-btn is-primary" onClick={() => dispatch({ type: "op", op: { op: "newTab" } })}>
      + Нова вкладка
    </button>
  </div>
)

const PANEL_TITLES: Readonly<Record<Panel, string>> = { history: "🕘 Історія", bookmarks: "📑 Закладки", tabs: "Вкладки", downloads: "⬇ Завантаження" }

export const SidePanel = ({ panel, onClose, children }: { readonly panel: Panel; readonly onClose: () => void; readonly children: ReactNode }) => (
  <section className={`eb-panel eb-panel--${panel}`} aria-label={PANEL_TITLES[panel]}>
    <div className="eb-panel-head">
      <h2>{PANEL_TITLES[panel]}</h2>
      <button type="button" className="eb-icon-btn" aria-label="Закрити панель" onClick={onClose}>
        ✕
      </button>
    </div>
    {children}
  </section>
)

/** Right-click menus: a link, a bookmark on the bar, the bookmarks of a folder. */
export const ContextMenu = ({ web, browser, menu, dispatch }: { readonly web: Web; readonly browser: BrowserState; readonly menu: Menu; readonly dispatch: (a: UiAction) => void }) => {
  const close = () => dispatch({ type: "menu", menu: null })
  const items: Array<{ readonly label: ReactNode; readonly run: () => void }> = []
  if (menu.kind === "link") {
    items.push({ label: "Відкрити", run: () => dispatch({ type: "op", op: { op: "navigate", url: menu.url, how: "link" } }) })
    items.push({ label: "Відкрити в новій вкладці", run: () => dispatch({ type: "op", op: { op: "newTab", url: menu.url, how: "link" } }) })
  }
  if (menu.kind === "bookmark") {
    const b = browser.bookmarks.find((x) => x.id === menu.id)
    if (b) {
      items.push({ label: "Відкрити", run: () => dispatch({ type: "op", op: { op: "navigate", url: b.url, how: "bookmark" } }) })
      items.push({ label: "Відкрити в новій вкладці", run: () => dispatch({ type: "op", op: { op: "newTab", url: b.url, how: "bookmark" } }) })
      items.push({ label: "Змінити…", run: () => dispatch({ type: "panel", panel: "bookmarks" }) })
      items.push({ label: "Видалити", run: () => dispatch({ type: "op", op: { op: "deleteBookmark", id: b.id } }) })
    }
  }
  if (menu.kind === "folder") {
    const inFolder = browser.bookmarks.filter((b) => b.folder === menu.folder)
    for (const b of inFolder)
      items.push({
        label: (
          <>
            <span aria-hidden="true">{iconOf(web.map, b.url)}</span> {b.title}
          </>
        ),
        run: () => dispatch({ type: "op", op: { op: "navigate", url: b.url, how: "bookmark" } })
      })
    if (inFolder.length === 0) items.push({ label: <span className="eb-muted">Папка порожня</span>, run: close })
  }
  // Keep the menu inside the window.
  const x = Math.min(menu.x, window.innerWidth - 240)
  const y = Math.min(menu.y, window.innerHeight - 44 * items.length - 12)
  return (
    <>
      <div className="eb-backdrop" onPointerDown={close} onContextMenu={(e) => e.preventDefault()} />
      <ul className="eb-menu" role="menu" style={{ left: Math.max(8, x), top: Math.max(8, y) }}>
        {items.map((item, i) => (
          <li key={i} role="none">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close()
                item.run()
              }}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
