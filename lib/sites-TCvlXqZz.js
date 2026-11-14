// src/core/url.ts
var NEW_TAB = "about:newtab";
var lower = (s) => s.toLocaleLowerCase("uk");
/** Turns what a student typed or a link holds into the canonical address. */
var normalizeUrl = (raw) => {
	const trimmed = raw.trim();
	if (lower(trimmed) === "about:newtab") return NEW_TAB;
	const [beforeQuery = "", ...rest] = trimmed.replace(/^[a-z]+:\/\//i, "").replace(/^www\./i, "").split("?");
	const query = rest.join("?");
	const [host = "", ...pathParts] = beforeQuery.split("/");
	const path = pathParts.map((p) => p.trim()).filter((p) => p.length > 0).join("/");
	const base = path.length > 0 ? `${lower(host)}/${lower(path)}` : lower(host);
	const q = new URLSearchParams(query).get("q");
	return q !== null && q.trim().length > 0 ? `${base}?q=${q.trim()}` : base;
};
var parseUrl = (url) => {
	const [beforeQuery = "", query = ""] = url.split("?q=");
	const slash = beforeQuery.indexOf("/");
	return slash < 0 ? {
		host: beforeQuery,
		path: "",
		query
	} : {
		host: beforeQuery.slice(0, slash),
		path: beforeQuery.slice(slash + 1),
		query
	};
};
var hostOf = (url) => parseUrl(url).host;
/** `космос.edu`, `приз-телефон.win`: something with a dot and no spaces looks like an address. */
var looksLikeAddress = (text) => {
	const t = text.trim();
	if (t.length === 0 || /\s/.test(t)) return false;
	if (/^[a-z]+:\/\//i.test(t) || lower(t) === "about:newtab") return true;
	const host = t.split(/[/?]/)[0] ?? "";
	return /^[\p{L}\p{N}-]+(\.[\p{L}\p{N}-]+)+$/u.test(host);
};
var sameUrl = (a, b) => normalizeUrl(a) === normalizeUrl(b);
// src/core/sites.ts
var SEARCH_HOST = "пошук.edu";
var SEARCH_PATH = "пошук";
/** The sites on the new-tab page: the safe ones the class knows, without the search site itself. */
var tileSites = (sites) => sites.filter((s) => s.host !== "пошук.edu" && s.secure);
var searchUrl = (query) => `${SEARCH_HOST}/${SEARCH_PATH}?q=${query.trim()}`;
var siteMap = (sites) => {
	const map = {};
	for (const site of sites) {
		map[site.host] = site;
		for (const alias of site.aliases ?? []) map[alias] = site;
	}
	return map;
};
/** The address with the site's real host: `kosmos.edu/місяць` → `космос.edu/місяць`. */
var canonicalUrl = (sites, raw) => {
	const url = normalizeUrl(raw);
	if (url === "about:newtab") return url;
	const { host, path, query } = parseUrl(url);
	const site = sites[host];
	if (!site) return url;
	const base = path.length > 0 ? `${site.host}/${path}` : site.host;
	return query.length > 0 ? `${base}?q=${query}` : base;
};
var resolve = (sites, url) => {
	if (url === "about:newtab") return { kind: "newTab" };
	const { host, path, query } = parseUrl(canonicalUrl(sites, url));
	const site = sites[host];
	if (!site) return {
		kind: "noSite",
		host
	};
	const page = site.pages[path];
	if (!page) return {
		kind: "noPage",
		site,
		path
	};
	return {
		kind: "page",
		site,
		page,
		path,
		query
	};
};
/** What the tab and the history show. */
var titleOf = (sites, url) => {
	const r = resolve(sites, url);
	switch (r.kind) {
		case "newTab": return "Нова вкладка";
		case "noSite": return "Сайт не знайдено";
		case "noPage": return "Сторінку не знайдено";
		case "page": return r.query.length > 0 ? `${r.query} — ${r.site.name}` : r.page.title;
	}
};
var iconOf = (sites, url) => {
	const r = resolve(sites, url);
	return r.kind === "page" || r.kind === "noPage" ? r.site.icon : r.kind === "newTab" ? "✨" : "⚠️";
};
/** A link inside a site: `/місяць` → `космос.edu/місяць`. */
var absoluteUrl = (fromUrl, href) => {
	if (!href.startsWith("/")) return href;
	const host = hostOf(fromUrl);
	return href === "/" ? host : `${host}${href}`;
};
/** `Читай про [Місяць](/місяць).` → text and link parts. */
var splitLinks = (text) => {
	const parts = [];
	const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
	let last = 0;
	for (const match of text.matchAll(re)) {
		const at = match.index ?? 0;
		if (at > last) parts.push(text.slice(last, at));
		parts.push({
			text: match[1] ?? "",
			url: match[2] ?? ""
		});
		last = at + match[0].length;
	}
	if (last < text.length) parts.push(text.slice(last));
	return parts;
};
var blockLinks = (block) => {
	switch (block.type) {
		case "text":
		case "note": return splitLinks(block.text).flatMap((p) => typeof p === "string" ? [] : [p.url]);
		case "links": return block.items.map((i) => i.url);
		case "banner": return [block.url];
		default: return [];
	}
};
var words = (s) => s.toLocaleLowerCase("uk").split(/[^\p{L}\p{N}'-]+/u).filter((w) => w.length > 1);
/** Same stem: «ракети» finds «ракета», «Місяця» finds «місяць». */
var stemMatch = (a, b) => {
	const n = Math.min(a.length, b.length, Math.max(3, Math.min(a.length, b.length) - 2));
	return a.slice(0, n) === b.slice(0, n);
};
var pageUrl = (site, path) => path.length > 0 ? `${site.host}/${path}` : site.host;
var snippetOf = (page) => {
	const firstText = page.blocks.find((b) => b.type === "text");
	return firstText?.type === "text" ? splitLinks(firstText.text).map((p) => typeof p === "string" ? p : p.text).join("").slice(0, 140) : "";
};
/** Adverts whose words share a stem with any word of the query. */
var adsFor = (sites, q) => sites.flatMap((site) => Object.entries(site.pages).filter(([, page]) => (page.adKeywords ?? []).flatMap(words).some((k) => q.some((w) => stemMatch(k, w)))).map(([path, page]) => ({
	url: pageUrl(site, path),
	title: page.title,
	site,
	snippet: snippetOf(page),
	ad: true
})));
/**
* Adverts for the query first, then pages whose title or keywords hold every word of the query, best first.
* Hosts sorted for a stable order.
*/
var search = (sites, query) => {
	const q = words(query);
	if (q.length === 0) return [];
	const hits = [];
	for (const site of sites) {
		if (site.host === "пошук.edu") continue;
		for (const [path, page] of Object.entries(site.pages)) {
			const titleWords = words(`${page.title} ${site.name}`);
			const keyWords = (page.keywords ?? []).flatMap(words);
			let score = 0;
			let all = true;
			for (const w of q) {
				const inTitle = titleWords.some((t) => stemMatch(t, w));
				const inKeys = keyWords.some((k) => stemMatch(k, w));
				if (!inTitle && !inKeys) all = false;
				score += inTitle ? 2 : inKeys ? 1 : 0;
			}
			if (!all) continue;
			hits.push({
				url: pageUrl(site, path),
				title: page.title,
				site,
				snippet: snippetOf(page),
				score
			});
		}
	}
	const found = hits.sort((a, b) => b.score - a.score || a.url.localeCompare(b.url, "uk")).map(({ score: _s, ...hit }) => hit);
	const ads = adsFor(sites, q);
	return [...ads, ...found.filter((hit) => !ads.some((ad) => ad.url === hit.url))];
};
/**
* Every address a student can reach by a click on this page: links in its blocks, in the site header,
* and search results. The server checks a «link» step against this list.
*/
var linksOn = (sitesList, sites, url) => {
	const r = resolve(sites, url);
	if (r.kind === "newTab") return tileSites(sitesList).map((s) => s.host);
	if (r.kind === "noSite") return [];
	const own = r.kind === "page" ? r.page.blocks.flatMap(blockLinks) : [];
	const nav = (r.site.nav ?? []).map((i) => i.url);
	const found = r.kind === "page" && r.page.blocks.some((b) => b.type === "search") ? search(sitesList, r.query).map((h) => h.url) : [];
	return [
		...[...own, ...nav].map((href) => canonicalUrl(sites, absoluteUrl(`${r.site.host}`, href))),
		r.site.host,
		...found
	];
};
/** The blocks of the page at `url`, or none for the new-tab page and pages that do not exist. */
var blocksOn = (sites, url) => {
	const r = resolve(sites, url);
	return r.kind === "page" ? r.page.blocks : [];
};
// src/core/state.ts
var makeWeb = (list) => ({
	list,
	map: siteMap(list)
});
var DEFAULT_HOME = "пошук.edu";
var currentEntry = (tab) => tab.stack[tab.index] ?? {
	url: "about:newtab",
	how: "start"
};
var currentUrl = (tab) => currentEntry(tab).url;
var activeTabOf = (state) => state.tabs.find((t) => t.id === state.activeTab);
/** A bare host covers every page of its site. */
var popupMatches = (at, url) => {
	const { path, query } = parseUrl(at);
	return path === "" && query === "" ? hostOf(url) === at : url === at;
};
var buildState = (web, start = {}) => {
	const url = (u) => canonicalUrl(web.map, u);
	const tabUrls = start.tabs !== void 0 && start.tabs.length > 0 ? start.tabs.map(url) : [NEW_TAB];
	const tabs = tabUrls.map((u, i) => ({
		id: i + 1,
		stack: [{
			url: u,
			how: "start"
		}],
		index: 0,
		via: "start"
	}));
	let nextId = 1;
	const bookmarks = (start.bookmarks ?? []).map((b) => ({
		id: nextId++,
		url: url(b.url),
		title: b.title ?? titleOf(web.map, url(b.url)),
		folder: b.folder ?? ""
	}));
	const folders = [.../* @__PURE__ */ new Set([...start.folders ?? [], ...bookmarks.map((b) => b.folder).filter((f) => f !== "")])];
	const startHistory = (start.history ?? []).map((h) => ({
		id: nextId++,
		url: url(h.url),
		title: titleOf(web.map, url(h.url)),
		day: h.day ?? -1
	}));
	const tabHistory = tabUrls.filter((u) => u !== NEW_TAB).map((u) => ({
		id: nextId++,
		url: u,
		title: titleOf(web.map, u),
		day: 0
	}));
	const popups = (start.popups ?? []).map((spec) => {
		const at = spec.at === void 0 ? void 0 : url(spec.at);
		const shown = at === void 0 || tabUrls.some((u) => popupMatches(at, u));
		return {
			spec: at === void 0 ? spec : {
				...spec,
				at
			},
			status: shown ? "open" : "waiting"
		};
	});
	return {
		tabs,
		activeTab: tabs[Math.min(Math.max(start.active ?? 0, 0), tabs.length - 1)]?.id ?? 1,
		nextTabId: tabs.length + 1,
		nextId,
		bookmarks,
		folders,
		history: [...startHistory, ...tabHistory],
		visits: [],
		used: {},
		home: url(start.home ?? "пошук.edu"),
		popups,
		submitted: [],
		downloads: [],
		questions: start.questions ?? [],
		answers: {},
		zoom: 100,
		finds: []
	};
};
// src/core/goals.ts
/** Compares answers the way a teacher would: no case, extra spaces, quotes, stress marks or apostrophe kinds. */
var normalizeAnswer = (s) => s.normalize("NFD").replace(/\u0301/g, "").normalize("NFC").toLocaleLowerCase("uk").replace(/[’ʼ`´]/g, "'").replace(/[«»"„“”.!?]/g, "").replace(/\s*([–—-])\s*/g, "-").replace(/\s+/g, " ").trim();
var sameAnswer = (a, b) => normalizeAnswer(a) === normalizeAnswer(b);
var sameText = (a, b) => a.trim().toLocaleLowerCase("uk") === b.trim().toLocaleLowerCase("uk");
var HOW_TEXT = {
	start: "",
	typed: ", адресу надруковано",
	link: " за посиланням",
	bookmark: " із закладки",
	history: " з історії",
	home: " кнопкою «Домашня сторінка»",
	back: " кнопкою «Назад»",
	forward: " кнопкою «Вперед»",
	popup: " зі спливного вікна"
};
var ACTION_TEXT = {
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
};
/** Default wording of a goal for the task list. */
var describeGoal = (web, goal) => {
	if (goal.text !== void 0) return goal.text;
	const page = (url) => `«${titleOf(web.map, canonicalUrl(web.map, url))}»`;
	switch (goal.type) {
		case "activeTab": return `Відкрито сторінку ${page(goal.url)}${goal.how ? HOW_TEXT[goal.how] : ""}`;
		case "activeSite": return `Відкрито сайт ${goal.host}`;
		case "tabOpen": return `Є вкладка зі сторінкою ${page(goal.url)}`;
		case "tabCount": return `Відкрито вкладок: ${goal.equals}`;
		case "siteTabs": return `${goal.pages} різні сторінки сайту ${goal.host} відкрито в окремих вкладках`;
		case "visited": return `Ти побував на сторінці ${page(goal.url)}${goal.how ? HOW_TEXT[goal.how] : ""}`;
		case "searched": return `Ти шукав у пошуковику: ${goal.words.join(" ")}`;
		case "notVisited": return `Ти не відкривав ${parseUrl(goal.url).path === "" ? `сайт ${goal.url}` : page(goal.url)}`;
		case "foundOnPage": return `Ти шукав на сторінці${goal.url ? ` ${page(goal.url)}` : ""}: ${goal.words.join(" ")}`;
		case "zoom": return goal.min !== void 0 && goal.min > 100 ? `Масштаб сторінки не менше ${goal.min} %` : goal.max !== void 0 && goal.max <= 100 ? `Масштаб сторінки не більше ${goal.max} %` : "Масштаб сторінки змінено правильно";
		case "used": return goal.times !== void 0 && goal.times > 1 ? `${ACTION_TEXT[goal.action]} ${goal.times} рази` : ACTION_TEXT[goal.action];
		case "bookmark": return `Сторінка ${page(goal.url)} є в закладках${goal.folder ? ` у папці «${goal.folder}»` : ""}${goal.title ? ` з назвою «${goal.title}»` : ""}`;
		case "noBookmark": return `Закладки на ${page(goal.url)} немає`;
		case "folder": return `Є папка закладок «${goal.name}»`;
		case "historyHas": return `В історії є ${page(goal.url)}`;
		case "historyHasNot": return `В історії немає ${page(goal.url)}`;
		case "historyCount": return goal.equals === 0 ? "Історію очищено" : `В історії записів: ${goal.equals}`;
		case "submitted": return "Форму надіслано";
		case "notSubmitted": return "Ти нічого не надіслав незнайомцям";
		case "popupClosed": return "Спливне вікно закрито, приз не натиснуто";
		case "downloaded": return `Файл «${goal.file}» завантажено`;
		case "downloadDeleted": return `Файл «${goal.file}» видалено`;
		case "notOpened": return `Файл «${goal.file}» не відкривали`;
		case "answer": return "Відповідь правильна";
	}
};
var defaultHint = (goal) => {
	switch (goal.type) {
		case "activeTab": return goal.how === "typed" ? "Клацни в адресний рядок угорі, надрукуй адресу і натисни Enter." : goal.how === "history" ? "Відкрий історію (кнопка 🕘 або Ctrl+H) і клацни потрібну сторінку." : "Наприкінці на екрані має бути саме ця сторінка. Перевір адресу в адресному рядку.";
		case "activeSite": return "Наприкінці на екрані має бути сторінка цього сайту. Перевір адресу в адресному рядку.";
		case "tabOpen": return "Відкрий цю сторінку в окремій вкладці: кнопка «+» або права кнопка миші на посиланні → «Відкрити в новій вкладці».";
		case "tabCount": return "Порахуй вкладки вгорі вікна. Зайву закрий хрестиком ✕ на вкладці.";
		case "siteTabs": return "Відкрий другу сторінку того самого сайту в новій вкладці: права кнопка миші на посиланні → «Відкрити в новій вкладці».";
		case "visited": return goal.how === "typed" ? "Клацни в адресний рядок, надрукуй адресу і натисни Enter." : "Ти ще не відкривав цю сторінку.";
		case "searched": return "Відкрий пошук (домашня сторінка 🏠), надрукуй ключові слова в полі пошуку і натисни «Знайти».";
		case "notVisited": return "Цей сайт не варто було відкривати. Натисни «Почати спочатку» і спробуй інакше.";
		case "foundOnPage": return "Натисни Ctrl+F (або меню ⋮ → «Знайти на сторінці»), надрукуй слово і натисни Enter: браузер підсвітить його на сторінці.";
		case "zoom": return "Масштаб змінюють клавішами Ctrl і + (більше) або Ctrl і − (менше), або кнопками «−» і «+» у меню ⋮. Ctrl+0 повертає 100 %.";
		case "used": return goal.action === "back" ? "Кнопка «Назад» — стрілка ← ліворуч від адресного рядка." : goal.action === "callAdult" ? "Коли в інтернеті щось лякає або просять секрети, натисни 🙋 «Покликати дорослого»." : goal.action === "report" ? "Натисни «Поскаржитися» під чатом." : "Скористайся кнопками ліворуч від адресного рядка.";
		case "bookmark": return goal.folder ? `Відкрий сторінку, натисни зірочку ☆ в адресному рядку і вибери папку «${goal.folder}».` : "Відкрий сторінку і натисни зірочку ☆ праворуч в адресному рядку.";
		case "noBookmark": return "Видали зайву закладку: права кнопка миші на ній → «Видалити».";
		case "folder": return "Натисни зірочку ☆ і вибери «Нова папка», або створи папку в менеджері закладок.";
		case "historyHas": return "Цю сторінку видалено з історії. Відкрий її ще раз.";
		case "historyHasNot": return "Відкрий історію (🕘 або Ctrl+H) і видали цей запис кнопкою ✕.";
		case "historyCount": return goal.equals === 0 ? "В історії натисни «Очистити історію»." : "Порахуй записи в історії.";
		case "submitted": return "Заповни форму і натисни кнопку під нею.";
		case "notSubmitted": return "Незнайомцям в інтернеті не можна писати пароль, телефон чи адресу. Натисни «Почати спочатку» і спробуй ще раз.";
		case "popupClosed": return "Закрий вікно хрестиком ✕ або кнопкою «Ні, дякую». Не натискай яскраву кнопку!";
		case "downloaded": return "Натисни кнопку «Завантажити» на сторінці.";
		case "downloadDeleted": return "Коли антивірус попереджає про загрозу, натисни «Видалити файл».";
		case "answer": return "Перевір відповідь: знайди її ще раз на сайті й надрукуй точно так, як там написано.";
		case "notOpened": return "Файл, про який попереджає антивірус, не можна відкривати. Натисни «Почати спочатку» і спробуй ще раз.";
	}
};
var matches = (url, goalUrl) => url === goalUrl;
var isMet = (web, state, goal) => {
	const url = "url" in goal ? canonicalUrl(web.map, goal.url) : "";
	switch (goal.type) {
		case "activeTab": {
			const tab = activeTabOf(state);
			if (!tab) return false;
			return matches(currentEntry(tab).url, url) && (goal.how === void 0 || tab.via === goal.how);
		}
		case "activeSite": {
			const tab = activeTabOf(state);
			return tab !== void 0 && hostOf(currentUrl(tab)) === canonicalUrl(web.map, goal.host);
		}
		case "tabOpen": return state.tabs.some((t) => currentUrl(t) === url);
		case "tabCount": return state.tabs.length === goal.equals;
		case "siteTabs": {
			const host = canonicalUrl(web.map, goal.host);
			return new Set(state.tabs.map(currentUrl).filter((u) => hostOf(u) === host)).size >= goal.pages;
		}
		case "visited": return state.visits.some((v) => v.url === url && (goal.how === void 0 || v.how === goal.how));
		case "searched": return state.visits.some((v) => {
			const { host, path, query } = parseUrl(v.url);
			const q = query.toLocaleLowerCase("uk");
			return host === "пошук.edu" && path === "пошук" && goal.words.every((w) => q.includes(w.toLocaleLowerCase("uk")));
		});
		case "notVisited": {
			const wholeSite = parseUrl(url).path === "" && !url.includes("?q=");
			const hit = (u) => wholeSite ? hostOf(u) === url : u === url;
			return !state.visits.some((v) => hit(v.url)) && !state.tabs.some((t) => hit(currentUrl(t)));
		}
		case "used": return (state.used[goal.action] ?? 0) >= (goal.times ?? 1);
		case "foundOnPage": return state.finds.some((f) => {
			const text = f.text.toLocaleLowerCase("uk");
			return (goal.url === void 0 || f.url === url) && goal.words.every((w) => text.includes(w.toLocaleLowerCase("uk")));
		});
		case "zoom": return (goal.min === void 0 || state.zoom >= goal.min) && (goal.max === void 0 || state.zoom <= goal.max);
		case "bookmark": return state.bookmarks.some((b) => b.url === url && (goal.folder === void 0 || b.folder === goal.folder) && (goal.title === void 0 || sameText(b.title, goal.title)));
		case "noBookmark": return !state.bookmarks.some((b) => b.url === url);
		case "folder": return state.folders.some((f) => sameText(f, goal.name));
		case "historyHas": return state.history.some((h) => h.url === url);
		case "historyHasNot": return !state.history.some((h) => h.url === url);
		case "historyCount": return state.history.length === goal.equals;
		case "submitted": return state.submitted.includes(goal.form);
		case "notSubmitted": return !state.submitted.includes(goal.form);
		case "popupClosed": return state.popups.some((p) => p.spec.id === goal.id && p.status === "closed");
		case "downloaded": return state.downloads.some((d) => d.file === goal.file);
		case "downloadDeleted": return state.downloads.some((d) => d.file === goal.file && d.status === "deleted");
		case "notOpened": return !state.downloads.some((d) => d.file === goal.file && d.status === "opened");
		case "answer": {
			const given = state.answers[goal.question];
			return given !== void 0 && goal.accept.some((a) => sameAnswer(a, given));
		}
	}
};
var checkGoals = (web, state, goals) => goals.map((goal) => ({
	goal,
	ok: isMet(web, state, goal),
	text: describeGoal(web, goal),
	hint: goal.hint ?? defaultHint(goal)
}));
var allMet = (results) => results.every((r) => r.ok);
// src/core/ops.ts
/** A real task takes 5–60 steps. The limits keep a forged log from using much time or memory on the server. */
var MAX_OPS = 500;
var MAX_TABS = 20;
var MAX_BOOKMARKS = 100;
var MAX_FOLDERS = 20;
var MAX_HISTORY = 600;
var MAX_NAME = 60;
var MAX_URL = 200;
var MAX_DOWNLOADS = 50;
var MAX_ANSWER = 80;
var MAX_FINDS = 50;
/** The zoom steps of Ctrl + and Ctrl −, as in desktop browsers. */
var ZOOM_LEVELS = [
	50,
	67,
	75,
	80,
	90,
	100,
	110,
	125,
	150,
	175,
	200
];
/** The next zoom step up (`1`) or down (`-1`); the same level at the end of the list. */
var nextZoom = (level, delta) => {
	const index = ZOOM_LEVELS.indexOf(level);
	const at = index < 0 ? ZOOM_LEVELS.indexOf(100) : index;
	return ZOOM_LEVELS[Math.min(Math.max(at + delta, 0), ZOOM_LEVELS.length - 1)] ?? 100;
};
var fail = (error) => ({
	ok: false,
	error
});
var done = (state) => ({
	ok: true,
	state
});
var bump = (state, action) => ({
	...state.used,
	[action]: (state.used[action] ?? 0) + 1
});
/** The page joins today's history and the list of visits. The new-tab page does not. */
var recordVisit = (web, state, entry) => {
	if (entry.url === "about:newtab") return state;
	const history = [...state.history, {
		id: state.nextId,
		url: entry.url,
		title: titleOf(web.map, entry.url),
		day: 0
	}].slice(-600);
	const popups = state.popups.map((p) => p.status === "waiting" && p.spec.at !== void 0 && popupMatches(p.spec.at, entry.url) ? {
		...p,
		status: "open"
	} : p);
	return {
		...state,
		history,
		popups,
		nextId: state.nextId + 1,
		visits: [...state.visits, entry].slice(-600)
	};
};
var replaceTab = (state, tab) => ({
	...state,
	tabs: state.tabs.map((t) => t.id === tab.id ? tab : t)
});
var cleanName = (name) => name.replace(/\s+/g, " ").trim();
/** Checks that the student could really reach `url` this way from where they are. */
var reachable = (web, state, url, how) => {
	if (url.length > 200) return "Задовга адреса";
	const tab = activeTabOf(state);
	switch (how) {
		case "typed": return url.trim().length > 0 ? null : "Порожня адреса";
		case "link": return tab && linksOn(web.list, web.map, currentUrl(tab)).includes(url) ? null : "На цій сторінці немає такого посилання";
		case "bookmark": return state.bookmarks.some((b) => b.url === url) ? null : "Немає такої закладки";
		case "history": return state.history.some((h) => h.url === url) ? null : "В історії немає такої сторінки";
		case "home": return url === state.home ? null : "Це не домашня сторінка";
		default: return "Невідомий спосіб переходу";
	}
};
var go = (web, state, raw, how) => {
	const url = canonicalUrl(web.map, raw);
	const problem = reachable(web, state, url, how);
	if (problem !== null) return fail(problem);
	const tab = activeTabOf(state);
	if (!tab) return fail("Немає відкритої вкладки");
	const entry = {
		url,
		how
	};
	const moved = replaceTab(state, {
		...tab,
		stack: [...tab.stack.slice(0, tab.index + 1), entry].slice(-600),
		index: Math.min(tab.index + 1, 599),
		via: how
	});
	return done(recordVisit(web, how === "home" ? {
		...moved,
		used: bump(moved, "home")
	} : moved, entry));
};
var step = (web, state, delta) => {
	const tab = activeTabOf(state);
	if (!tab) return fail("Немає відкритої вкладки");
	const index = tab.index + delta;
	const target = tab.stack[index];
	if (!target) return fail(delta < 0 ? "Назад іти нікуди" : "Вперед іти нікуди");
	const how = delta < 0 ? "back" : "forward";
	const moved = replaceTab(state, {
		...tab,
		index,
		via: how
	});
	return done(recordVisit(web, {
		...moved,
		used: bump(moved, how)
	}, {
		url: target.url,
		how
	}));
};
var openTab = (web, state, raw, how) => {
	if (state.tabs.length >= 20) return fail(`Забагато вкладок, можна не більше 20`);
	const url = raw === void 0 ? NEW_TAB : canonicalUrl(web.map, raw);
	if (url !== "about:newtab") {
		const problem = reachable(web, state, url, how);
		if (problem !== null) return fail(problem);
	}
	const entry = {
		url,
		how: url === "about:newtab" ? "start" : how
	};
	const tab = {
		id: state.nextTabId,
		stack: [entry],
		index: 0,
		via: entry.how
	};
	const active = activeTabOf(state);
	const at = active ? state.tabs.indexOf(active) + 1 : state.tabs.length;
	const tabs = [
		...state.tabs.slice(0, at),
		tab,
		...state.tabs.slice(at)
	];
	return done(recordVisit(web, {
		...state,
		tabs,
		activeTab: tab.id,
		nextTabId: state.nextTabId + 1,
		used: bump(state, "newTab")
	}, entry));
};
var closeTab = (state, id) => {
	const index = state.tabs.findIndex((t) => t.id === id);
	if (index < 0) return fail("Немає такої вкладки");
	const tabs = state.tabs.filter((t) => t.id !== id);
	const used = bump(state, "closeTab");
	if (tabs.length === 0) {
		const fresh = {
			id: state.nextTabId,
			stack: [{
				url: NEW_TAB,
				how: "start"
			}],
			index: 0,
			via: "start"
		};
		return done({
			...state,
			tabs: [fresh],
			activeTab: fresh.id,
			nextTabId: state.nextTabId + 1,
			used
		});
	}
	const activeTab = state.activeTab === id ? tabs[Math.min(index, tabs.length - 1)]?.id ?? 0 : state.activeTab;
	return done({
		...state,
		tabs,
		activeTab,
		used
	});
};
var addBookmark = (web, state, title, folder) => {
	const tab = activeTabOf(state);
	if (!tab) return fail("Немає відкритої вкладки");
	const url = currentUrl(tab);
	if (url === "about:newtab") return fail("Нову вкладку не можна додати в закладки");
	if (state.bookmarks.length >= 100) return fail(`Забагато закладок, можна не більше 100`);
	const name = cleanName(title);
	if (name.length > 60) return fail("Задовга назва");
	if (folder !== "" && !state.folders.includes(folder)) return fail("Немає такої папки");
	const bookmark = {
		id: state.nextId,
		url,
		title: name.length > 0 ? name : titleOf(web.map, url),
		folder
	};
	return done({
		...state,
		bookmarks: [...state.bookmarks, bookmark],
		nextId: state.nextId + 1
	});
};
var changeBookmark = (state, id, change) => {
	const found = state.bookmarks.find((b) => b.id === id);
	if (!found) return fail("Немає такої закладки");
	const changed = change(found);
	if ("ok" in changed) return changed;
	return done({
		...state,
		bookmarks: state.bookmarks.map((b) => b.id === id ? changed : b)
	});
};
var addFolder = (state, raw) => {
	const name = cleanName(raw);
	if (name.length === 0) return fail("Порожня назва папки");
	if (name.length > 60) return fail("Задовга назва");
	if (state.folders.length >= 20) return fail(`Забагато папок, можна не більше 20`);
	if (state.folders.some((f) => f.toLocaleLowerCase("uk") === name.toLocaleLowerCase("uk"))) return fail(`Папка «${name}» уже є`);
	return done({
		...state,
		folders: [...state.folders, name]
	});
};
/** Ids of the forms and chats on the page in front. */
var formsInFront = (web, state, kinds) => {
	const tab = activeTabOf(state);
	return tab ? blocksOn(web.map, currentUrl(tab)).flatMap((b) => (b.type === "form" || b.type === "chat") && kinds.includes(b.type) ? [b.id] : []) : [];
};
/** While a popup is open, the page under it cannot be used: only the popup's buttons and «Покликати дорослого». */
var POPUP_FREE = /* @__PURE__ */ new Set([
	"closePopup",
	"acceptPopup",
	"callAdult",
	"answer"
]);
var changePopup = (web, state, id, accept) => {
	const popup = state.popups.find((p) => p.spec.id === id);
	if (!popup || popup.status !== "open") return fail("Немає такого відкритого вікна");
	const popups = state.popups.map((p) => p.spec.id === id ? {
		...p,
		status: accept ? "accepted" : "closed"
	} : p);
	const changed = {
		...state,
		popups
	};
	return accept && popup.spec.acceptUrl !== void 0 ? openPopupTab(web, changed, popup.spec.acceptUrl) : done(changed);
};
/** The tempting button of a popup opens its page in a new tab, as adverts do. */
var openPopupTab = (web, state, raw) => {
	if (state.tabs.length >= 20) return done(state);
	const entry = {
		url: canonicalUrl(web.map, raw),
		how: "popup"
	};
	const tab = {
		id: state.nextTabId,
		stack: [entry],
		index: 0,
		via: "popup"
	};
	return done(recordVisit(web, {
		...state,
		tabs: [...state.tabs, tab],
		activeTab: tab.id,
		nextTabId: state.nextTabId + 1
	}, entry));
};
var download = (web, state, file) => {
	const tab = activeTabOf(state);
	if (!tab) return fail("Немає відкритої вкладки");
	const url = currentUrl(tab);
	const offer = blocksOn(web.map, url).find((b) => (b.type === "download" || b.type === "photo") && b.file === file);
	if (!offer) return fail("На цій сторінці немає такого файлу");
	if (state.downloads.length >= 50) return fail(`Забагато завантажень, можна не більше 50`);
	const virus = offer.type === "download" && offer.virus === true;
	const item = {
		id: state.nextId,
		file,
		from: url,
		virus,
		status: virus ? "warned" : "done"
	};
	return done({
		...state,
		downloads: [...state.downloads, item],
		nextId: state.nextId + 1
	});
};
var changeDownload = (state, id, status) => {
	const item = state.downloads.find((d) => d.id === id);
	if (!item || item.status === "deleted") return fail("Немає такого файлу");
	return done({
		...state,
		downloads: state.downloads.map((d) => d.id === id ? {
			...d,
			status
		} : d)
	});
};
var applyOp = (web, state, op) => {
	if (!POPUP_FREE.has(op.op) && state.popups.some((p) => p.status === "open")) return fail("Спершу закрий спливне вікно");
	switch (op.op) {
		case "submitForm": return formsInFront(web, state, ["form", "chat"]).includes(op.form) ? done({
			...state,
			submitted: state.submitted.includes(op.form) ? state.submitted : [...state.submitted, op.form]
		}) : fail("На цій сторінці немає такої форми");
		case "report": return formsInFront(web, state, ["chat"]).includes(op.form) ? done({
			...state,
			used: bump(state, "report")
		}) : fail("На цій сторінці немає такого чату");
		case "callAdult": return done({
			...state,
			used: bump(state, "callAdult")
		});
		case "answer":
			if (!state.questions.some((q) => q.id === op.question)) return fail("Немає такого питання");
			if (op.text.length > 80) return fail("Задовга відповідь");
			return done({
				...state,
				answers: {
					...state.answers,
					[op.question]: op.text.trim()
				}
			});
		case "closePopup": return changePopup(web, state, op.id, false);
		case "acceptPopup": return changePopup(web, state, op.id, true);
		case "download": return download(web, state, op.file);
		case "deleteDownload": return changeDownload(state, op.id, "deleted");
		case "openDownload": return changeDownload(state, op.id, "opened");
		default: return applyBrowsing(web, state, op);
	}
};
var applyBrowsing = (web, state, op) => {
	switch (op.op) {
		case "navigate": return go(web, state, op.url, op.how);
		case "back": return step(web, state, -1);
		case "forward": return step(web, state, 1);
		case "reload": return activeTabOf(state) ? done({
			...state,
			used: bump(state, "reload")
		}) : fail("Немає відкритої вкладки");
		case "newTab": return openTab(web, state, op.url, op.how ?? "link");
		case "closeTab": return closeTab(state, op.tab);
		case "switchTab": return state.tabs.some((t) => t.id === op.tab) ? done({
			...state,
			activeTab: op.tab
		}) : fail("Немає такої вкладки");
		case "addBookmark": return addBookmark(web, state, op.title, op.folder);
		case "renameBookmark": return changeBookmark(state, op.id, (b) => {
			const title = cleanName(op.title);
			if (title.length === 0) return fail("Порожня назва");
			return title.length > 60 ? fail("Задовга назва") : {
				...b,
				title
			};
		});
		case "moveBookmark": return changeBookmark(state, op.id, (b) => op.folder === "" || state.folders.includes(op.folder) ? {
			...b,
			folder: op.folder
		} : fail("Немає такої папки"));
		case "deleteBookmark": return state.bookmarks.some((b) => b.id === op.id) ? done({
			...state,
			bookmarks: state.bookmarks.filter((b) => b.id !== op.id)
		}) : fail("Немає такої закладки");
		case "addFolder": return addFolder(state, op.name);
		case "deleteHistory": return state.history.some((h) => h.id === op.id) ? done({
			...state,
			history: state.history.filter((h) => h.id !== op.id),
			used: bump(state, "deleteHistory")
		}) : fail("Немає такого запису в історії");
		case "clearHistory": return done({
			...state,
			history: [],
			used: bump(state, "clearHistory")
		});
		case "find": {
			const tab = activeTabOf(state);
			if (!tab) return fail("Немає відкритої вкладки");
			const text = cleanName(op.text);
			if (text.length === 0) return fail("Порожній пошук");
			if (text.length > 60) return fail("Задовгий пошук");
			const finds = [...state.finds, {
				url: currentUrl(tab),
				text
			}].slice(-50);
			return done({
				...state,
				finds,
				used: bump(state, "find")
			});
		}
		case "zoom": return ZOOM_LEVELS.includes(op.level) ? done({
			...state,
			zoom: op.level,
			used: bump(state, "zoom")
		}) : fail("Такого масштабу немає");
		default: return fail("Невідома дія");
	}
};
/** Applies the log in order. One impossible step makes the whole log invalid: the trainer never records one. */
var replay = (web, start, ops) => {
	if (ops.length > 500) return {
		ok: false,
		index: -1,
		error: `Забагато дій: ${ops.length}, можна не більше 500`
	};
	let state = start;
	for (const [index, op] of ops.entries()) {
		const result = applyOp(web, state, op);
		if (!result.ok) return {
			ok: false,
			index,
			error: result.error
		};
		state = result.state;
	}
	return {
		ok: true,
		state
	};
};
// src/sites/danger.ts
/**
* Sites for the lesson about safety (inf3-10). Everything here is made up and harmless: forms send nothing,
* files are names in a list, the «virus» only makes the antivirus warn.
*/
/** A games site for children with a chat where a stranger asks for a password. */
var igry = {
	host: "ігри-онлайн.edu",
	aliases: ["igry-online.edu"],
	name: "Ігри онлайн",
	icon: "🎮",
	color: "#6d28d9",
	secure: true,
	nav: [
		{
			text: "Ігри",
			url: "/"
		},
		{
			text: "Чат гравців",
			url: "/чат"
		},
		{
			text: "Правила",
			url: "/правила"
		}
	],
	pages: {
		"": {
			title: "Ігри онлайн",
			keywords: [
				"ігри",
				"гра",
				"грати",
				"перегони"
			],
			blocks: [
				{
					type: "heading",
					text: "Грай і спілкуйся!"
				},
				{
					type: "links",
					title: "Наші ігри",
					items: [{
						text: "🏎️ Перегони",
						url: "/чат",
						note: "Змагайся з друзями"
					}, {
						text: "🧩 Пазли",
						url: "/чат",
						note: "Збери картинку"
					}]
				},
				{
					type: "text",
					text: "Перед грою прочитай [правила](/правила)."
				}
			]
		},
		чат: {
			title: "Чат гравців — Ігри онлайн",
			keywords: ["чат", "гравці"],
			blocks: [{
				type: "heading",
				text: "Перегони: чат гравців"
			}, {
				type: "chat",
				id: "chat",
				title: "Чат гравців",
				messages: [
					{
						from: "Модератор",
						text: "Ласкаво просимо в ігровий чат! Будь чемним 🙂"
					},
					{
						from: "Сонечко_7",
						text: "Хто грає в перегони?"
					},
					{
						from: "Котик_2011",
						text: "Привіт! Давай дружити 😺"
					},
					{
						from: "Котик_2011",
						text: "Я дам тобі 1000 монет у грі! Напиши тільки свій пароль і де ти живеш."
					}
				],
				reply: "Ура! А тепер скажи номер маминого телефону 😼"
			}]
		},
		правила: {
			title: "Правила — Ігри онлайн",
			keywords: ["правила", "безпека"],
			blocks: [{
				type: "heading",
				text: "Правила безпечної гри"
			}, {
				type: "list",
				items: [
					"Нікому не кажи свій пароль, навіть друзям.",
					"Не пиши в чаті своє прізвище, адресу, номер телефону і назву школи.",
					"Якщо хтось просить секрети або пише щось неприємне — не відповідай і розкажи дорослому.",
					"Натисни «Поскаржитися», і модератор перевірить повідомлення."
				]
			}]
		}
	}
};
/** A bright bait site: no lock, a strange domain, a prize for nothing and a form for personal data. */
var pryz = {
	host: "приз-телефон.win",
	aliases: ["pryz-telefon.win"],
	name: "СУПЕР ПРИЗ!!!",
	icon: "🎁",
	color: "#db2777",
	secure: false,
	pages: { "": {
		title: "ТИ ВИГРАВ ТЕЛЕФОН!!!",
		adKeywords: [
			"казки",
			"ігри",
			"мультфільми",
			"телефон"
		],
		blocks: [
			{
				type: "banner",
				text: "🎉🎉 ВІТАЄМО!!! ТИ ВИГРАВ НОВИЙ ТЕЛЕФОН!!! 🎉🎉",
				url: "/"
			},
			{
				type: "text",
				text: "Залишилося лише 2 хвилини! Заповни форму, і телефон приїде до тебе вже завтра. Це абсолютно безкоштовно!!!"
			},
			{
				type: "form",
				id: "prize",
				title: "Отримати приз",
				fields: [
					"Ім'я та прізвище",
					"Номер телефону мами",
					"Домашня адреса"
				],
				button: "ОТРИМАТИ ТЕЛЕФОН"
			}
		]
	} }
};
/** A copy of the school diary on a strange address, without the lock: it collects logins and passwords. */
var fakeDiary = {
	host: "щоденник-школа.xyz",
	aliases: ["shchodennyk-shkola.xyz"],
	name: "Наша школа",
	icon: "🏫",
	color: "#065f46",
	secure: false,
	pages: { "": {
		title: "Вхід у щоденник — Наша школа",
		adKeywords: [
			"щоденник",
			"вхід у щоденник",
			"оцінки"
		],
		blocks: [
			{
				type: "heading",
				text: "Електронний щоденник"
			},
			{
				type: "text",
				text: "УВАГА! Твій щоденник буде заблоковано через 10 хвилин! Терміново увійди, щоб зберегти оцінки."
			},
			{
				type: "form",
				id: "fake-login",
				title: "Вхід у щоденник",
				fields: ["Логін", "Пароль"],
				button: "Увійти"
			}
		]
	} }
};
/** A site that offers fairy tales but asks to download a program first. */
var kazkyFree = {
	host: "казки-безкоштовно.xyz",
	aliases: ["kazky-bezkoshtovno.xyz"],
	name: "Безкоштовні казки",
	icon: "📕",
	color: "#b45309",
	secure: false,
	pages: { "": {
		title: "Безкоштовні казки — читай без реєстрації",
		keywords: [
			"казки",
			"казка",
			"безкоштовно",
			"читати"
		],
		blocks: [
			{
				type: "heading",
				text: "Усі казки світу безкоштовно!"
			},
			{
				type: "text",
				text: "Щоб читати казки, спершу завантаж і запусти нашу програму-читалку."
			},
			{
				type: "download",
				file: "казки-читалка.exe",
				label: "Завантажити читалку",
				size: "3 МБ",
				virus: true
			},
			{
				type: "banner",
				text: "🎁 Натисни тут і отримай подарунок!",
				url: "приз-телефон.win"
			}
		]
	} }
};
/** A site with a game to download, and the file has a virus. */
var freeGames = {
	host: "безкоштовні-ігри.xyz",
	aliases: ["bezkoshtovni-igry.xyz"],
	name: "Безкоштовні ігри",
	icon: "🕹️",
	color: "#0f766e",
	secure: false,
	pages: { "": {
		title: "Супер-гонки — завантажити безкоштовно",
		keywords: [
			"ігри",
			"гра",
			"гонки",
			"завантажити"
		],
		blocks: [
			{
				type: "heading",
				text: "🏁 Супер-гонки 3000"
			},
			{
				type: "photo",
				art: "🏎️",
				caption: "Гра «Супер-гонки 3000»",
				author: "Студія «Швидкі колеса»",
				bg: "#ccfbf1"
			},
			{
				type: "text",
				text: "Найкраща гра року! Завантаж просто зараз — безкоштовно і без реєстрації."
			},
			{
				type: "download",
				file: "супер-гонки.exe",
				label: "Завантажити гру",
				size: "12 МБ",
				virus: true
			}
		]
	} }
};
// src/sites/kazky.ts
var kazky = {
	host: "казки.edu",
	aliases: ["kazky.edu"],
	name: "Бібліотека казок",
	icon: "📚",
	color: "#7c2d12",
	secure: true,
	nav: [{
		text: "Усі казки",
		url: "/"
	}, {
		text: "Про бібліотеку",
		url: "/про-нас"
	}],
	pages: {
		"": {
			title: "Бібліотека казок",
			keywords: [
				"казки",
				"казка",
				"бібліотека",
				"читати"
			],
			blocks: [
				{
					type: "heading",
					text: "Українські народні казки"
				},
				{
					type: "text",
					text: "Обери казку і читай. Кожна казка — окрема сторінка нашого сайту."
				},
				{
					type: "links",
					items: [
						{
							text: "🥯 Колобок",
							url: "/колобок"
						},
						{
							text: "🧤 Рукавичка",
							url: "/рукавичка"
						},
						{
							text: "🐐 Коза-дереза",
							url: "/коза-дереза"
						}
					]
				}
			]
		},
		колобок: {
			title: "Колобок — Бібліотека казок",
			keywords: ["колобок", "казка"],
			blocks: [
				{
					type: "heading",
					text: "Колобок"
				},
				{
					type: "photo",
					art: "🥯",
					caption: "Малюнок до казки «Колобок»",
					author: "Ірина Пензлик",
					bg: "#fde68a"
				},
				{
					type: "text",
					text: "Жили собі дід та баба. Попросив дід: «Спечи мені, бабо, колобок». Баба спекла рум'яний колобок і поклала на вікно стигнути."
				},
				{
					type: "text",
					text: "А колобок скотився з вікна та й покотився стежкою. Зустрів зайчика, вовчика, ведмедика — і від усіх утік зі своєю пісенькою."
				},
				{
					type: "text",
					text: "Аж стрілася йому лисичка. «Ой, яка гарна пісенька, — каже. — Сядь мені на носик та заспівай ще раз». Колобок сів — а лисичка його й з'їла."
				},
				{
					type: "text",
					text: "Ще казки: [Рукавичка](/рукавичка), [Коза-дереза](/коза-дереза)."
				}
			]
		},
		рукавичка: {
			title: "Рукавичка — Бібліотека казок",
			keywords: [
				"рукавичка",
				"казка",
				"звірі"
			],
			blocks: [
				{
					type: "heading",
					text: "Рукавичка"
				},
				{
					type: "photo",
					art: "🧤",
					caption: "Малюнок до казки «Рукавичка»",
					author: "Ірина Пензлик",
					bg: "#bfdbfe"
				},
				{
					type: "text",
					text: "Ішов дід лісом, а за ним бігла собачка. Загубив дід рукавичку."
				},
				{
					type: "text",
					text: "Прибігла мишка, залізла в рукавичку та й каже: «Тут я буду жити». Потім прийшли жабка, зайчик, лисичка, вовчик, кабан і ведмідь — і всі вмістилися."
				},
				{
					type: "text",
					text: "Аж ось дід помітив, що нема рукавички, і вернувся. Собачка загавкала — звірі розбіглися, а дід забрав рукавичку."
				},
				{
					type: "text",
					text: "Ще казки: [Колобок](/колобок), [Коза-дереза](/коза-дереза)."
				}
			]
		},
		"коза-дереза": {
			title: "Коза-дереза — Бібліотека казок",
			keywords: [
				"коза",
				"дереза",
				"казка"
			],
			blocks: [
				{
					type: "heading",
					text: "Коза-дереза"
				},
				{
					type: "photo",
					art: "🐐",
					caption: "Малюнок до казки «Коза-дереза»",
					author: "Петро Олівець",
					bg: "#d9f99d"
				},
				{
					type: "text",
					text: "Був собі дід та баба, і була в них коза-дереза. Скільки її не пасли, все казала: «Я не пила, я не їла»."
				},
				{
					type: "text",
					text: "Розсердився дід і прогнав козу. Сховалася вона в зайчиковій хатці, і ніхто не міг її вигнати, аж поки маленький рак не вщипнув її."
				},
				{
					type: "text",
					text: "Ще казки: [Колобок](/колобок), [Рукавичка](/рукавичка)."
				}
			]
		},
		"про-нас": {
			title: "Про бібліотеку — Бібліотека казок",
			blocks: [
				{
					type: "heading",
					text: "Про бібліотеку"
				},
				{
					type: "text",
					text: "Бібліотеку казок створили вчителі для учнів початкових класів. Тут зібрано українські народні казки."
				},
				{
					type: "text",
					text: "Назад до [усіх казок](/)."
				}
			]
		}
	}
};
// src/sites/knowledge.ts
/** The school site: a timetable and clubs a student finds and bookmarks. */
var shkola = {
	host: "школа.edu",
	aliases: ["shkola.edu"],
	name: "Наша школа",
	icon: "🏫",
	color: "#065f46",
	secure: true,
	nav: [
		{
			text: "Головна",
			url: "/"
		},
		{
			text: "Розклад",
			url: "/розклад"
		},
		{
			text: "Гуртки",
			url: "/гуртки"
		},
		{
			text: "Новини",
			url: "/новини"
		},
		{
			text: "Оголошення",
			url: "/оголошення"
		},
		{
			text: "Щоденник",
			url: "/щоденник"
		}
	],
	pages: {
		"": {
			title: "Наша школа",
			keywords: ["школа", "сайт школи"],
			blocks: [
				{
					type: "heading",
					text: "Ласкаво просимо на сайт нашої школи!"
				},
				{
					type: "text",
					text: "Тут є [розклад уроків](/розклад), [гуртки](/гуртки) і [новини](/новини) школи."
				},
				{
					type: "photo",
					art: "🏫",
					caption: "Наша школа восени",
					author: "Василь Світлина",
					bg: "#bbf7d0"
				}
			]
		},
		розклад: {
			title: "Розклад уроків — Наша школа",
			keywords: [
				"розклад",
				"уроки",
				"дзвінки"
			],
			blocks: [{
				type: "heading",
				text: "Розклад уроків 3-А класу"
			}, {
				type: "table",
				head: [
					"День",
					"1",
					"2",
					"3",
					"4"
				],
				rows: [
					[
						"Понеділок",
						"Українська мова",
						"Математика",
						"Я досліджую світ",
						"Фізкультура"
					],
					[
						"Вівторок",
						"Читання",
						"Математика",
						"Інформатика",
						"Музика"
					],
					[
						"Середа",
						"Українська мова",
						"Англійська мова",
						"Математика",
						"Мистецтво"
					],
					[
						"Четвер",
						"Читання",
						"Математика",
						"Я досліджую світ",
						"Фізкультура"
					],
					[
						"П'ятниця",
						"Українська мова",
						"Англійська мова",
						"Дизайн і технології",
						"Читання"
					]
				]
			}]
		},
		гуртки: {
			title: "Гуртки — Наша школа",
			keywords: [
				"гуртки",
				"гурток",
				"розклад гуртків",
				"секції"
			],
			blocks: [{
				type: "heading",
				text: "Розклад гуртків"
			}, {
				type: "table",
				head: [
					"Гурток",
					"День",
					"Час"
				],
				rows: [
					[
						"Юні програмісти",
						"Вівторок",
						"14:00"
					],
					[
						"Шахи",
						"Середа",
						"13:30"
					],
					[
						"Хор",
						"Четвер",
						"14:00"
					],
					[
						"Футбол",
						"П'ятниця",
						"15:00"
					]
				]
			}]
		},
		оголошення: {
			title: "Оголошення — Наша школа",
			keywords: ["оголошення", "екскурсія"],
			blocks: [
				{
					type: "heading",
					text: "Екскурсія до планетарію"
				},
				{
					type: "text",
					text: "У четвер учні 5-х класів їдуть на екскурсію до планетарію. Візьміть із собою воду і гарний настрій!"
				},
				{
					type: "fine",
					text: "Збір у четвер о 8:30 біля воріт школи. Автобус відправляється о 8:45 і не чекає тих, хто запізнився. Повернення до школи приблизно о 13:00. Вартість квитка оплачено з батьківського фонду."
				},
				{
					type: "text",
					text: "Деталі в класних керівників."
				}
			]
		},
		щоденник: {
			title: "Вхід у щоденник — Наша школа",
			keywords: [
				"щоденник",
				"вхід",
				"оцінки"
			],
			blocks: [
				{
					type: "heading",
					text: "Електронний щоденник"
				},
				{
					type: "text",
					text: "Тут ти бачиш свої оцінки й домашні завдання. Логін і пароль тобі дав класний керівник."
				},
				{
					type: "form",
					id: "school-login",
					title: "Вхід у щоденник",
					fields: ["Логін", "Пароль"],
					button: "Увійти",
					sent: "✅ Ти увійшов у щоденник на справжньому сайті школи. Оцінки за тиждень: математика 10, інформатика 11."
				},
				{
					type: "note",
					text: "Справжній сайт школи завжди має адресу школа.edu і замок 🔒 в адресному рядку."
				}
			]
		},
		новини: {
			title: "Новини — Наша школа",
			keywords: ["новини", "свято"],
			blocks: [{
				type: "heading",
				text: "Новини"
			}, {
				type: "list",
				items: [
					"У п'ятницю — свято осені в актовій залі.",
					"Учні 4-Б класу посіли перше місце у конкурсі малюнків.",
					"Бібліотека чекає на прочитані книжки до понеділка."
				]
			}]
		}
	}
};
var slovnyk = {
	host: "словник.edu",
	aliases: ["slovnyk.edu"],
	name: "Шкільний словник",
	icon: "📖",
	color: "#4c1d95",
	secure: true,
	nav: [{
		text: "Усі слова",
		url: "/"
	}],
	pages: {
		"": {
			title: "Шкільний словник",
			keywords: [
				"словник",
				"слово",
				"як пишеться",
				"орфографія"
			],
			blocks: [
				{
					type: "heading",
					text: "Шкільний словник"
				},
				{
					type: "text",
					text: "Тут можна перевірити, як пишеться слово і що воно означає. Обери слово:"
				},
				{
					type: "links",
					items: [
						{
							text: "ведмежатко",
							url: "/ведмежатко"
						},
						{
							text: "ведмідь",
							url: "/ведмідь"
						},
						{
							text: "інтернет",
							url: "/інтернет"
						},
						{
							text: "браузер",
							url: "/браузер"
						}
					]
				}
			]
		},
		ведмежатко: {
			title: "ведмежатко — Шкільний словник",
			keywords: ["ведмежатко", "ведмідь"],
			blocks: [{
				type: "heading",
				text: "ведмежа́тко"
			}, {
				type: "text",
				text: "Іменник. Маленьке ведмежа, дитинча ведмедя. Пишеться через «ж»: ведмідь → ведмежа → ведмежатко."
			}]
		},
		ведмідь: {
			title: "ведмідь — Шкільний словник",
			keywords: ["ведмідь", "ведмеді"],
			blocks: [{
				type: "heading",
				text: "ведмі́дь"
			}, {
				type: "text",
				text: "Іменник. Великий лісовий звір із густою шерстю. Маленький ведмідь — [ведмежатко](/ведмежатко)."
			}]
		},
		інтернет: {
			title: "інтернет — Шкільний словник",
			keywords: ["інтернет", "мережа"],
			blocks: [{
				type: "heading",
				text: "інтерне́т"
			}, {
				type: "text",
				text: "Іменник. Всесвітня мережа, що з'єднує комп'ютери різних країн. Пишеться з малої літери."
			}]
		},
		браузер: {
			title: "браузер — Шкільний словник",
			keywords: ["браузер", "програма"],
			blocks: [{
				type: "heading",
				text: "бра́узер"
			}, {
				type: "text",
				text: "Іменник. Програма для перегляду сторінок інтернету. У браузері є адресний рядок, вкладки, кнопки «Назад» і «Вперед»."
			}]
		}
	}
};
/** Two encyclopedias with different numbers: a student learns to check a fact in two sources. */
var encyclopedia = {
	host: "енциклопедія.edu",
	aliases: ["encyclopedia.edu"],
	name: "Дитяча енциклопедія",
	icon: "🦉",
	color: "#0e7490",
	secure: true,
	nav: [
		{
			text: "Головна",
			url: "/"
		},
		{
			text: "Лелека",
			url: "/лелека"
		},
		{
			text: "Бджола",
			url: "/бджола"
		}
	],
	pages: {
		"": {
			title: "Дитяча енциклопедія",
			keywords: [
				"енциклопедія",
				"тварини",
				"птахи"
			],
			blocks: [{
				type: "heading",
				text: "Дитяча енциклопедія"
			}, {
				type: "text",
				text: "Статті про тварин і птахів України. Обери статтю: [лелека](/лелека) або [бджола](/бджола)."
			}]
		},
		лелека: {
			title: "Лелека — Дитяча енциклопедія",
			keywords: [
				"лелека",
				"птах",
				"птахи",
				"гніздо"
			],
			blocks: [
				{
					type: "heading",
					text: "Лелека білий"
				},
				{
					type: "photo",
					art: "🐦",
					caption: "Лелека в гнізді",
					author: "Ганна Крилата",
					bg: "#e0f2fe"
				},
				{
					type: "text",
					text: "Лелека — великий перелітний птах із довгими червоними ногами і дзьобом. В Україні його здавна вважають символом родини й домівки."
				},
				{
					type: "text",
					text: "Лелеки будують великі гнізда на дахах і стовпах. Самка зносить від 3 до 5 яєць."
				},
				{
					type: "text",
					text: "Восени лелеки відлітають в Африку, а навесні повертаються до свого гнізда."
				}
			]
		},
		бджола: {
			title: "Бджола — Дитяча енциклопедія",
			keywords: [
				"бджола",
				"бджоли",
				"мед",
				"комаха"
			],
			blocks: [
				{
					type: "heading",
					text: "Бджола медоносна"
				},
				{
					type: "photo",
					art: "🐝",
					caption: "Бджола на квітці",
					author: "Остап Квітковий",
					bg: "#fef3c7"
				},
				{
					type: "text",
					text: "Бджола — комаха, яка збирає нектар і пилок із квітів. З нектару бджоли роблять мед."
				},
				{
					type: "text",
					text: "Бджоли живуть сім'ями. У сім'ї одна матка, багато робочих бджіл і трутні."
				}
			]
		}
	}
};
var wikiKids = {
	host: "вікі-діти.edu",
	aliases: ["wiki-dity.edu"],
	name: "Вікі для дітей",
	icon: "📘",
	color: "#1d4ed8",
	secure: true,
	nav: [{
		text: "Головна",
		url: "/"
	}],
	pages: {
		"": {
			title: "Вікі для дітей",
			keywords: ["вікі", "енциклопедія"],
			blocks: [
				{
					type: "heading",
					text: "Вікі для дітей"
				},
				{
					type: "text",
					text: "Статті тут пишуть і виправляють самі читачі. Тому відомості варто перевіряти ще в одному джерелі."
				},
				{
					type: "links",
					items: [{
						text: "Лелека",
						url: "/лелека"
					}]
				}
			]
		},
		лелека: {
			title: "Лелека — Вікі для дітей",
			keywords: [
				"лелека",
				"птах",
				"птахи",
				"яйця"
			],
			blocks: [
				{
					type: "heading",
					text: "Лелека"
				},
				{
					type: "photo",
					art: "🪺",
					caption: "Гніздо лелеки на стовпі",
					author: "Дмитро Птаховий",
					bg: "#ecfccb"
				},
				{
					type: "text",
					text: "Лелека — птах, що живе поруч із людьми. Гніздо лелеки може важити як маленький автомобіль."
				},
				{
					type: "text",
					text: "Самка лелеки зносить зазвичай 4 яйця. Пташенята вилуплюються через місяць."
				}
			]
		}
	}
};
/** A photo gallery: every photo has an author, a title and a licence, and can be downloaded. */
var photoNature = {
	host: "фото-природа.edu",
	aliases: ["foto-pryroda.edu"],
	name: "Фото природи",
	icon: "📷",
	color: "#3f6212",
	secure: true,
	nav: [{
		text: "Галерея",
		url: "/"
	}, {
		text: "Як підписати фото",
		url: "/підпис"
	}],
	pages: {
		"": {
			title: "Фото природи",
			keywords: [
				"фото",
				"фотографії",
				"галерея",
				"природа",
				"картинки"
			],
			blocks: [
				{
					type: "heading",
					text: "Галерея: природа України"
				},
				{
					type: "text",
					text: "Фото на цьому сайті зробили справжні автори. Якщо береш фото, підпиши, чиє воно: [як підписати фото](/підпис)."
				},
				{
					type: "links",
					items: [
						{
							text: "🐝 Бджола на соняшнику",
							url: "/бджола"
						},
						{
							text: "🐦 Лелеки над лугом",
							url: "/лелеки"
						},
						{
							text: "🌻 Поле соняшників",
							url: "/соняшники"
						}
					]
				}
			]
		},
		бджола: {
			title: "Бджола на соняшнику — Фото природи",
			keywords: [
				"бджола",
				"бджоли",
				"соняшник",
				"фото бджоли"
			],
			blocks: [
				{
					type: "heading",
					text: "Бджола на соняшнику"
				},
				{
					type: "photo",
					art: "🐝",
					caption: "Бджола на соняшнику",
					author: "Леся Медова",
					license: "CC BY 4.0 — можна брати, якщо вказати автора",
					bg: "#fde68a",
					file: "бджола.jpg"
				},
				{
					type: "text",
					text: "Фото зроблено влітку в Полтавській області."
				}
			]
		},
		лелеки: {
			title: "Лелеки над лугом — Фото природи",
			keywords: [
				"лелека",
				"лелеки",
				"фото лелеки"
			],
			blocks: [{
				type: "heading",
				text: "Лелеки над лугом"
			}, {
				type: "photo",
				art: "🕊️",
				caption: "Лелеки над лугом",
				author: "Богдан Крилань",
				license: "CC BY 4.0 — можна брати, якщо вказати автора",
				bg: "#dbeafe",
				file: "лелеки.jpg"
			}]
		},
		соняшники: {
			title: "Поле соняшників — Фото природи",
			keywords: [
				"соняшник",
				"соняшники",
				"поле"
			],
			blocks: [{
				type: "heading",
				text: "Поле соняшників"
			}, {
				type: "photo",
				art: "🌻",
				caption: "Поле соняшників",
				author: "Марта Полева",
				license: "Усі права захищено — не можна брати без дозволу автора",
				bg: "#fef9c3",
				file: "соняшники.jpg"
			}]
		},
		підпис: {
			title: "Як підписати фото — Фото природи",
			keywords: [
				"підпис",
				"автор",
				"авторське право"
			],
			blocks: [
				{
					type: "heading",
					text: "Як підписати чуже фото"
				},
				{
					type: "text",
					text: "Кожне фото має автора. Якщо ти береш фото для презентації чи реферату, напиши під ним:"
				},
				{
					type: "list",
					items: [
						"хто автор фото;",
						"як називається фото;",
						"з якого сайту воно взяте."
					]
				},
				{
					type: "note",
					text: "Наприклад: «Бджола на соняшнику», автор Леся Медова, сайт фото-природа.edu."
				}
			]
		}
	}
};
// src/sites/kosmos.ts
/** A site of several pages with the same header: it shows that a site and a page are not the same thing. */
var kosmos = {
	host: "космос.edu",
	aliases: ["kosmos.edu"],
	name: "Космос для дітей",
	icon: "🚀",
	color: "#1e3a8a",
	secure: true,
	nav: [
		{
			text: "Головна",
			url: "/"
		},
		{
			text: "Місяць",
			url: "/місяць"
		},
		{
			text: "Сонце",
			url: "/сонце"
		},
		{
			text: "Ракети",
			url: "/ракети"
		}
	],
	pages: {
		планети: {
			title: "Планети Сонячної системи — Космос для дітей",
			keywords: [
				"планети",
				"сонячна система",
				"марс",
				"юпітер",
				"сатурн"
			],
			blocks: [
				{
					type: "heading",
					text: "Планети Сонячної системи"
				},
				{
					type: "text",
					text: "Навколо [Сонця](/сонце) обертаються вісім планет. Чотири ближчі до Сонця мають тверду кам'янисту поверхню. Чотири дальші — великі кулі з газу та льоду."
				},
				{
					type: "heading",
					text: "Меркурій"
				},
				{
					type: "text",
					text: "Меркурій — найменша планета і найближча до Сонця. Удень там дуже спекотно, а вночі дуже холодно, бо повітря майже немає. Рік на Меркурії триває лише 88 земних днів."
				},
				{
					type: "heading",
					text: "Венера"
				},
				{
					type: "text",
					text: "Венера вкрита густими хмарами, які не випускають тепло. Тому це найгарячіша планета, хоча вона друга від Сонця. На небі Венеру видно як дуже яскраву «вечірню зорю»."
				},
				{
					type: "heading",
					text: "Земля"
				},
				{
					type: "text",
					text: "Земля — наш дім і єдина відома планета з життям. Тут є рідка вода, повітря для дихання і один природний супутник — [Місяць](/місяць)."
				},
				{
					type: "heading",
					text: "Марс"
				},
				{
					type: "text",
					text: "Марс називають Червоною планетою: його ґрунт має багато іржавого пилу. На Марсі є найвища гора Сонячної системи. У Марса два маленькі супутники неправильної форми — Фобос і Деймос. Зараз Марсом їздять роботи-марсоходи."
				},
				{
					type: "heading",
					text: "Юпітер"
				},
				{
					type: "text",
					text: "Юпітер — найбільша планета. У ньому помістилося б понад тисячу таких планет, як Земля. На Юпітері вже сотні років вирує величезна буря — Велика червона пляма."
				},
				{
					type: "heading",
					text: "Сатурн"
				},
				{
					type: "text",
					text: "Сатурн відомий своїми кільцями. Вони складаються з мільйонів шматочків льоду й каменю. Сатурн такий легкий для свого розміру, що міг би плавати у велетенській ванні з водою."
				},
				{
					type: "heading",
					text: "Уран і Нептун"
				},
				{
					type: "text",
					text: "Уран і Нептун — далекі холодні планети блакитного кольору. Уран обертається, ніби лежачи на боці. На Нептуні дмуть найсильніші вітри Сонячної системи."
				},
				{
					type: "note",
					text: "Порада: щоб швидко знайти потрібне слово в довгій статті, натисни Ctrl+F."
				}
			]
		},
		"": {
			title: "Космос для дітей",
			keywords: [
				"космос",
				"планети",
				"зорі",
				"небо"
			],
			blocks: [
				{
					type: "heading",
					text: "Вітаємо в космосі!"
				},
				{
					type: "text",
					text: "Тут ти дізнаєшся про небесні тіла, які видно з Землі, і про те, як люди літають у космос."
				},
				{
					type: "links",
					title: "Обери, про що читати",
					items: [
						{
							text: "🌙 Місяць",
							url: "/місяць",
							note: "Супутник нашої планети"
						},
						{
							text: "☀️ Сонце",
							url: "/сонце",
							note: "Найближча до нас зоря"
						},
						{
							text: "🚀 Ракети",
							url: "/ракети",
							note: "Як люди летять у космос"
						},
						{
							text: "🪐 Планети",
							url: "/планети",
							note: "Велика стаття про Сонячну систему"
						}
					]
				},
				{
					type: "photo",
					art: "🌌",
					caption: "Нічне небо над селом",
					author: "Олена Зоряна",
					bg: "#0f172a"
				}
			]
		},
		місяць: {
			title: "Місяць — Космос для дітей",
			keywords: [
				"місяць",
				"супутник",
				"кратери",
				"фази"
			],
			blocks: [
				{
					type: "heading",
					text: "Місяць"
				},
				{
					type: "photo",
					art: "🌕",
					caption: "Повний Місяць",
					author: "Андрій Небесний",
					bg: "#1e293b"
				},
				{
					type: "text",
					text: "Місяць — супутник Землі. Він обертається навколо нашої планети і повертається до неї завжди одним боком."
				},
				{
					type: "text",
					text: "Місяць не світить сам: його освітлює [Сонце](/сонце). Тому ми бачимо то тонкий серпик, то повний круг."
				},
				{
					type: "text",
					text: "На поверхні Місяця багато кратерів. Їх залишили камені, що падали з космосу."
				},
				{
					type: "list",
					items: [
						"Від Землі до Місяця приблизно 384 тисячі кілометрів.",
						"На Місяці немає повітря і води.",
						"Людина вперше ступила на Місяць у 1969 році."
					]
				},
				{
					type: "text",
					text: "Хочеш знати, на чому туди летіли? Читай про [ракети](/ракети)."
				}
			]
		},
		сонце: {
			title: "Сонце — Космос для дітей",
			keywords: [
				"сонце",
				"зоря",
				"світло",
				"тепло"
			],
			blocks: [
				{
					type: "heading",
					text: "Сонце"
				},
				{
					type: "photo",
					art: "☀️",
					caption: "Сонце на світанку",
					author: "Марія Світанкова",
					bg: "#f59e0b"
				},
				{
					type: "text",
					text: "Сонце — зоря, найближча до Землі. Воно дає нам світло і тепло."
				},
				{
					type: "text",
					text: "Сонце набагато більше за Землю: усередині нього вмістилося б понад мільйон таких планет, як наша."
				},
				{
					type: "note",
					text: "Ніколи не дивись на Сонце без захисту: це шкодить очам."
				},
				{
					type: "text",
					text: "Сонце освітлює і [Місяць](/місяць)."
				}
			]
		},
		ракети: {
			title: "Ракети — Космос для дітей",
			keywords: [
				"ракета",
				"ракети",
				"космонавт",
				"політ"
			],
			blocks: [
				{
					type: "heading",
					text: "Ракети"
				},
				{
					type: "photo",
					art: "🚀",
					caption: "Старт ракети",
					author: "Тарас Ракетний",
					bg: "#334155"
				},
				{
					type: "text",
					text: "Щоб вирватися з Землі в космос, потрібна дуже велика швидкість. Таку швидкість дає ракета."
				},
				{
					type: "text",
					text: "Ракета має кілька ступенів. Коли в одному закінчується паливо, він відділяється, і ракета стає легшою."
				},
				{
					type: "text",
					text: "На ракетах люди долетіли до [Місяця](/місяць)."
				}
			]
		}
	}
};
/** Every made-up site the trainer knows. All content is invented: no real brands or people. */
var allSites = [
	{
		host: SEARCH_HOST,
		aliases: ["poshuk.edu"],
		name: "Пошук",
		icon: "🔎",
		color: "#2563eb",
		secure: true,
		pages: {
			"": {
				title: "Пошук",
				blocks: [{ type: "search" }]
			},
			[SEARCH_PATH]: {
				title: "Пошук",
				blocks: [{ type: "search" }]
			}
		}
	},
	kosmos,
	kazky,
	shkola,
	slovnyk,
	encyclopedia,
	wikiKids,
	photoNature,
	igry,
	pryz,
	kazkyFree,
	freeGames,
	fakeDiary
];
var defaultWeb = makeWeb(allSites);
export { absoluteUrl as A, tileSites as B, buildState as C, popupMatches as D, makeWeb as E, resolve as F, normalizeUrl as G, NEW_TAB as H, search as I, parseUrl as K, searchUrl as L, canonicalUrl as M, iconOf as N, SEARCH_HOST as O, linksOn as P, siteMap as R, activeTabOf as S, currentUrl as T, hostOf as U, titleOf as V, looksLikeAddress as W, allMet as _, MAX_DOWNLOADS as a, normalizeAnswer as b, MAX_HISTORY as c, MAX_TABS as d, MAX_URL as f, replay as g, nextZoom as h, MAX_BOOKMARKS as i, blocksOn as j, SEARCH_PATH as k, MAX_NAME as l, applyOp as m, defaultWeb as n, MAX_FINDS as o, ZOOM_LEVELS as p, sameUrl as q, MAX_ANSWER as r, MAX_FOLDERS as s, allSites as t, MAX_OPS as u, checkGoals as v, currentEntry as w, DEFAULT_HOME as x, describeGoal as y, splitLinks as z };
