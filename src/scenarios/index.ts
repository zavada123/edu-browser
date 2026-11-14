import type { Scenario } from "./types.ts"

export type { Scenario } from "./types.ts"

// 3 клас, inf3-09 «Що таке інтернет»: сторінка, сайт, гіперпосилання, частини вікна браузера.

const links: Scenario = {
  id: "g3-links",
  grade: 3,
  lesson: "inf3-09",
  title: "Мандрівка посиланнями",
  large: true,
  task: [
    "Ти на сайті «Космос для дітей».",
    "Знайди сторінку про Місяць.",
    "Переходь лише за посиланнями: клацай на сині підкреслені слова."
  ],
  start: { tabs: ["космос.edu"] },
  goals: [
    {
      type: "activeTab",
      url: "космос.edu/місяць",
      how: "link",
      text: "Відкрито сторінку «Місяць» за посиланням",
      hint: "Посилання — це сині підкреслені слова. Клацни на «Місяць»."
    }
  ]
}

const backForward: Scenario = {
  id: "g3-back-forward",
  grade: 3,
  lesson: "inf3-09",
  title: "Назад і вперед",
  large: true,
  task: ["Ти читаєш про Місяць.", "Перейди за посиланням на сторінку про Сонце.", "Повернись на сторінку «Місяць» кнопкою «Назад» ←."],
  start: { tabs: ["космос.edu/місяць"] },
  goals: [
    { type: "visited", url: "космос.edu/сонце", text: "Ти побував на сторінці «Сонце»", hint: "На сторінці «Місяць» є посилання «Сонце». Клацни на нього." },
    {
      type: "activeTab",
      url: "космос.edu/місяць",
      how: "back",
      text: "Ти повернувся на «Місяць» кнопкою «Назад»",
      hint: "Кнопка «Назад» — стрілка ← ліворуч від адресного рядка."
    }
  ]
}

const typeAddress: Scenario = {
  id: "g3-type-address",
  grade: 3,
  lesson: "inf3-09",
  title: "Адреса казок",
  large: true,
  task: ["Клацни в адресний рядок угорі.", "Надрукуй адресу казки.edu і натисни Enter.", "На сайті відкрий казку «Рукавичка»."],
  start: {},
  goals: [
    {
      type: "visited",
      url: "казки.edu",
      how: "typed",
      text: "Адресу казки.edu надруковано в адресному рядку",
      hint: "Клацни в адресний рядок, надрукуй казки.edu (або kazky.edu) і натисни Enter."
    },
    { type: "activeTab", url: "казки.edu/рукавичка", text: "Відкрито казку «Рукавичка»" }
  ]
}

const sitePages: Scenario = {
  id: "g3-site-pages",
  grade: 3,
  lesson: "inf3-09",
  title: "Сайт чи сторінка?",
  large: true,
  task: [
    "Відкрий казку «Колобок» у новій вкладці: права кнопка миші на посиланні → «Відкрити в новій вкладці».",
    "Повернись на першу вкладку і так само відкрий у новій вкладці «Рукавичку».",
    "Подивись: сторінки різні, а шапка однакова. Це один сайт."
  ],
  start: { tabs: ["казки.edu"] },
  goals: [
    { type: "tabOpen", url: "казки.edu/колобок", text: "Є вкладка з казкою «Колобок»" },
    { type: "tabOpen", url: "казки.edu/рукавичка", text: "Є вкладка з казкою «Рукавичка»" },
    { type: "tabOpen", url: "казки.edu", text: "Перша вкладка з усіма казками лишилася відкритою", hint: "Не закривай першу вкладку зі списком казок." }
  ]
}

// 4 клас, inf3-11 «Що важливо знати про інтернет»: закладки й історія (практика з учителем).

const firstBookmark: Scenario = {
  id: "g4-first-bookmark",
  grade: 4,
  lesson: "inf3-11",
  title: "Перша закладка",
  large: true,
  task: ["Відкрий казку «Колобок».", "Додай її в закладки: натисни зірочку ☆ в адресному рядку і «Готово».", "Закладка з'явиться на панелі під адресним рядком."],
  start: { tabs: ["казки.edu"] },
  goals: [{ type: "bookmark", url: "казки.edu/колобок", text: "Казка «Колобок» є в закладках" }]
}

const bookmarkFolder: Scenario = {
  id: "g4-bookmark-folder",
  grade: 4,
  lesson: "inf3-11",
  title: "Папка закладок",
  large: true,
  task: [
    "Відкрий словник: надрукуй адресу словник.edu.",
    "Натисни зірочку ☆, вибери «Нова папка» і назви її «Навчання». Збережи закладку в цю папку.",
    "Відкрий енциклопедію енциклопедія.edu і теж збережи в папку «Навчання»."
  ],
  start: { tabs: ["пошук.edu"], bookmarks: [{ url: "казки.edu", title: "Казки" }] },
  goals: [
    { type: "folder", name: "Навчання" },
    { type: "bookmark", url: "словник.edu", folder: "Навчання", text: "Словник лежить у папці «Навчання»" },
    { type: "bookmark", url: "енциклопедія.edu", folder: "Навчання", text: "Енциклопедія лежить у папці «Навчання»" },
    { type: "bookmark", url: "казки.edu", text: "Закладка «Казки» лишилася", hint: "Стару закладку «Казки» не треба видаляти." }
  ]
}

const findInHistory: Scenario = {
  id: "g4-history",
  grade: 4,
  lesson: "inf3-11",
  title: "Знайди в історії",
  large: true,
  task: ["Учора ти читав про лелек, але забув адресу.", "Відкрий історію: кнопка 🕘 або Ctrl+H.", "Знайди сторінку про лелеку і відкрий її."],
  start: {
    tabs: ["пошук.edu"],
    history: [{ url: "космос.edu/сонце" }, { url: "енциклопедія.edu/лелека" }, { url: "казки.edu/колобок" }, { url: "школа.edu/новини" }]
  },
  goals: [{ type: "activeTab", url: "енциклопедія.edu/лелека", how: "history", text: "Сторінку про лелеку відкрито з історії" }]
}

// 5–6 клас: пошук за ключовими словами, порядок у вкладках, історія.

const searchSchool: Scenario = {
  id: "g5-search-clubs",
  grade: 5,
  title: "Пошук за ключовими словами",
  task: [
    "У полі пошуку надрукуй ключові слова «розклад гуртків» і натисни «Знайти».",
    "Серед результатів відкрий сторінку шкільного сайту з гуртками.",
    "Додай її в закладки на панель закладок."
  ],
  start: { tabs: ["пошук.edu"] },
  goals: [
    { type: "searched", words: ["гурт"], text: "Ти шукав за ключовими словами про гуртки", hint: "Надрукуй у полі пошуку: розклад гуртків." },
    { type: "visited", url: "школа.edu/гуртки", how: "link", text: "Сторінку гуртків відкрито з результатів пошуку" },
    { type: "bookmark", url: "школа.edu/гуртки", folder: "", text: "Сторінка гуртків є на панелі закладок" }
  ]
}

const tabsOrder: Scenario = {
  id: "g5-tabs-order",
  grade: 5,
  title: "Вкладки до ладу",
  task: [
    "На сайті школи відкрий у нових вкладках «Розклад» і «Гуртки».",
    "Відкрий ще одну нову вкладку (+ або Ctrl+T) і перейди на словник.edu.",
    "Закрий вкладку зі словником: вона зайва.",
    "Має лишитися три вкладки: головна школи, розклад і гуртки."
  ],
  start: { tabs: ["школа.edu"] },
  goals: [
    { type: "tabOpen", url: "школа.edu/розклад" },
    { type: "tabOpen", url: "школа.edu/гуртки" },
    { type: "visited", url: "словник.edu", text: "Ти відкривав словник" },
    { type: "tabCount", equals: 3, text: "Відкрито рівно три вкладки" }
  ]
}

const cleanHistory: Scenario = {
  id: "g5-clean-history",
  grade: 5,
  title: "Прибери за собою",
  task: ["Відкрий історію (🕘 або Ctrl+H).", "Видали один запис: сторінку про ракети (кнопка ✕ біля запису).", "Потім очисти всю історію."],
  start: {
    tabs: ["пошук.edu"],
    history: [{ url: "казки.edu/колобок" }, { url: "космос.edu/ракети" }, { url: "школа.edu/новини" }, { url: "словник.edu/інтернет", day: -2 }]
  },
  goals: [
    { type: "used", action: "deleteHistory", text: "Окремий запис видалено", hint: "Спершу видали один запис кнопкою ✕ біля нього, а вже потім очищай усю історію." },
    { type: "historyCount", equals: 0 }
  ]
}

/** In the order of the lessons. */
export const scenarios: ReadonlyArray<Scenario> = [
  links,
  backForward,
  typeAddress,
  sitePages,
  firstBookmark,
  bookmarkFolder,
  findInHistory,
  searchSchool,
  tabsOrder,
  cleanHistory
]
