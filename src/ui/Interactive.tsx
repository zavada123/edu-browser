import { type FormEvent, useState } from "react"
import type { ChatMessage } from "../core/sites.ts"
import type { Download, PopupState } from "../core/state.ts"

/** What the blocks of a page can do besides links. */
export interface PageActions {
  readonly submitted: ReadonlyArray<string>
  readonly submit: (form: string) => void
  readonly report: (form: string) => void
  readonly download: (file: string) => void
}

/** A form asks for data. Nothing is sent anywhere and nothing typed is kept: only the press is recorded. */
export const FormBlock = ({ id, title, fields, button, actions }: { readonly id: string; readonly title: string; readonly fields: ReadonlyArray<string>; readonly button: string; readonly actions: PageActions }) => {
  const sent = actions.submitted.includes(id)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    actions.submit(id)
  }
  if (sent)
    return (
      <div className="eb-form is-sent" role="status">
        <b>Дані надіслано.</b> Тепер їх знають незнайомі люди, і забрати їх назад уже не можна.
      </div>
    )
  return (
    <form className="eb-form" onSubmit={submit} autoComplete="off">
      <h2>{title}</h2>
      {fields.map((field) => (
        <label key={field}>
          <span>{field}</span>
          <input name={field} autoComplete="off" />
        </label>
      ))}
      <button type="submit" className="eb-form-send">
        {button}
      </button>
    </form>
  )
}

/** A chat with scripted messages. What the student writes stays on their screen only. */
export const ChatBlock = ({ id, title, messages, reply, actions }: { readonly id: string; readonly title: string; readonly messages: ReadonlyArray<ChatMessage>; readonly reply: string | undefined; readonly actions: PageActions }) => {
  const [text, setText] = useState("")
  const [mine, setMine] = useState<ReadonlyArray<string>>([])
  const [reported, setReported] = useState(false)
  const send = (e: FormEvent) => {
    e.preventDefault()
    if (text.trim().length === 0) return
    setMine([...mine, text.trim()])
    setText("")
    actions.submit(id)
  }
  return (
    <section className="eb-chat" aria-label={title}>
      <h2>💬 {title}</h2>
      <ul className="eb-chat-log">
        {messages.map((m, i) => (
          <li key={i}>
            <b>{m.from}:</b> {m.text}
          </li>
        ))}
        {mine.map((m, i) => (
          <li key={`me${i}`} className="is-mine">
            <b>Ти:</b> {m}
          </li>
        ))}
        {mine.length > 0 && reply !== undefined && (
          <li>
            <b>{messages.at(-1)?.from ?? "?"}:</b> {reply}
          </li>
        )}
        {reported && <li className="is-system">Скаргу надіслано. Модератор перевірить повідомлення.</li>}
      </ul>
      <form className="eb-chat-send" onSubmit={send}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Напиши повідомлення…" aria-label="Повідомлення" autoComplete="off" />
        <button type="submit" className="eb-btn">
          Надіслати
        </button>
      </form>
      <button
        type="button"
        className="eb-btn eb-chat-report"
        disabled={reported}
        onClick={() => {
          setReported(true)
          actions.report(id)
        }}
      >
        🚩 Поскаржитися
      </button>
    </section>
  )
}

export const DownloadBlock = ({ file, label, size, actions }: { readonly file: string; readonly label: string; readonly size: string; readonly actions: PageActions }) => (
  <div className="eb-download">
    <span className="eb-download-icon" aria-hidden="true">
      📦
    </span>
    <span className="eb-download-name">
      {file}
      <small>{size}</small>
    </span>
    <button type="button" className="eb-btn is-primary" onClick={() => actions.download(file)}>
      ⬇ {label}
    </button>
  </div>
)

/** A window over the page. It blocks the page until the student chooses. */
export const PopupWindow = ({ popup, onAccept, onClose }: { readonly popup: PopupState; readonly onAccept: () => void; readonly onClose: () => void }) => (
  <div className="eb-popup-layer">
    <div className="eb-popup" role="alertdialog" aria-modal="true" aria-labelledby={`eb-popup-${popup.spec.id}`}>
      <button type="button" className="eb-popup-x" aria-label="Закрити вікно" onClick={onClose}>
        ✕
      </button>
      {popup.spec.icon && (
        <div className="eb-popup-icon" aria-hidden="true">
          {popup.spec.icon}
        </div>
      )}
      <h2 id={`eb-popup-${popup.spec.id}`}>{popup.spec.title}</h2>
      <p>{popup.spec.text}</p>
      <button type="button" className="eb-popup-accept" onClick={onAccept}>
        {popup.spec.accept}
      </button>
      {popup.spec.decline && (
        <button type="button" className="eb-popup-decline" onClick={onClose}>
          {popup.spec.decline}
        </button>
      )}
    </div>
  </div>
)

/** The antivirus stops a dangerous file and asks what to do. */
export const AntivirusDialog = ({ item, onDelete, onOpen }: { readonly item: Download; readonly onDelete: () => void; readonly onOpen: () => void }) => (
  <div className="eb-popup-layer">
    <div className="eb-antivirus" role="alertdialog" aria-modal="true" aria-labelledby="eb-av-title">
      <div className="eb-antivirus-head">🛡️ Антивірус</div>
      <h2 id="eb-av-title">Знайдено загрозу!</h2>
      <p>
        У файлі <b>{item.file}</b> є вірус. Він може зіпсувати комп'ютер або вкрасти твої дані.
      </p>
      <div className="eb-dialog-actions">
        <button type="button" className="eb-btn" onClick={onOpen}>
          Відкрити все одно
        </button>
        <button type="button" className="eb-btn is-primary" onClick={onDelete}>
          Видалити файл
        </button>
      </div>
    </div>
  </div>
)

const STATUS_TEXT: Readonly<Record<Download["status"], string>> = {
  done: "Завантажено",
  warned: "⚠️ Знайдено вірус",
  deleted: "Видалено",
  opened: "⚠️ Відкрито"
}

export const DownloadsPanelBody = ({ downloads, onDelete }: { readonly downloads: ReadonlyArray<Download>; readonly onDelete: (id: number) => void }) => (
  <div className="eb-panel-body">
    {downloads.length === 0 && <p className="eb-muted">Ти ще нічого не завантажував.</p>}
    <ul className="eb-rows">
      {[...downloads].reverse().map((d) => (
        <li key={d.id} className="eb-row">
          <span className="eb-row-icon" aria-hidden="true">
            📦
          </span>
          <span className="eb-row-main">
            <span className={`eb-row-title${d.status === "deleted" ? " is-deleted" : ""}`}>{d.file}</span>
            <span className="eb-row-url">
              {STATUS_TEXT[d.status]} · {d.from}
            </span>
          </span>
          {d.status !== "deleted" && (
            <button type="button" className="eb-icon-btn" aria-label={`Видалити «${d.file}»`} title="Видалити файл" onClick={() => onDelete(d.id)}>
              🗑
            </button>
          )}
        </li>
      ))}
    </ul>
  </div>
)
