import { allMet } from "../core/goals.ts"
import type { Scenario } from "../scenarios/types.ts"
import { Questions } from "./Questions.tsx"
import type { UiAction, UiState } from "./store.ts"

interface Props {
  readonly scenario: Scenario
  readonly state: UiState
  readonly open: boolean
  readonly onToggle: () => void
  readonly onReset: () => void
  readonly dispatch: (action: UiAction) => void
  readonly selfCheck: boolean
  readonly next?: NextExercise | undefined
  readonly onNext: () => void
}

/** The exercise the page opens after this one. */
export interface NextExercise {
  readonly title: string
  readonly go: () => void
}

/** The task card: what to do, the "Перевірити" button and the result of each condition. */
export const TaskPanel = ({ scenario, state, open, onToggle, onReset, dispatch, selfCheck, next, onNext }: Props) => {
  const results = state.results
  const solved = results !== null && allMet(results)
  // Not a landmark (aside, header): a page can show several trainers, and their landmarks would have the same name.
  return (
    <div className={`eb-task ${open ? "is-open" : ""}`}>
      <div className="eb-task-head">
        <h2>{scenario.title}</h2>
        <button type="button" className="eb-task-hide" aria-label="Сховати завдання" onClick={onToggle}>
          ✕
        </button>
      </div>
      <ol className="eb-task-steps">
        {scenario.task.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <Questions key={state.resets} questions={state.browser.questions} answers={state.browser.answers} dispatch={dispatch} />
      <div className="eb-task-actions">
        {selfCheck && (
          <button type="button" className="eb-check" onClick={() => dispatch({ type: "check", goals: scenario.goals })}>
            Перевірити
          </button>
        )}
        <button type="button" className="eb-reset" onClick={onReset}>
          Почати спочатку
        </button>
      </div>
      {results !== null && (
        <div className={`eb-results ${solved ? "is-solved" : ""}`} role="status">
          <p className="eb-results-head">{solved ? "🎉 Молодець! Усе виконано." : `Виконано ${results.filter((r) => r.ok).length} з ${results.length}`}</p>
          <ul>
            {results.map((r) => (
              <li key={r.text} className={r.ok ? "is-ok" : "is-bad"}>
                <span aria-hidden="true">{r.ok ? "✅" : "❌"}</span> {r.text}
                {!r.ok && <small>{r.hint}</small>}
              </li>
            ))}
          </ul>
          {solved && next !== undefined && (
            <button type="button" className="eb-next" onClick={onNext}>
              <span>Наступне завдання →</span>
              <small>{next.title}</small>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
