import { canonicalUrl, SEARCH_HOST, SEARCH_PATH, titleOf } from "./sites.ts"
import { type Action, activeTabOf, type BrowserState, currentEntry, currentUrl, type How, type Web } from "./state.ts"
import { hostOf, parseUrl, type Url } from "./url.ts"

/**
 * Conditions a scenario checks at the end. Authors pick them from this list, no programming needed.
 * Addresses are written as in the address bar: `космос.edu/місяць`. An address of a whole site
 * (`приз-телефон.win`) in `notVisited` covers every page of that site.
 */
export type Goal = (
  | { readonly type: "activeTab"; readonly url: Url; readonly how?: How }
  /** The page in front is any page of this site. */
  | { readonly type: "activeSite"; readonly host: string }
  | { readonly type: "tabOpen"; readonly url: Url }
  | { readonly type: "tabCount"; readonly equals: number }
  /** At least `pages` tabs show different pages of one site. */
  | { readonly type: "siteTabs"; readonly host: string; readonly pages: number }
  | { readonly type: "visited"; readonly url: Url; readonly how?: How }
  /** The student searched on the search site, and the query held every one of these words. */
  | { readonly type: "searched"; readonly words: ReadonlyArray<string> }
  | { readonly type: "notVisited"; readonly url: Url }
  /** The student searched on a page with Ctrl+F, and the search held every one of these words. Optional: on this page. */
  | { readonly type: "foundOnPage"; readonly words: ReadonlyArray<string>; readonly url?: Url }
  /** The page zoom at the end is in this range, in percent: «збільш масштаб до 150 %». */
  | { readonly type: "zoom"; readonly min?: number; readonly max?: number }
  | { readonly type: "used"; readonly action: Action; readonly times?: number }
  | { readonly type: "bookmark"; readonly url: Url; readonly folder?: string; readonly title?: string }
  | { readonly type: "noBookmark"; readonly url: Url }
  | { readonly type: "folder"; readonly name: string }
  | { readonly type: "historyHas"; readonly url: Url }
  | { readonly type: "historyHasNot"; readonly url: Url }
  | { readonly type: "historyCount"; readonly equals: number }
  /** The student sent / did not send the form or chat message with this id. */
  | { readonly type: "submitted"; readonly form: string }
  | { readonly type: "notSubmitted"; readonly form: string }
  /** The popup was closed with ✕ or its safe button, without pressing the tempting one. */
  | { readonly type: "popupClosed"; readonly id: string }
  | { readonly type: "downloaded"; readonly file: string }
  /** The file was downloaded and then deleted (after the antivirus warning, for example). */
  | { readonly type: "downloadDeleted"; readonly file: string }
  /** The file was never opened. */
  | { readonly type: "notOpened"; readonly file: string }
  /**
   * The answer to the question matches one of `accept`. Case, spaces, quotes, the stress mark and
   * the kind of apostrophe do not matter: «Остап Квітковий» = «остап  квітковий».
   */
  | { readonly type: "answer"; readonly question: string; readonly accept: ReadonlyArray<string> }
) & { readonly text?: string; readonly hint?: string }

export interface GoalResult {
  readonly goal: Goal
  readonly ok: boolean
  /** What the student sees in the task list. */
  readonly text: string
  /** Shown only when the condition is not met. */
  readonly hint: string
}

/** Compares answers the way a teacher would: no case, extra spaces, quotes, stress marks or apostrophe kinds. */
export const normalizeAnswer = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/\u0301/g, "")
    .normalize("NFC")
    .toLocaleLowerCase("uk")
    .replace(/[’ʼ`´]/g, "'")
    .replace(/[«»"„“”.!?]/g, "")
    .replace(/\s*([–—-])\s*/g, "-")
    .replace(/\s+/g, " ")
    .trim()

const sameAnswer = (a: string, b: string): boolean => normalizeAnswer(a) === normalizeAnswer(b)

const sameText = (a: string, b: string): boolean => a.trim().toLocaleLowerCase("uk") === b.trim().toLocaleLowerCase("uk")

const HOW_TEXT: Readonly<Record<How, string>> = {
  start: "",
  typed: ", адресу надруковано",
  link: " за посиланням",
  bookmark: " із закладки",
  history: " з історії",
  home: " кнопкою «Домашня сторінка»",
  back: " кнопкою «Назад»",
  forward: " кнопкою «Вперед»",
  popup: " зі спливного вікна"
}

const ACTION_TEXT: Readonly<Record<Action, string>> = {
  back: "Натиснуто «Назад»",
  forward: "Натиснуто «Вперед»",
  reload: "Сторінку оновлено",
  newTab: "Відкрито нову вкладку",
  closeTab: "Закрито вкладку",
  home: "Натиснуто «Домашня сторінка»",
  deleteHistory: "Із історії видалено запис",
  clearHistory: "Історію очищено",
  callAdult: "Ти покликав дорослого",
  report: "Ти поскаржився на повідомлення",
  find: "Ти шукав на сторінці (Ctrl+F)",
  zoom: "Ти змінив масштаб сторінки"
}

/** Default wording of a goal for the task list. */
export const describeGoal = (web: Web, goal: Goal): string => {
  if (goal.text !== undefined) return goal.text
  const page = (url: Url) => `«${titleOf(web.map, canonicalUrl(web.map, url))}»`
  switch (goal.type) {
    case "activeTab":
      return `Відкрито сторінку ${page(goal.url)}${goal.how ? HOW_TEXT[goal.how] : ""}`
    case "activeSite":
      return `Відкрито сайт ${goal.host}`
    case "tabOpen":
      return `Є вкладка зі сторінкою ${page(goal.url)}`
    case "tabCount":
      return `Відкрито вкладок: ${goal.equals}`
    case "siteTabs":
      return `${goal.pages} різні сторінки сайту ${goal.host} відкрито в окремих вкладках`
    case "visited":
      return `Ти побував на сторінці ${page(goal.url)}${goal.how ? HOW_TEXT[goal.how] : ""}`
    case "searched":
      return `Ти шукав у пошуковику: ${goal.words.join(" ")}`
    case "notVisited":
      return `Ти не відкривав ${parseUrl(goal.url).path === "" ? `сайт ${goal.url}` : page(goal.url)}`
    case "foundOnPage":
      return `Ти шукав на сторінці${goal.url ? ` ${page(goal.url)}` : ""}: ${goal.words.join(" ")}`
    case "zoom":
      return goal.min !== undefined && goal.min > 100
        ? `Масштаб сторінки не менше ${goal.min} %`
        : goal.max !== undefined && goal.max <= 100
          ? `Масштаб сторінки не більше ${goal.max} %`
          : "Масштаб сторінки змінено правильно"
    case "used":
      return goal.times !== undefined && goal.times > 1 ? `${ACTION_TEXT[goal.action]} ${goal.times} рази` : ACTION_TEXT[goal.action]
    case "bookmark":
      return `Сторінка ${page(goal.url)} є в закладках${goal.folder ? ` у папці «${goal.folder}»` : ""}${goal.title ? ` з назвою «${goal.title}»` : ""}`
    case "noBookmark":
      return `Закладки на ${page(goal.url)} немає`
    case "folder":
      return `Є папка закладок «${goal.name}»`
    case "historyHas":
      return `В історії є ${page(goal.url)}`
    case "historyHasNot":
      return `В історії немає ${page(goal.url)}`
    case "historyCount":
      return goal.equals === 0 ? "Історію очищено" : `В історії записів: ${goal.equals}`
    case "submitted":
      return "Форму надіслано"
    case "notSubmitted":
      return "Ти нічого не надіслав незнайомцям"
    case "popupClosed":
      return "Спливне вікно закрито, приз не натиснуто"
    case "downloaded":
      return `Файл «${goal.file}» завантажено`
    case "downloadDeleted":
      return `Файл «${goal.file}» видалено`
    case "notOpened":
      return `Файл «${goal.file}» не відкривали`
    case "answer":
      return "Відповідь правильна"
  }
}

const defaultHint = (goal: Goal): string => {
  switch (goal.type) {
    case "activeTab":
      return goal.how === "typed"
        ? "Клацни в адресний рядок угорі, надрукуй адресу і натисни Enter."
        : goal.how === "history"
          ? "Відкрий історію (кнопка 🕘 або Ctrl+H) і клацни потрібну сторінку."
          : "Наприкінці на екрані має бути саме ця сторінка. Перевір адресу в адресному рядку."
    case "activeSite":
      return "Наприкінці на екрані має бути сторінка цього сайту. Перевір адресу в адресному рядку."
    case "tabOpen":
      return "Відкрий цю сторінку в окремій вкладці: кнопка «+» або права кнопка миші на посиланні → «Відкрити в новій вкладці»."
    case "tabCount":
      return "Порахуй вкладки вгорі вікна. Зайву закрий хрестиком ✕ на вкладці."
    case "siteTabs":
      return "Відкрий другу сторінку того самого сайту в новій вкладці: права кнопка миші на посиланні → «Відкрити в новій вкладці»."
    case "visited":
      return goal.how === "typed" ? "Клацни в адресний рядок, надрукуй адресу і натисни Enter." : "Ти ще не відкривав цю сторінку."
    case "searched":
      return "Відкрий пошук (домашня сторінка 🏠), надрукуй ключові слова в полі пошуку і натисни «Знайти»."
    case "notVisited":
      return "Цей сайт не варто було відкривати. Натисни «Почати спочатку» і спробуй інакше."
    case "foundOnPage":
      return "Натисни Ctrl+F (або меню ⋮ → «Знайти на сторінці»), надрукуй слово і натисни Enter: браузер підсвітить його на сторінці."
    case "zoom":
      return "Масштаб змінюють клавішами Ctrl і + (більше) або Ctrl і − (менше), або кнопками «−» і «+» у меню ⋮. Ctrl+0 повертає 100 %."
    case "used":
      return goal.action === "back"
        ? "Кнопка «Назад» — стрілка ← ліворуч від адресного рядка."
        : goal.action === "callAdult"
          ? "Коли в інтернеті щось лякає або просять секрети, натисни 🙋 «Покликати дорослого»."
          : goal.action === "report"
            ? "Натисни «Поскаржитися» під чатом."
            : "Скористайся кнопками ліворуч від адресного рядка."
    case "bookmark":
      return goal.folder
        ? `Відкрий сторінку, натисни зірочку ☆ в адресному рядку і вибери папку «${goal.folder}».`
        : "Відкрий сторінку і натисни зірочку ☆ праворуч в адресному рядку."
    case "noBookmark":
      return "Видали зайву закладку: права кнопка миші на ній → «Видалити»."
    case "folder":
      return "Натисни зірочку ☆ і вибери «Нова папка», або створи папку в менеджері закладок."
    case "historyHas":
      return "Цю сторінку видалено з історії. Відкрий її ще раз."
    case "historyHasNot":
      return "Відкрий історію (🕘 або Ctrl+H) і видали цей запис кнопкою ✕."
    case "historyCount":
      return goal.equals === 0 ? "В історії натисни «Очистити історію»." : "Порахуй записи в історії."
    case "submitted":
      return "Заповни форму і натисни кнопку під нею."
    case "notSubmitted":
      return "Незнайомцям в інтернеті не можна писати пароль, телефон чи адресу. Натисни «Почати спочатку» і спробуй ще раз."
    case "popupClosed":
      return "Закрий вікно хрестиком ✕ або кнопкою «Ні, дякую». Не натискай яскраву кнопку!"
    case "downloaded":
      return "Натисни кнопку «Завантажити» на сторінці."
    case "downloadDeleted":
      return "Коли антивірус попереджає про загрозу, натисни «Видалити файл»."
    case "answer":
      return "Перевір відповідь: знайди її ще раз на сайті й надрукуй точно так, як там написано."
    case "notOpened":
      return "Файл, про який попереджає антивірус, не можна відкривати. Натисни «Почати спочатку» і спробуй ще раз."
  }
}

const matches = (url: Url, goalUrl: Url): boolean => url === goalUrl

const isMet = (web: Web, state: BrowserState, goal: Goal): boolean => {
  const url = "url" in goal ? canonicalUrl(web.map, goal.url) : ""
  switch (goal.type) {
    case "activeTab": {
      const tab = activeTabOf(state)
      if (!tab) return false
      return matches(currentEntry(tab).url, url) && (goal.how === undefined || tab.via === goal.how)
    }
    case "activeSite": {
      const tab = activeTabOf(state)
      return tab !== undefined && hostOf(currentUrl(tab)) === canonicalUrl(web.map, goal.host)
    }
    case "tabOpen":
      return state.tabs.some((t) => currentUrl(t) === url)
    case "tabCount":
      return state.tabs.length === goal.equals
    case "siteTabs": {
      const host = canonicalUrl(web.map, goal.host)
      const pages = new Set(state.tabs.map(currentUrl).filter((u) => hostOf(u) === host))
      return pages.size >= goal.pages
    }
    case "visited":
      return state.visits.some((v) => v.url === url && (goal.how === undefined || v.how === goal.how))
    case "searched":
      return state.visits.some((v) => {
        const { host, path, query } = parseUrl(v.url)
        const q = query.toLocaleLowerCase("uk")
        return host === SEARCH_HOST && path === SEARCH_PATH && goal.words.every((w) => q.includes(w.toLocaleLowerCase("uk")))
      })
    case "notVisited": {
      const wholeSite = parseUrl(url).path === "" && !url.includes("?q=")
      const hit = (u: Url) => (wholeSite ? hostOf(u) === url : u === url)
      return !state.visits.some((v) => hit(v.url)) && !state.tabs.some((t) => hit(currentUrl(t)))
    }
    case "used":
      return (state.used[goal.action] ?? 0) >= (goal.times ?? 1)
    case "foundOnPage":
      return state.finds.some((f) => {
        const text = f.text.toLocaleLowerCase("uk")
        return (goal.url === undefined || f.url === url) && goal.words.every((w) => text.includes(w.toLocaleLowerCase("uk")))
      })
    case "zoom":
      return (goal.min === undefined || state.zoom >= goal.min) && (goal.max === undefined || state.zoom <= goal.max)
    case "bookmark":
      return state.bookmarks.some(
        (b) => b.url === url && (goal.folder === undefined || b.folder === goal.folder) && (goal.title === undefined || sameText(b.title, goal.title))
      )
    case "noBookmark":
      return !state.bookmarks.some((b) => b.url === url)
    case "folder":
      return state.folders.some((f) => sameText(f, goal.name))
    case "historyHas":
      return state.history.some((h) => h.url === url)
    case "historyHasNot":
      return !state.history.some((h) => h.url === url)
    case "historyCount":
      return state.history.length === goal.equals
    case "submitted":
      return state.submitted.includes(goal.form)
    case "notSubmitted":
      return !state.submitted.includes(goal.form)
    case "popupClosed":
      return state.popups.some((p) => p.spec.id === goal.id && p.status === "closed")
    case "downloaded":
      return state.downloads.some((d) => d.file === goal.file)
    case "downloadDeleted":
      return state.downloads.some((d) => d.file === goal.file && d.status === "deleted")
    case "notOpened":
      return !state.downloads.some((d) => d.file === goal.file && d.status === "opened")
    case "answer": {
      const given = state.answers[goal.question]
      return given !== undefined && goal.accept.some((a) => sameAnswer(a, given))
    }
  }
}

export const checkGoals = (web: Web, state: BrowserState, goals: ReadonlyArray<Goal>): ReadonlyArray<GoalResult> =>
  goals.map((goal) => ({ goal, ok: isMet(web, state, goal), text: describeGoal(web, goal), hint: goal.hint ?? defaultHint(goal) }))

export const allMet = (results: ReadonlyArray<GoalResult>): boolean => results.every((r) => r.ok)
