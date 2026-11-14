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
/** Pages whose title or keywords hold every word of the query, best first. Hosts sorted for a stable order. */
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
			const firstText = page.blocks.find((b) => b.type === "text");
			const snippet = firstText?.type === "text" ? splitLinks(firstText.text).map((p) => typeof p === "string" ? p : p.text).join("") : "";
			hits.push({
				url: path.length > 0 ? `${site.host}/${path}` : site.host,
				title: page.title,
				site,
				snippet: snippet.slice(0, 140),
				score
			});
		}
	}
	return hits.sort((a, b) => b.score - a.score || a.url.localeCompare(b.url, "uk")).map(({ score: _s, ...hit }) => hit);
};
/**
* Every address a student can reach by a click on this page: links in its blocks, in the site header,
* and search results. The server checks a «link» step against this list.
*/
var linksOn = (sitesList, sites, url) => {
	const r = resolve(sites, url);
	if (r.kind === "newTab") return sitesList.filter((s) => s.host !== SEARCH_HOST).map((s) => s.host);
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
		home: url(start.home ?? "пошук.edu")
	};
};
// src/core/goals.ts
var sameText = (a, b) => a.trim().toLocaleLowerCase("uk") === b.trim().toLocaleLowerCase("uk");
var HOW_TEXT = {
	start: "",
	typed: ", адресу надруковано",
	link: " за посиланням",
	bookmark: " із закладки",
	history: " з історії",
	home: " кнопкою «Домашня сторінка»",
	back: " кнопкою «Назад»",
	forward: " кнопкою «Вперед»"
};
var ACTION_TEXT = {
	back: "Натиснуто «Назад»",
	forward: "Натиснуто «Вперед»",
	reload: "Сторінку оновлено",
	newTab: "Відкрито нову вкладку",
	closeTab: "Закрито вкладку",
	home: "Натиснуто «Домашня сторінка»",
	deleteHistory: "Із історії видалено запис",
	clearHistory: "Історію очищено"
};
/** Default wording of a goal for the task list. */
var describeGoal = (web, goal) => {
	if (goal.text !== void 0) return goal.text;
	const page = (url) => `«${titleOf(web.map, canonicalUrl(web.map, url))}»`;
	switch (goal.type) {
		case "activeTab": return `Відкрито сторінку ${page(goal.url)}${goal.how ? HOW_TEXT[goal.how] : ""}`;
		case "tabOpen": return `Є вкладка зі сторінкою ${page(goal.url)}`;
		case "tabCount": return `Відкрито вкладок: ${goal.equals}`;
		case "siteTabs": return `${goal.pages} різні сторінки сайту ${goal.host} відкрито в окремих вкладках`;
		case "visited": return `Ти побував на сторінці ${page(goal.url)}${goal.how ? HOW_TEXT[goal.how] : ""}`;
		case "searched": return `Ти шукав у пошуковику: ${goal.words.join(" ")}`;
		case "notVisited": return `Ти не відкривав ${parseUrl(goal.url).path === "" ? `сайт ${goal.url}` : page(goal.url)}`;
		case "used": return goal.times !== void 0 && goal.times > 1 ? `${ACTION_TEXT[goal.action]} ${goal.times} рази` : ACTION_TEXT[goal.action];
		case "bookmark": return `Сторінка ${page(goal.url)} є в закладках${goal.folder ? ` у папці «${goal.folder}»` : ""}${goal.title ? ` з назвою «${goal.title}»` : ""}`;
		case "noBookmark": return `Закладки на ${page(goal.url)} немає`;
		case "folder": return `Є папка закладок «${goal.name}»`;
		case "historyHas": return `В історії є ${page(goal.url)}`;
		case "historyHasNot": return `В історії немає ${page(goal.url)}`;
		case "historyCount": return goal.equals === 0 ? "Історію очищено" : `В історії записів: ${goal.equals}`;
	}
};
var defaultHint = (goal) => {
	switch (goal.type) {
		case "activeTab": return goal.how === "typed" ? "Клацни в адресний рядок угорі, надрукуй адресу і натисни Enter." : goal.how === "history" ? "Відкрий історію (кнопка 🕘 або Ctrl+H) і клацни потрібну сторінку." : "Наприкінці на екрані має бути саме ця сторінка. Перевір адресу в адресному рядку.";
		case "tabOpen": return "Відкрий цю сторінку в окремій вкладці: кнопка «+» або права кнопка миші на посиланні → «Відкрити в новій вкладці».";
		case "tabCount": return "Порахуй вкладки вгорі вікна. Зайву закрий хрестиком ✕ на вкладці.";
		case "siteTabs": return "Відкрий другу сторінку того самого сайту в новій вкладці: права кнопка миші на посиланні → «Відкрити в новій вкладці».";
		case "visited": return goal.how === "typed" ? "Клацни в адресний рядок, надрукуй адресу і натисни Enter." : "Ти ще не відкривав цю сторінку.";
		case "searched": return "Відкрий пошук (домашня сторінка 🏠), надрукуй ключові слова в полі пошуку і натисни «Знайти».";
		case "notVisited": return "Цей сайт не варто було відкривати. Натисни «Почати спочатку» і спробуй інакше.";
		case "used": return goal.action === "back" ? "Кнопка «Назад» — стрілка ← ліворуч від адресного рядка." : "Скористайся кнопками ліворуч від адресного рядка.";
		case "bookmark": return goal.folder ? `Відкрий сторінку, натисни зірочку ☆ в адресному рядку і вибери папку «${goal.folder}».` : "Відкрий сторінку і натисни зірочку ☆ праворуч в адресному рядку.";
		case "noBookmark": return "Видали зайву закладку: права кнопка миші на ній → «Видалити».";
		case "folder": return "Натисни зірочку ☆ і вибери «Нова папка», або створи папку в менеджері закладок.";
		case "historyHas": return "Цю сторінку видалено з історії. Відкрий її ще раз.";
		case "historyHasNot": return "Відкрий історію (🕘 або Ctrl+H) і видали цей запис кнопкою ✕.";
		case "historyCount": return goal.equals === 0 ? "В історії натисни «Очистити історію»." : "Порахуй записи в історії.";
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
		case "bookmark": return state.bookmarks.some((b) => b.url === url && (goal.folder === void 0 || b.folder === goal.folder) && (goal.title === void 0 || sameText(b.title, goal.title)));
		case "noBookmark": return !state.bookmarks.some((b) => b.url === url);
		case "folder": return state.folders.some((f) => sameText(f, goal.name));
		case "historyHas": return state.history.some((h) => h.url === url);
		case "historyHasNot": return !state.history.some((h) => h.url === url);
		case "historyCount": return state.history.length === goal.equals;
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
	return {
		...state,
		history,
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
var applyOp = (web, state, op) => {
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
	wikiKids
];
var defaultWeb = makeWeb(allSites);
export { siteMap as A, absoluteUrl as C, resolve as D, linksOn as E, looksLikeAddress as F, normalizeUrl as I, parseUrl as L, titleOf as M, NEW_TAB as N, search as O, hostOf as P, sameUrl as R, SEARCH_PATH as S, iconOf as T, buildState as _, MAX_HISTORY as a, makeWeb as b, MAX_TABS as c, replay as d, allMet as f, activeTabOf as g, DEFAULT_HOME as h, MAX_FOLDERS as i, splitLinks as j, searchUrl as k, MAX_URL as l, describeGoal as m, defaultWeb as n, MAX_NAME as o, checkGoals as p, MAX_BOOKMARKS as r, MAX_OPS as s, allSites as t, applyOp as u, currentEntry as v, canonicalUrl as w, SEARCH_HOST as x, currentUrl as y };
