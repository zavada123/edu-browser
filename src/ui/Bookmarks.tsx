import { type FormEvent, useRef, useState } from "react"
import type { Op } from "../core/ops.ts"
import { iconOf, titleOf } from "../core/sites.ts"
import { activeTabOf, type Bookmark, type BrowserState, currentUrl, type Web } from "../core/state.ts"
import { Select, type SelectOption } from "./Select.tsx"
import type { UiAction } from "./store.ts"

const BAR = ""
const NEW_FOLDER = "\u0000new"

/** Where a bookmark can live: the bar itself or one of the folders. */
const folderOptions = (folders: ReadonlyArray<string>): ReadonlyArray<SelectOption<string>> => [
  { value: BAR, label: "Панель закладок" },
  ...folders.map((f) => ({ value: f, label: `📁 ${f}` }))
]

/** The bar under the address bar: bookmarks of the bar itself, then the folders. */
export const BookmarkBar = ({ web, browser, dispatch }: { readonly web: Web; readonly browser: BrowserState; readonly dispatch: (a: UiAction) => void }) => {
  const onBar = browser.bookmarks.filter((b) => b.folder === BAR)
  const empty = onBar.length === 0 && browser.folders.length === 0
  return (
    <div className={`eb-bookmark-bar${empty ? " is-empty" : ""}`} aria-label="Панель закладок">
      {empty && <span className="eb-muted">Тут з'являться закладки. Натисни ☆ в адресному рядку.</span>}
      {onBar.map((b) => (
        <button
          key={b.id}
          type="button"
          className="eb-chip"
          title={`${b.title}\n${b.url}`}
          onClick={() => dispatch({ type: "op", op: { op: "navigate", url: b.url, how: "bookmark" } })}
          onContextMenu={(e) => {
            e.preventDefault()
            dispatch({ type: "menu", menu: { kind: "bookmark", x: e.clientX, y: e.clientY, id: b.id } })
          }}
        >
          <span aria-hidden="true">{iconOf(web.map, b.url)}</span>
          <span className="eb-chip-text">{b.title}</span>
        </button>
      ))}
      {browser.folders.map((folder) => (
        <button
          key={folder}
          type="button"
          className="eb-chip eb-chip-folder"
          aria-haspopup="menu"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            dispatch({ type: "menu", menu: { kind: "folder", x: r.left, y: r.bottom + 2, folder } })
          }}
        >
          <span aria-hidden="true">📁</span>
          <span className="eb-chip-text">{folder}</span>
        </button>
      ))}
    </div>
  )
}

/** The star dialog: name the bookmark and choose its folder, or a new folder. */
export const BookmarkDialog = ({ web, browser, dispatch }: { readonly web: Web; readonly browser: BrowserState; readonly dispatch: (a: UiAction) => void }) => {
  const tab = activeTabOf(browser)
  const url = tab ? currentUrl(tab) : ""
  const existing = browser.bookmarks.find((b) => b.url === url)
  const [title, setTitle] = useState(existing?.title ?? titleOf(web.map, url))
  const [folder, setFolder] = useState(existing?.folder ?? BAR)
  const [newFolder, setNewFolder] = useState("")
  const close = () => dispatch({ type: "bookmarkDialog", open: false })

  const save = (e: FormEvent) => {
    e.preventDefault()
    const ops: Op[] = []
    let target = folder
    if (folder === NEW_FOLDER) {
      const name = newFolder.trim()
      if (name.length === 0) {
        dispatch({ type: "notify", message: "Надрукуй назву нової папки." })
        return
      }
      const same = browser.folders.find((f) => f.toLocaleLowerCase("uk") === name.toLocaleLowerCase("uk"))
      if (same === undefined) ops.push({ op: "addFolder", name })
      target = same ?? name.replace(/\s+/g, " ")
    }
    if (existing) {
      if (title.trim() !== existing.title && title.trim().length > 0) ops.push({ op: "renameBookmark", id: existing.id, title })
      if (target !== existing.folder) ops.push({ op: "moveBookmark", id: existing.id, folder: target })
    } else ops.push({ op: "addBookmark", title, folder: target })
    if (ops.length > 0) dispatch({ type: "ops", ops })
    close()
  }

  return (
    <>
      <div className="eb-backdrop" onPointerDown={close} />
      <form className="eb-dialog eb-bookmark-dialog" role="dialog" aria-label={existing ? "Зміна закладки" : "Нова закладка"} onSubmit={save}>
        <h2>{existing ? "Закладку додано" : "Додати закладку"}</h2>
        <label>
          <span>Назва</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} autoFocus />
        </label>
        <div className="eb-field">
          <span>Папка</span>
          <Select
            ariaLabel="Папка"
            value={folder}
            options={[...folderOptions(browser.folders), { value: NEW_FOLDER, label: "➕ Нова папка…" }]}
            onChange={setFolder}
          />
        </div>
        {folder === NEW_FOLDER && (
          <label>
            <span>Назва нової папки</span>
            <input value={newFolder} onChange={(e) => setNewFolder(e.target.value)} maxLength={60} autoFocus placeholder="Наприклад, Навчання" />
          </label>
        )}
        <div className="eb-dialog-actions">
          {existing && (
            <button
              type="button"
              className="eb-btn"
              onClick={() => {
                dispatch({ type: "op", op: { op: "deleteBookmark", id: existing.id } })
                close()
              }}
            >
              Видалити
            </button>
          )}
          <button type="submit" className="eb-btn is-primary">
            Готово
          </button>
        </div>
      </form>
    </>
  )
}

const BookmarkRow = ({ web, bookmark, folders, dispatch }: { readonly web: Web; readonly bookmark: Bookmark; readonly folders: ReadonlyArray<string>; readonly dispatch: (a: UiAction) => void }) => {
  const [renaming, setRenaming] = useState(false)
  const [title, setTitle] = useState(bookmark.title)
  // Enter submits and then the input loses focus: the second call must not rename again.
  const finished = useRef(false)
  const rename = (e: FormEvent) => {
    e.preventDefault()
    if (finished.current) return
    finished.current = true
    if (title.trim().length > 0 && title.trim() !== bookmark.title) dispatch({ type: "op", op: { op: "renameBookmark", id: bookmark.id, title } })
    setRenaming(false)
  }
  return (
    <li className="eb-row">
      <span className="eb-row-icon" aria-hidden="true">
        {iconOf(web.map, bookmark.url)}
      </span>
      {renaming ? (
        <form className="eb-row-main" onSubmit={rename}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={rename} maxLength={60} autoFocus aria-label="Нова назва закладки" />
        </form>
      ) : (
        <button type="button" className="eb-row-main" onClick={() => dispatch({ type: "op", op: { op: "navigate", url: bookmark.url, how: "bookmark" } })}>
          <span className="eb-row-title">{bookmark.title}</span>
          <span className="eb-row-url">{bookmark.url}</span>
        </button>
      )}
      <Select
        className="eb-row-folder"
        value={bookmark.folder}
        ariaLabel={`Папка закладки «${bookmark.title}»`}
        options={folderOptions(folders)}
        onChange={(folder) => dispatch({ type: "op", op: { op: "moveBookmark", id: bookmark.id, folder } })}
      />
      <button type="button" className="eb-icon-btn" aria-label={`Перейменувати «${bookmark.title}»`} title="Перейменувати" onClick={() => {
          finished.current = false
          setTitle(bookmark.title)
          setRenaming(true)
        }}>
        ✏️
      </button>
      <button type="button" className="eb-icon-btn" aria-label={`Видалити «${bookmark.title}»`} title="Видалити" onClick={() => dispatch({ type: "op", op: { op: "deleteBookmark", id: bookmark.id } })}>
        ✕
      </button>
    </li>
  )
}

/** The bookmark manager: every folder with its bookmarks; rename, move to a folder, delete; a new folder. */
export const BookmarksPanel = ({ web, browser, dispatch }: { readonly web: Web; readonly browser: BrowserState; readonly dispatch: (a: UiAction) => void }) => {
  const [name, setName] = useState("")
  const addFolder = (e: FormEvent) => {
    e.preventDefault()
    if (name.trim().length === 0) return
    dispatch({ type: "op", op: { op: "addFolder", name } })
    setName("")
  }
  const groups = [BAR, ...browser.folders]
  return (
    <div className="eb-panel-body">
      {groups.map((folder) => {
        const items = browser.bookmarks.filter((b) => b.folder === folder)
        return (
          <section key={folder || "bar"} className="eb-group">
            <h3>{folder === BAR ? "⭐ Панель закладок" : `📁 ${folder}`}</h3>
            {items.length === 0 ? (
              <p className="eb-muted">Порожньо</p>
            ) : (
              <ul className="eb-rows">
                {items.map((b) => (
                  <BookmarkRow key={b.id} web={web} bookmark={b} folders={browser.folders} dispatch={dispatch} />
                ))}
              </ul>
            )}
          </section>
        )
      })}
      <form className="eb-inline-form" onSubmit={addFolder}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Назва нової папки" aria-label="Назва нової папки" maxLength={60} />
        <button type="submit" className="eb-btn">
          Нова папка
        </button>
      </form>
    </div>
  )
}
