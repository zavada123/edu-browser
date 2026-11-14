import { A as siteMap, C as absoluteUrl, D as resolve, E as linksOn, F as looksLikeAddress, I as normalizeUrl, L as parseUrl, M as titleOf, N as NEW_TAB, O as search, P as hostOf, R as sameUrl, S as SEARCH_PATH, T as iconOf, _ as buildState, a as MAX_HISTORY, b as makeWeb, c as MAX_TABS, d as replay, f as allMet, g as activeTabOf, h as DEFAULT_HOME, i as MAX_FOLDERS, j as splitLinks, k as searchUrl, l as MAX_URL, m as describeGoal, n as defaultWeb, o as MAX_NAME, p as checkGoals, r as MAX_BOOKMARKS, s as MAX_OPS, t as allSites, u as applyOp, v as currentEntry, w as canonicalUrl, x as SEARCH_HOST, y as currentUrl } from "./sites-DhWACsow.js";
// src/core/grade.ts
/** Builds the start state, replays the student's log and checks every goal. Never throws. */
var gradeIn = (web, task, ops) => {
	const replayed = replay(web, buildState(web, task.start), ops);
	if (!replayed.ok) return replayed;
	const results = checkGoals(web, replayed.state, task.goals);
	return {
		ok: true,
		solved: allMet(results),
		results,
		state: replayed.state
	};
};
/** In the order of the lessons. */
var scenarios = [
	{
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
		goals: [{
			type: "activeTab",
			url: "космос.edu/місяць",
			how: "link",
			text: "Відкрито сторінку «Місяць» за посиланням",
			hint: "Посилання — це сині підкреслені слова. Клацни на «Місяць»."
		}]
	},
	{
		id: "g3-back-forward",
		grade: 3,
		lesson: "inf3-09",
		title: "Назад і вперед",
		large: true,
		task: [
			"Ти читаєш про Місяць.",
			"Перейди за посиланням на сторінку про Сонце.",
			"Повернись на сторінку «Місяць» кнопкою «Назад» ←."
		],
		start: { tabs: ["космос.edu/місяць"] },
		goals: [{
			type: "visited",
			url: "космос.edu/сонце",
			text: "Ти побував на сторінці «Сонце»",
			hint: "На сторінці «Місяць» є посилання «Сонце». Клацни на нього."
		}, {
			type: "activeTab",
			url: "космос.edu/місяць",
			how: "back",
			text: "Ти повернувся на «Місяць» кнопкою «Назад»",
			hint: "Кнопка «Назад» — стрілка ← ліворуч від адресного рядка."
		}]
	},
	{
		id: "g3-type-address",
		grade: 3,
		lesson: "inf3-09",
		title: "Адреса казок",
		large: true,
		task: [
			"Клацни в адресний рядок угорі.",
			"Надрукуй адресу казки.edu і натисни Enter.",
			"На сайті відкрий казку «Рукавичка»."
		],
		start: {},
		goals: [{
			type: "visited",
			url: "казки.edu",
			how: "typed",
			text: "Адресу казки.edu надруковано в адресному рядку",
			hint: "Клацни в адресний рядок, надрукуй казки.edu (або kazky.edu) і натисни Enter."
		}, {
			type: "activeTab",
			url: "казки.edu/рукавичка",
			text: "Відкрито казку «Рукавичка»"
		}]
	},
	{
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
			{
				type: "tabOpen",
				url: "казки.edu/колобок",
				text: "Є вкладка з казкою «Колобок»"
			},
			{
				type: "tabOpen",
				url: "казки.edu/рукавичка",
				text: "Є вкладка з казкою «Рукавичка»"
			},
			{
				type: "tabOpen",
				url: "казки.edu",
				text: "Перша вкладка з усіма казками лишилася відкритою",
				hint: "Не закривай першу вкладку зі списком казок."
			}
		]
	},
	{
		id: "g4-first-bookmark",
		grade: 4,
		lesson: "inf3-11",
		title: "Перша закладка",
		large: true,
		task: [
			"Відкрий казку «Колобок».",
			"Додай її в закладки: натисни зірочку ☆ в адресному рядку і «Готово».",
			"Закладка з'явиться на панелі під адресним рядком."
		],
		start: { tabs: ["казки.edu"] },
		goals: [{
			type: "bookmark",
			url: "казки.edu/колобок",
			text: "Казка «Колобок» є в закладках"
		}]
	},
	{
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
		start: {
			tabs: ["пошук.edu"],
			bookmarks: [{
				url: "казки.edu",
				title: "Казки"
			}]
		},
		goals: [
			{
				type: "folder",
				name: "Навчання"
			},
			{
				type: "bookmark",
				url: "словник.edu",
				folder: "Навчання",
				text: "Словник лежить у папці «Навчання»"
			},
			{
				type: "bookmark",
				url: "енциклопедія.edu",
				folder: "Навчання",
				text: "Енциклопедія лежить у папці «Навчання»"
			},
			{
				type: "bookmark",
				url: "казки.edu",
				text: "Закладка «Казки» лишилася",
				hint: "Стару закладку «Казки» не треба видаляти."
			}
		]
	},
	{
		id: "g4-history",
		grade: 4,
		lesson: "inf3-11",
		title: "Знайди в історії",
		large: true,
		task: [
			"Учора ти читав про лелек, але забув адресу.",
			"Відкрий історію: кнопка 🕘 або Ctrl+H.",
			"Знайди сторінку про лелеку і відкрий її."
		],
		start: {
			tabs: ["пошук.edu"],
			history: [
				{ url: "космос.edu/сонце" },
				{ url: "енциклопедія.edu/лелека" },
				{ url: "казки.edu/колобок" },
				{ url: "школа.edu/новини" }
			]
		},
		goals: [{
			type: "activeTab",
			url: "енциклопедія.edu/лелека",
			how: "history",
			text: "Сторінку про лелеку відкрито з історії"
		}]
	},
	{
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
			{
				type: "searched",
				words: ["гурт"],
				text: "Ти шукав за ключовими словами про гуртки",
				hint: "Надрукуй у полі пошуку: розклад гуртків."
			},
			{
				type: "visited",
				url: "школа.edu/гуртки",
				how: "link",
				text: "Сторінку гуртків відкрито з результатів пошуку"
			},
			{
				type: "bookmark",
				url: "школа.edu/гуртки",
				folder: "",
				text: "Сторінка гуртків є на панелі закладок"
			}
		]
	},
	{
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
			{
				type: "tabOpen",
				url: "школа.edu/розклад"
			},
			{
				type: "tabOpen",
				url: "школа.edu/гуртки"
			},
			{
				type: "visited",
				url: "словник.edu",
				text: "Ти відкривав словник"
			},
			{
				type: "tabCount",
				equals: 3,
				text: "Відкрито рівно три вкладки"
			}
		]
	},
	{
		id: "g5-clean-history",
		grade: 5,
		title: "Прибери за собою",
		task: [
			"Відкрий історію (🕘 або Ctrl+H).",
			"Видали один запис: сторінку про ракети (кнопка ✕ біля запису).",
			"Потім очисти всю історію."
		],
		start: {
			tabs: ["пошук.edu"],
			history: [
				{ url: "казки.edu/колобок" },
				{ url: "космос.edu/ракети" },
				{ url: "школа.edu/новини" },
				{
					url: "словник.edu/інтернет",
					day: -2
				}
			]
		},
		goals: [{
			type: "used",
			action: "deleteHistory",
			text: "Окремий запис видалено",
			hint: "Спершу видали один запис кнопкою ✕ біля нього, а вже потім очищай усю історію."
		}, {
			type: "historyCount",
			equals: 0
		}]
	}
];
// src/scenarios/solutions.ts
var tabWith = (web, state, url) => {
	const want = canonicalUrl(web.map, url);
	const tab = state.tabs.find((t) => currentUrl(t) === want);
	if (!tab) throw new Error(`Помилка в розв'язку: немає вкладки ${url}`);
	return tab.id;
};
var toOp = (web, state, step) => {
	switch (step.do) {
		case "go": return {
			op: "navigate",
			url: step.url,
			how: step.how
		};
		case "back":
		case "forward": return { op: step.do };
		case "newTab": return { op: "newTab" };
		case "openInTab": return {
			op: "newTab",
			url: step.url,
			how: "link"
		};
		case "close": return {
			op: "closeTab",
			tab: tabWith(web, state, step.url)
		};
		case "switch": return {
			op: "switchTab",
			tab: tabWith(web, state, step.url)
		};
		case "bookmark": return {
			op: "addBookmark",
			title: step.title ?? "",
			folder: step.folder ?? ""
		};
		case "folder": return {
			op: "addFolder",
			name: step.name
		};
		case "forget": {
			const want = canonicalUrl(web.map, step.url);
			const entry = state.history.find((h) => h.url === want);
			if (!entry) throw new Error(`Помилка в розв'язку: в історії немає ${step.url}`);
			return {
				op: "deleteHistory",
				id: entry.id
			};
		}
		case "clearHistory": return { op: "clearHistory" };
	}
};
var SOLUTIONS = {
	"g3-links": [{
		do: "go",
		url: "космос.edu/місяць",
		how: "link"
	}],
	"g3-back-forward": [{
		do: "go",
		url: "космос.edu/сонце",
		how: "link"
	}, { do: "back" }],
	"g3-type-address": [{
		do: "go",
		url: "казки.edu",
		how: "typed"
	}, {
		do: "go",
		url: "казки.edu/рукавичка",
		how: "link"
	}],
	"g3-site-pages": [
		{
			do: "openInTab",
			url: "казки.edu/колобок"
		},
		{
			do: "switch",
			url: "казки.edu"
		},
		{
			do: "openInTab",
			url: "казки.edu/рукавичка"
		}
	],
	"g4-first-bookmark": [{
		do: "go",
		url: "казки.edu/колобок",
		how: "link"
	}, { do: "bookmark" }],
	"g4-bookmark-folder": [
		{
			do: "go",
			url: "словник.edu",
			how: "typed"
		},
		{
			do: "folder",
			name: "Навчання"
		},
		{
			do: "bookmark",
			folder: "Навчання"
		},
		{
			do: "go",
			url: "енциклопедія.edu",
			how: "typed"
		},
		{
			do: "bookmark",
			folder: "Навчання"
		}
	],
	"g4-history": [{
		do: "go",
		url: "енциклопедія.edu/лелека",
		how: "history"
	}],
	"g5-search-clubs": [
		{
			do: "go",
			url: "пошук.edu/пошук?q=розклад гуртків",
			how: "typed"
		},
		{
			do: "go",
			url: "школа.edu/гуртки",
			how: "link"
		},
		{ do: "bookmark" }
	],
	"g5-tabs-order": [
		{
			do: "openInTab",
			url: "школа.edu/розклад"
		},
		{
			do: "switch",
			url: "школа.edu"
		},
		{
			do: "openInTab",
			url: "школа.edu/гуртки"
		},
		{ do: "newTab" },
		{
			do: "go",
			url: "словник.edu",
			how: "typed"
		},
		{
			do: "close",
			url: "словник.edu"
		}
	],
	"g5-clean-history": [{
		do: "forget",
		url: "космос.edu/ракети"
	}, { do: "clearHistory" }]
};
/** The reference log of a scenario. Throws when the scenario has no solution or the solution is broken. */
var referenceOps = (scenario, web = defaultWeb) => {
	const steps = SOLUTIONS[scenario.id];
	if (!steps) throw new Error(`Немає розв'язку для ${scenario.id}`);
	let state = buildState(web, scenario.start);
	const ops = [];
	for (const step of steps) {
		const op = toOp(web, state, step);
		const result = applyOp(web, state, op);
		if (!result.ok) throw new Error(`Помилка в розв'язку ${scenario.id}: ${result.error}`);
		state = result.state;
		ops.push(op);
	}
	return ops;
};
// src/core.ts
/** Entry `edu-browser/core`: browser state, steps, goals, the made-up sites and the scenarios. No React, so a server can use it. */
/** Grades a log against a task on the built-in sites: builds the start, replays the steps and checks the goals. */
var grade = (task, ops) => gradeIn(defaultWeb, task, ops);
export { DEFAULT_HOME, MAX_BOOKMARKS, MAX_FOLDERS, MAX_HISTORY, MAX_NAME, MAX_OPS, MAX_TABS, MAX_URL, NEW_TAB, SEARCH_HOST, SEARCH_PATH, absoluteUrl, activeTabOf, allMet, allSites, applyOp, buildState, canonicalUrl, checkGoals, currentEntry, currentUrl, defaultWeb, describeGoal, grade, gradeIn, hostOf, iconOf, linksOn, looksLikeAddress, makeWeb, normalizeUrl, parseUrl, referenceOps, replay, resolve, sameUrl, scenarios, search, searchUrl, siteMap, splitLinks, titleOf };
