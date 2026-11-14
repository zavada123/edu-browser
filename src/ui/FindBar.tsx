import { type FormEvent, type RefObject, useEffect, useRef, useState } from "react"

/** Highlight names for the CSS Custom Highlight API: every match, and the one in focus. */
const ALL = "eb-find"
const CURRENT = "eb-find-current"

/** Older browsers have no highlights: the bar still counts and scrolls to the matches. */
const canHighlight = (): boolean => typeof Highlight !== "undefined" && typeof CSS !== "undefined" && "highlights" in CSS

const clearHighlights = () => {
  if (!canHighlight()) return
  CSS.highlights.delete(ALL)
  CSS.highlights.delete(CURRENT)
}

/** Ranges of every match of `query` in the text under `root`, ignoring case. The page is not changed. */
const findRanges = (root: HTMLElement, query: string): ReadonlyArray<Range> => {
  const needle = query.trim().toLocaleLowerCase("uk")
  if (needle.length === 0) return []
  const ranges: Range[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const text = (node.nodeValue ?? "").toLocaleLowerCase("uk")
    for (let at = text.indexOf(needle); at >= 0; at = text.indexOf(needle, at + needle.length)) {
      const range = document.createRange()
      range.setStart(node, at)
      range.setEnd(node, at + needle.length)
      ranges.push(range)
    }
  }
  return ranges
}

interface Props {
  /** The page to search in. */
  readonly pageRef: RefObject<HTMLDivElement | null>
  /** Changes when the page in front changes, so the matches are found again. */
  readonly pageKey: string
  /** Called on Enter with new words: the trainer records the search. */
  readonly onSearch: (text: string) => void
  readonly onClose: () => void
}

/** «Знайти на сторінці» (Ctrl+F): a field under the toolbar that highlights the words on the page. */
export const FindBar = ({ pageRef, pageKey, onSearch, onClose }: Props) => {
  const [text, setText] = useState("")
  const [ranges, setRanges] = useState<ReadonlyArray<Range>>([])
  const [current, setCurrent] = useState(0)
  const logged = useRef("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    return clearHighlights
  }, [])

  // Find again when the words or the page change. The new page renders first, so wait for it.
  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      const root = pageRef.current
      setRanges(root ? findRanges(root, text) : [])
      setCurrent(0)
    })
    return () => window.cancelAnimationFrame(id)
  }, [text, pageKey, pageRef])

  useEffect(() => {
    if (!canHighlight()) return
    const focus = ranges[current]
    CSS.highlights.set(ALL, new Highlight(...ranges))
    if (focus) CSS.highlights.set(CURRENT, new Highlight(focus))
    else CSS.highlights.delete(CURRENT)
    focus?.startContainer.parentElement?.scrollIntoView({ block: "center" })
  }, [ranges, current])

  const move = (delta: 1 | -1) => {
    if (ranges.length > 0) setCurrent((c) => (c + delta + ranges.length) % ranges.length)
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const words = text.trim()
    if (words.length === 0) return
    if (words !== logged.current) {
      logged.current = words
      onSearch(words)
    } else move(1)
  }
  const query = text.trim()
  return (
    <form className="eb-findbar" role="search" onSubmit={submit}>
      <input
        ref={inputRef}
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation()
            onClose()
          }
        }}
        placeholder="Знайти на сторінці"
        aria-label="Знайти на сторінці"
        maxLength={60}
        enterKeyHint="search"
        autoComplete="off"
      />
      <span className="eb-findbar-count" role="status">
        {query.length === 0 ? "" : ranges.length === 0 ? "Немає збігів" : `${current + 1} з ${ranges.length}`}
      </span>
      <button type="button" className="eb-tool" onClick={() => move(-1)} disabled={ranges.length < 2} aria-label="Попередній збіг" title="Попередній збіг">
        ↑
      </button>
      <button type="button" className="eb-tool" onClick={() => move(1)} disabled={ranges.length < 2} aria-label="Наступний збіг" title="Наступний збіг (Enter)">
        ↓
      </button>
      <button type="button" className="eb-tool" onClick={onClose} aria-label="Закрити пошук на сторінці" title="Закрити (Esc)">
        ✕
      </button>
    </form>
  )
}
