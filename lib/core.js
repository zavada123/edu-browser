import { A as absoluteUrl, B as tileSites, C as buildState, D as popupMatches, E as makeWeb, F as resolve, G as normalizeUrl, H as NEW_TAB, I as search, K as parseUrl, L as searchUrl, M as canonicalUrl, N as iconOf, O as SEARCH_HOST, P as linksOn, R as siteMap, S as activeTabOf, T as currentUrl, U as hostOf, V as titleOf, W as looksLikeAddress, _ as allMet, a as MAX_DOWNLOADS, b as normalizeAnswer, c as MAX_HISTORY, d as MAX_TABS, f as MAX_URL, g as replay, h as nextZoom, i as MAX_BOOKMARKS, j as blocksOn, k as SEARCH_PATH, l as MAX_NAME, m as applyOp, n as defaultWeb, o as MAX_FINDS, p as ZOOM_LEVELS, q as sameUrl, r as MAX_ANSWER, s as MAX_FOLDERS, t as allSites, u as MAX_OPS, v as checkGoals, w as currentEntry, x as DEFAULT_HOME, y as describeGoal, z as splitLinks } from "./sites-TCvlXqZz.js";
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
		id: "g3-chat-password",
		grade: 3,
		lesson: "inf3-10",
		title: "Котик просить пароль",
		large: true,
		task: [
			"Ти граєш у перегони, і в чаті тобі пише незнайомий «Котик».",
			"Прочитай, що він просить.",
			"Подумай, що правильно зробити, і зроби це.",
			"Підказка: кнопка 🙋 угорі кличе дорослого."
		],
		start: { tabs: ["ігри-онлайн.edu/чат"] },
		goals: [{
			type: "notSubmitted",
			form: "chat",
			text: "Ти нічого не написав Котику",
			hint: "Пароль і адресу не можна казати незнайомцям, навіть за монети. Натисни «Почати спочатку»."
		}, {
			type: "used",
			action: "callAdult",
			text: "Ти покликав дорослого",
			hint: "Коли просять секрети, розкажи дорослому: натисни 🙋 «Покликати дорослого»."
		}]
	},
	{
		id: "g3-prize-popup",
		grade: 3,
		lesson: "inf3-10",
		title: "Твій приз — телефон!",
		large: true,
		task: [
			"Ти читаєш казку, і раптом вискочило вікно.",
			"Подумай: чи можна виграти телефон просто так?",
			"Закрий вікно правильно і дочитай казку."
		],
		start: {
			tabs: ["казки.edu/колобок"],
			popups: [{
				id: "prize",
				icon: "🎁",
				title: "ВІТАЄМО! ТИ ПЕРЕМОЖЕЦЬ!",
				text: "Ти мільйонний відвідувач! Тобі дістається новий телефон. Натисни швидше, поки приз не забрали інші!",
				accept: "Забрати приз",
				acceptUrl: "приз-телефон.win",
				decline: "Ні, дякую"
			}]
		},
		goals: [
			{
				type: "popupClosed",
				id: "prize",
				text: "Вікно закрито без «Забрати приз»"
			},
			{
				type: "notVisited",
				url: "приз-телефон.win",
				text: "Сайт-приманку не відкрито",
				hint: "Яскраві вікна з призами — пастка. Не натискай «Забрати приз»: закрий вікно хрестиком або «Ні, дякую»."
			},
			{
				type: "notSubmitted",
				form: "prize",
				text: "Ти не вводив жодних даних"
			},
			{
				type: "activeTab",
				url: "казки.edu/колобок",
				text: "На екрані знову казка «Колобок»"
			}
		]
	},
	{
		id: "g3-safe-result",
		grade: 3,
		lesson: "inf3-10",
		title: "Безпечний чи підозрілий?",
		large: true,
		task: [
			"Ти шукав казки, і пошуковик знайшов кілька сайтів.",
			"Подивись на адреси: безпечні сайти класу закінчуються на .edu.",
			"Відкрий безпечний сайт казок і не відкривай рекламу та дивні адреси."
		],
		start: { tabs: ["пошук.edu/пошук?q=казки"] },
		goals: [
			{
				type: "activeSite",
				host: "казки.edu",
				text: "Відкрито безпечний сайт казки.edu",
				hint: "Шукай у результатах адресу казки.edu."
			},
			{
				type: "notVisited",
				url: "приз-телефон.win",
				text: "Рекламу з призом не відкрито",
				hint: "Перший результат із позначкою «Реклама» — сайт-приманка. Натисни «Почати спочатку»."
			},
			{
				type: "notVisited",
				url: "казки-безкоштовно.xyz",
				text: "Підозрілий сайт .xyz не відкрито",
				hint: "Адреса .xyz і напис «Не захищено» — ознаки підозрілого сайту. Натисни «Почати спочатку»."
			}
		]
	},
	{
		id: "g3-virus-file",
		grade: 3,
		lesson: "inf3-10",
		title: "Файл гри з вірусом",
		large: true,
		task: [
			"Ти хочеш пограти в «Супер-гонки». Натисни «Завантажити гру».",
			"Прочитай, що скаже антивірус, і вибери правильну дію.",
			"Розкажи про це дорослому: натисни 🙋."
		],
		start: { tabs: ["безкоштовні-ігри.xyz"] },
		goals: [
			{
				type: "downloaded",
				file: "супер-гонки.exe",
				text: "Гру завантажено"
			},
			{
				type: "downloadDeleted",
				file: "супер-гонки.exe",
				text: "Файл із вірусом видалено"
			},
			{
				type: "notOpened",
				file: "супер-гонки.exe",
				text: "Файл із вірусом не відкривали"
			},
			{
				type: "used",
				action: "callAdult",
				text: "Ти розповів дорослому"
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
		id: "g4-spelling",
		grade: 4,
		lesson: "inf3-11",
		title: "Як пишеться?",
		large: true,
		task: [
			"Ти не знаєш, як правильно: «ведмежатко» чи «ведмедятко»?",
			"Відкрий шкільний словник: словник.edu.",
			"Знайди слово і надрукуй його правильно в полі нижче."
		],
		start: {
			tabs: ["пошук.edu"],
			questions: [{
				id: "word",
				text: "Як правильно пишеться слово?",
				placeholder: "Надрукуй слово"
			}]
		},
		goals: [{
			type: "visited",
			url: "словник.edu/ведмежатко",
			text: "Ти знайшов слово у словнику",
			hint: "На словник.edu клацни на слово «ведмежатко»."
		}, {
			type: "answer",
			question: "word",
			accept: ["ведмежатко"],
			text: "Слово надруковано правильно",
			hint: "Подивись у словнику, яка літера перед «-атко»: ж чи д."
		}]
	},
	{
		id: "g4-two-sources",
		grade: 4,
		lesson: "inf3-11",
		title: "Перевір у двох джерелах",
		large: true,
		task: [
			"Дізнайся, скільки яєць зносить лелека.",
			"Прочитай статтю про лелеку в «Дитячій енциклопедії» (енциклопедія.edu).",
			"Прочитай статтю про лелеку у «Вікі для дітей» (вікі-діти.edu).",
			"Запиши, що каже кожне джерело. Чи однаково?"
		],
		start: {
			tabs: ["пошук.edu"],
			questions: [{
				id: "encyclopedia",
				text: "Скільки яєць за «Дитячою енциклопедією»?",
				placeholder: "Наприклад: від 1 до 2"
			}, {
				id: "wiki",
				text: "Скільки яєць за «Вікі для дітей»?",
				placeholder: "Число"
			}]
		},
		goals: [
			{
				type: "visited",
				url: "енциклопедія.edu/лелека",
				text: "Прочитано статтю в «Дитячій енциклопедії»"
			},
			{
				type: "visited",
				url: "вікі-діти.edu/лелека",
				text: "Прочитано статтю у «Вікі для дітей»"
			},
			{
				type: "answer",
				question: "encyclopedia",
				accept: [
					"від 3 до 5",
					"3-5",
					"3 до 5",
					"від трьох до п'яти",
					"від 3 до 5 яєць",
					"3-5 яєць"
				],
				text: "Записано число з «Дитячої енциклопедії»",
				hint: "У «Дитячій енциклопедії» написано «від … до … яєць». Запиши так: від 3 до 5."
			},
			{
				type: "answer",
				question: "wiki",
				accept: [
					"4",
					"чотири",
					"4 яйця",
					"зазвичай 4"
				],
				text: "Записано число з «Вікі для дітей»"
			}
		]
	},
	{
		id: "g4-photo-author",
		grade: 4,
		lesson: "inf3-11",
		title: "Чиє фото?",
		large: true,
		task: [
			"Для реферату потрібне фото бджоли. Відкрий сайт фото-природа.edu.",
			"Знайди фото бджоли і завантаж його кнопкою «Завантажити».",
			"Під фото є підпис. Запиши, хто автор, як називається фото і з якого воно сайту."
		],
		start: {
			tabs: ["пошук.edu"],
			questions: [
				{
					id: "author",
					text: "Хто автор фото?",
					placeholder: "Ім'я та прізвище"
				},
				{
					id: "title",
					text: "Як називається фото?",
					placeholder: "Назва"
				},
				{
					id: "site",
					text: "З якого сайту фото?",
					placeholder: "Адреса сайту"
				}
			]
		},
		goals: [
			{
				type: "downloaded",
				file: "бджола.jpg",
				text: "Фото бджоли завантажено",
				hint: "Під фото бджоли натисни «Завантажити»."
			},
			{
				type: "answer",
				question: "author",
				accept: ["Леся Медова", "Медова Леся"],
				text: "Автора записано правильно",
				hint: "Автор написаний під фото: «Фото: …»."
			},
			{
				type: "answer",
				question: "title",
				accept: ["Бджола на соняшнику"],
				text: "Назву фото записано правильно"
			},
			{
				type: "answer",
				question: "site",
				accept: [
					"фото-природа.edu",
					"https://фото-природа.edu",
					"foto-pryroda.edu"
				],
				text: "Сайт записано правильно",
				hint: "Адресу сайту видно в адресному рядку вгорі."
			}
		]
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
	},
	{
		id: "g5-lock",
		grade: 5,
		title: "Замок у рядку",
		task: [
			"Тобі прийшов лист: «Терміново увійди в щоденник, бо його заблокують!». Посилання з листа відкрилося в першій вкладці.",
			"Порівняй адреси й замок 🔒 в адресному рядку на обох вкладках.",
			"Увійди в щоденник лише на справжньому сайті школи: школа.edu → «Щоденник».",
			"Логін і пароль вигадані: надрукуй будь-які."
		],
		start: { tabs: ["щоденник-школа.xyz", "школа.edu"] },
		goals: [{
			type: "submitted",
			form: "school-login",
			text: "Ти увійшов у щоденник на справжньому сайті школи",
			hint: "Перейди на вкладку школа.edu, відкрий «Щоденник» у меню сайту й увійди там."
		}, {
			type: "notSubmitted",
			form: "fake-login",
			text: "На сайті-підробці ти не вводив пароль",
			hint: "Адреса щоденник-школа.xyz і напис «Не захищено» — ознаки підробки, хоч сторінка схожа на шкільну. Натисни «Почати спочатку»."
		}]
	},
	{
		id: "g5-find",
		grade: 5,
		title: "Знайди на сторінці",
		task: [
			"Відкрито довгу статтю про планети.",
			"Натисни Ctrl+F (або меню ⋮ → «Знайти на сторінці»), надрукуй «Марс» і натисни Enter.",
			"Прочитай підсвічений текст і дай відповідь на питання."
		],
		start: {
			tabs: ["космос.edu/планети"],
			questions: [{
				id: "moons",
				text: "Скільки супутників у Марса?",
				placeholder: "Число"
			}]
		},
		goals: [{
			type: "foundOnPage",
			words: ["марс"],
			url: "космос.edu/планети"
		}, {
			type: "answer",
			question: "moons",
			accept: [
				"2",
				"два",
				"2 супутники",
				"два супутники"
			],
			text: "Відповідь про супутники Марса правильна"
		}]
	},
	{
		id: "g5-zoom",
		grade: 5,
		title: "Дрібний шрифт",
		task: [
			"В оголошенні про екскурсію найважливіше написано дрібно.",
			"Збільш масштаб сторінки до 150 %: Ctrl і + (або меню ⋮ → «+»).",
			"Прочитай, о котрій годині збір, і запиши відповідь."
		],
		start: {
			tabs: ["школа.edu/оголошення"],
			questions: [{
				id: "time",
				text: "О котрій годині збір біля воріт школи?",
				placeholder: "Наприклад, 9:15"
			}]
		},
		goals: [{
			type: "zoom",
			min: 150
		}, {
			type: "answer",
			question: "time",
			accept: [
				"8:30",
				"8.30",
				"08:30",
				"о 8:30",
				"8 30"
			],
			text: "Час збору правильний"
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
		case "clearHistory":
		case "callAdult": return { op: step.do };
		case "closePopup": return {
			op: "closePopup",
			id: step.id
		};
		case "download": return {
			op: "download",
			file: step.file
		};
		case "answer": return {
			op: "answer",
			question: step.question,
			text: step.text
		};
		case "submit": return {
			op: "submitForm",
			form: step.form
		};
		case "find": return {
			op: "find",
			text: step.text
		};
		case "zoom": return {
			op: "zoom",
			level: step.level
		};
		case "deleteDownload": {
			const item = state.downloads.find((d) => d.file === step.file);
			if (!item) throw new Error(`Помилка в розв'язку: не завантажено ${step.file}`);
			return {
				op: "deleteDownload",
				id: item.id
			};
		}
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
	"g3-chat-password": [{ do: "callAdult" }],
	"g3-prize-popup": [{
		do: "closePopup",
		id: "prize"
	}],
	"g3-safe-result": [{
		do: "go",
		url: "казки.edu",
		how: "link"
	}],
	"g3-virus-file": [
		{
			do: "download",
			file: "супер-гонки.exe"
		},
		{
			do: "deleteDownload",
			file: "супер-гонки.exe"
		},
		{ do: "callAdult" }
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
	"g4-spelling": [
		{
			do: "go",
			url: "словник.edu",
			how: "typed"
		},
		{
			do: "go",
			url: "словник.edu/ведмежатко",
			how: "link"
		},
		{
			do: "answer",
			question: "word",
			text: "ведмежатко"
		}
	],
	"g4-two-sources": [
		{
			do: "go",
			url: "енциклопедія.edu/лелека",
			how: "typed"
		},
		{
			do: "answer",
			question: "encyclopedia",
			text: "від 3 до 5"
		},
		{
			do: "go",
			url: "вікі-діти.edu/лелека",
			how: "typed"
		},
		{
			do: "answer",
			question: "wiki",
			text: "4"
		}
	],
	"g4-photo-author": [
		{
			do: "go",
			url: "фото-природа.edu",
			how: "typed"
		},
		{
			do: "go",
			url: "фото-природа.edu/бджола",
			how: "link"
		},
		{
			do: "download",
			file: "бджола.jpg"
		},
		{
			do: "answer",
			question: "author",
			text: "Леся Медова"
		},
		{
			do: "answer",
			question: "title",
			text: "«Бджола на соняшнику»"
		},
		{
			do: "answer",
			question: "site",
			text: "фото-природа.edu"
		}
	],
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
	}, { do: "clearHistory" }],
	"g5-lock": [
		{
			do: "switch",
			url: "школа.edu"
		},
		{
			do: "go",
			url: "школа.edu/щоденник",
			how: "link"
		},
		{
			do: "submit",
			form: "school-login"
		}
	],
	"g5-find": [{
		do: "find",
		text: "Марс"
	}, {
		do: "answer",
		question: "moons",
		text: "2"
	}],
	"g5-zoom": [
		{
			do: "zoom",
			level: 110
		},
		{
			do: "zoom",
			level: 125
		},
		{
			do: "zoom",
			level: 150
		},
		{
			do: "answer",
			question: "time",
			text: "8:30"
		}
	]
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
export { DEFAULT_HOME, MAX_ANSWER, MAX_BOOKMARKS, MAX_DOWNLOADS, MAX_FINDS, MAX_FOLDERS, MAX_HISTORY, MAX_NAME, MAX_OPS, MAX_TABS, MAX_URL, NEW_TAB, SEARCH_HOST, SEARCH_PATH, ZOOM_LEVELS, absoluteUrl, activeTabOf, allMet, allSites, applyOp, blocksOn, buildState, canonicalUrl, checkGoals, currentEntry, currentUrl, defaultWeb, describeGoal, grade, gradeIn, hostOf, iconOf, linksOn, looksLikeAddress, makeWeb, nextZoom, normalizeAnswer, normalizeUrl, parseUrl, popupMatches, referenceOps, replay, resolve, sameUrl, scenarios, search, searchUrl, siteMap, splitLinks, tileSites, titleOf };
