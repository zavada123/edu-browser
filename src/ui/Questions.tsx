import { type FormEvent, useState } from "react"
import type { Question } from "../core/state.ts"
import type { UiAction } from "./store.ts"

const Answer = ({ question, saved, dispatch }: { readonly question: Question; readonly saved: string | undefined; readonly dispatch: (a: UiAction) => void }) => {
  const [text, setText] = useState(saved ?? "")
  const save = (e?: FormEvent) => {
    e?.preventDefault()
    if (text.trim() === (saved ?? "") || text.trim().length === 0) return
    dispatch({ type: "op", op: { op: "answer", question: question.id, text } })
  }
  const isSaved = saved !== undefined && text.trim() === saved
  return (
    <form className="eb-answer" onSubmit={save}>
      <label>
        <span>{question.text}</span>
        <span className="eb-answer-row">
          <input value={text} onChange={(e) => setText(e.target.value)} onBlur={() => save()} placeholder={question.placeholder} maxLength={80} autoComplete="off" />
          <button type="submit" className="eb-btn" disabled={isSaved || text.trim().length === 0}>
            {isSaved ? "✓" : "Записати"}
          </button>
        </span>
      </label>
    </form>
  )
}

/** The questions of the task: the student writes what they found on the sites. */
export const Questions = ({ questions, answers, dispatch }: { readonly questions: ReadonlyArray<Question>; readonly answers: Readonly<Record<string, string>>; readonly dispatch: (a: UiAction) => void }) =>
  questions.length === 0 ? null : (
    <div className="eb-questions">
      {questions.map((q) => (
        <Answer key={q.id} question={q} saved={answers[q.id]} dispatch={dispatch} />
      ))}
    </div>
  )
