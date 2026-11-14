import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react"
import { allMet } from "../core/goals.ts"
import { type Op, replay } from "../core/ops.ts"
import { searchUrl } from "../core/sites.ts"
import { activeTabOf, buildState, currentUrl, type Web } from "../core/state.ts"
import type { Url } from "../core/url.ts"
import type { Scenario } from "../scenarios/types.ts"
import { defaultWeb } from "../sites/index.ts"
import { BookmarkBar, BookmarkDialog, BookmarksPanel } from "./Bookmarks.tsx"
import { TabStrip, Toolbar } from "./Chrome.tsx"
import { useFullScreen } from "./fullscreen.ts"
import { commandFor } from "./keys.ts"
import { AntivirusDialog, DownloadsPanelBody, type PageActions, PopupWindow } from "./Interactive.tsx"
import type { LinkHandlers } from "./links.ts"
import { PageView } from "./PageView.tsx"
import { ContextMenu, HistoryPanel, SidePanel, TabsPanel } from "./Panels.tsx"
import { initialUi, reducer, type UiState } from "./store.ts"
import { type NextExercise, TaskPanel } from "./TaskPanel.tsx"
import "./browser.css"

const MESSAGE_MS = 4_000

/** Typing in a field keeps its own keys. */
const isTextField = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))

interface Props {
  /** To show another scenario, give the component a new `key`, for example the scenario id. */
  readonly scenario: Scenario
  /** Called after every check; `solved` is true when all conditions are met. */
  readonly onCheck?: (solved: boolean) => void
  /** Called with the log of all steps each time it changes. A page that grades on its server sends this log. */
  readonly onChange?: (ops: ReadonlyArray<Op>) => void
  /** A log saved earlier: the trainer starts with these steps made. An invalid log is ignored. */
  readonly initialOps?: ReadonlyArray<Op>
  /** `false` hides «Перевірити» when the page checks the answer itself. */
  readonly selfCheck?: boolean
  /** The exercise after this one: after a passed check the task card shows «Наступне завдання». */
  readonly next?: NextExercise
  /** The made-up sites. Default: every built-in site. */
  readonly web?: Web
}

const startUi = (web: Web, scenario: Scenario, ops: ReadonlyArray<Op>): UiState => {
  const begin = buildState(web, scenario.start)
  const replayed = replay(web, begin, ops)
  return replayed.ok ? initialUi(web, replayed.state, ops) : initialUi(web, begin)
}

/** The whole trainer for one scenario: a browser window with made-up sites and the task card. */
export const EduBrowser = ({ scenario, onCheck, onChange, initialOps = [], selfCheck = true, next, web = defaultWeb }: Props) => {
  const [state, dispatch] = useReducer(reducer, null, () => startUi(web, scenario, initialOps))
  const [taskOpen, setTaskOpen] = useState(true)
  const { full, toggle: toggleFull, handOver } = useFullScreen()
  const addressRef = useRef<HTMLInputElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const { browser } = state
  const tab = activeTabOf(browser)
  const url = tab ? currentUrl(tab) : ""

  const reset = useCallback(() => dispatch({ type: "reset", browser: buildState(web, scenario.start) }), [web, scenario])

  // A ref, so a new callback on every render of the page does not report the same log again.
  const changed = useRef(onChange)
  useEffect(() => {
    changed.current = onChange
  })
  useEffect(() => {
    changed.current?.(state.ops)
  }, [state.ops])

  useEffect(() => {
    if (state.message === null) return
    const timer = window.setTimeout(() => dispatch({ type: "dismiss" }), MESSAGE_MS)
    return () => window.clearTimeout(timer)
  }, [state.message])

  useEffect(() => {
    if (state.results !== null) onCheck?.(allMet(state.results))
  }, [state.results, onCheck])

  // A new page starts at its top, as in a real browser.
  useEffect(() => {
    pageRef.current?.scrollTo({ top: 0 })
  }, [url, browser.activeTab])

  const links: LinkHandlers = useMemo(
    () => ({
      open: (to: Url) => dispatch({ type: "op", op: { op: "navigate", url: to, how: "link" } }),
      openInNewTab: (to: Url) => dispatch({ type: "op", op: { op: "newTab", url: to, how: "link" } }),
      menu: (to: Url, x: number, y: number) => dispatch({ type: "menu", menu: { kind: "link", x, y, url: to } })
    }),
    []
  )
  const actions: PageActions = useMemo(
    () => ({
      submitted: browser.submitted,
      submit: (form: string) => dispatch({ type: "op", op: { op: "submitForm", form } }),
      report: (form: string) => dispatch({ type: "op", op: { op: "report", form } }),
      download: (file: string) => dispatch({ type: "op", op: { op: "download", file } })
    }),
    [browser.submitted]
  )
  const popup = browser.popups.find((p) => p.status === "open")
  const warned = browser.downloads.find((d) => d.status === "warned")
  const onSearch = useCallback((query: string) => dispatch({ type: "op", op: { op: "navigate", url: searchUrl(query), how: "typed" } }), [])

  /** Keys belong to the trainer only after a click inside it, so keys elsewhere on the page stay the page's. */
  const focused = useRef(false)
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      focused.current = rootRef.current?.contains(e.target as Node) ?? false
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (!focused.current) return
      const command = commandFor({ key: e.key, code: e.code, ctrl: e.ctrlKey || e.metaKey, shift: e.shiftKey, alt: e.altKey })
      if (command === null) return
      if (command === "escape") {
        if (state.menu || state.bookmarkDialog) dispatch({ type: "menu", menu: null })
        if (state.bookmarkDialog) dispatch({ type: "bookmarkDialog", open: false })
        else if (state.panel && !isTextField(e.target)) dispatch({ type: "panel", panel: null })
        return
      }
      // Ctrl shortcuts work even while typing in the address bar; Alt+arrows there move the caret.
      if (isTextField(e.target) && (command === "back" || command === "forward")) return
      e.preventDefault()
      const index = browser.tabs.findIndex((t) => t.id === browser.activeTab)
      const neighbour = (d: number) => browser.tabs[(index + d + browser.tabs.length) % browser.tabs.length]?.id ?? browser.activeTab
      switch (command) {
        case "newTab":
          return dispatch({ type: "op", op: { op: "newTab" } })
        case "closeTab":
          return dispatch({ type: "op", op: { op: "closeTab", tab: browser.activeTab } })
        case "nextTab":
          return dispatch({ type: "op", op: { op: "switchTab", tab: neighbour(1) } })
        case "prevTab":
          return dispatch({ type: "op", op: { op: "switchTab", tab: neighbour(-1) } })
        case "history":
          return dispatch({ type: "panel", panel: state.panel === "history" ? null : "history" })
        case "bookmark":
          return url === "about:newtab" ? undefined : dispatch({ type: "bookmarkDialog", open: true })
        case "address":
          addressRef.current?.focus()
          return addressRef.current?.select()
        case "back":
          return tab && tab.index > 0 ? dispatch({ type: "op", op: { op: "back" } }) : undefined
        case "forward":
          return tab && tab.index < tab.stack.length - 1 ? dispatch({ type: "op", op: { op: "forward" } }) : undefined
        case "reload":
          return dispatch({ type: "op", op: { op: "reload" } })
      }
    }
    document.addEventListener("pointerdown", onPointerDown, true)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [browser, tab, url, state.menu, state.bookmarkDialog, state.panel])

  const closePanel = () => dispatch({ type: "panel", panel: null })

  return (
    <div
      ref={rootRef}
      className={`eb-root${scenario.large ? " eb-large" : ""}${full ? " is-full" : ""}${state.panel ? " has-panel" : ""}`}
      // The trainer has its own menus: the real browser menu never opens over it.
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="eb-window">
        <TabStrip web={web} browser={browser} dispatch={dispatch} />
        {tab && <Toolbar web={web} browser={browser} tab={tab} large={scenario.large === true} addressRef={addressRef} dispatch={dispatch} full={full} onFull={toggleFull} />}
        <BookmarkBar web={web} browser={browser} dispatch={dispatch} />
        <div className="eb-body">
          <div className="eb-page" ref={pageRef}>
            <div key={`${browser.activeTab}|${url}|${state.reloads}|${state.resets}`} className="eb-page-inner">
              <PageView web={web} url={url} links={links} onSearch={onSearch} actions={actions} />
            </div>
          </div>
          {state.panel && (
            <SidePanel panel={state.panel} onClose={closePanel}>
              {state.panel === "history" && <HistoryPanel web={web} browser={browser} dispatch={dispatch} />}
              {state.panel === "bookmarks" && <BookmarksPanel web={web} browser={browser} dispatch={dispatch} />}
              {state.panel === "tabs" && <TabsPanel web={web} browser={browser} dispatch={dispatch} />}
              {state.panel === "downloads" && <DownloadsPanelBody downloads={browser.downloads} onDelete={(id) => dispatch({ type: "op", op: { op: "deleteDownload", id } })} />}
            </SidePanel>
          )}
        </div>
        {popup && (
          <PopupWindow
            popup={popup}
            onAccept={() => dispatch({ type: "op", op: { op: "acceptPopup", id: popup.spec.id } })}
            onClose={() => dispatch({ type: "op", op: { op: "closePopup", id: popup.spec.id } })}
          />
        )}
        {!popup && warned && (
          <AntivirusDialog
            item={warned}
            onDelete={() => dispatch({ type: "op", op: { op: "deleteDownload", id: warned.id } })}
            onOpen={() => dispatch({ type: "ops", ops: [{ op: "openDownload", id: warned.id }] })}
          />
        )}
        {state.bookmarkDialog && <BookmarkDialog key={url} web={web} browser={browser} dispatch={dispatch} />}
      </div>
      {state.menu && <ContextMenu web={web} browser={browser} menu={state.menu} dispatch={dispatch} />}
      {state.message !== null && (
        <div className="eb-toast" role="status">
          {state.message}
        </div>
      )}
      <TaskPanel
        scenario={scenario}
        state={state}
        open={taskOpen}
        onToggle={() => setTaskOpen((o) => !o)}
        onReset={reset}
        dispatch={dispatch}
        selfCheck={selfCheck}
        next={next}
        onNext={() => {
          handOver()
          next?.go()
        }}
      />
      {!taskOpen && (
        <button type="button" className="eb-task-show" onClick={() => setTaskOpen(true)}>
          📋 Завдання
        </button>
      )}
    </div>
  )
}
