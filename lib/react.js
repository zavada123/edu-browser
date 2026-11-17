import { A as absoluteUrl, B as tileSites, C as buildState, F as resolve, I as search, L as searchUrl, M as canonicalUrl, N as iconOf, S as activeTabOf, T as currentUrl, V as titleOf, W as looksLikeAddress, _ as allMet, g as replay, h as nextZoom, m as applyOp, n as defaultWeb, v as checkGoals, z as splitLinks } from "./sites-TCvlXqZz.js";
import { useCallback, useEffect, useId, useMemo, useReducer, useRef, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
// src/ui/Select.tsx
var LIST_MAX_HEIGHT_PX = 288;
var LIST_GAP_PX = 6;
var TYPE_AHEAD_RESET_MS = 600;
var listPlace = (rect) => {
	const below = window.innerHeight - rect.bottom;
	return below < LIST_MAX_HEIGHT_PX && rect.top > below ? {
		left: rect.left,
		width: rect.width,
		top: null,
		bottom: window.innerHeight - rect.top + LIST_GAP_PX
	} : {
		left: rect.left,
		width: rect.width,
		top: rect.bottom + LIST_GAP_PX,
		bottom: null
	};
};
/** Next enabled option index from `from` in `direction`; stays inside the list. */
var stepEnabled = (options, from, direction) => {
	for (let i = from + direction; i >= 0 && i < options.length; i += direction) if (options[i]?.disabled !== true) return i;
	return from;
};
function Select(props) {
	const { options } = props;
	const listId = `${useId()}-list`;
	const selectedIndex = options.findIndex((o) => o.value === props.value);
	const [open, setOpen] = useState(false);
	const [active, setActive] = useState(0);
	const [place, setPlace] = useState({
		left: 0,
		width: 0,
		top: 0,
		bottom: null
	});
	const rootRef = useRef(null);
	const buttonRef = useRef(null);
	const listRef = useRef(null);
	const typed = useRef({
		text: "",
		at: 0
	});
	const openList = (index) => {
		const rect = buttonRef.current?.getBoundingClientRect();
		if (rect !== void 0) setPlace(listPlace(rect));
		setActive(index < 0 ? stepEnabled(options, -1, 1) : index);
		setOpen(true);
	};
	const pick = (index) => {
		const option = options[index];
		setOpen(false);
		if (option === void 0 || option.disabled === true) return;
		if (option.value !== props.value) props.onChange(option.value);
	};
	useEffect(() => {
		if (!open) return;
		const onPointerDown = (event) => {
			if (event.target instanceof Node && rootRef.current?.contains(event.target) === true) return;
			setOpen(false);
		};
		const onScroll = (event) => {
			if (event.target instanceof Node && listRef.current?.contains(event.target) === true) return;
			setOpen(false);
		};
		const onResize = () => setOpen(false);
		document.addEventListener("pointerdown", onPointerDown);
		window.addEventListener("scroll", onScroll, true);
		window.addEventListener("resize", onResize);
		return () => {
			document.removeEventListener("pointerdown", onPointerDown);
			window.removeEventListener("scroll", onScroll, true);
			window.removeEventListener("resize", onResize);
		};
	}, [open]);
	useEffect(() => {
		if (!open) return;
		listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
	}, [open, active]);
	/** Type-ahead: the next enabled option whose label starts with the typed text. */
	const findTyped = (key, now) => {
		const text = (now - typed.current.at > TYPE_AHEAD_RESET_MS ? key : typed.current.text + key).toLowerCase();
		typed.current = {
			text,
			at: now
		};
		const start = open ? active : Math.max(selectedIndex, 0);
		return [...options.keys()].map((i) => (start + 1 + i) % options.length).find((i) => {
			const option = options[i];
			return option !== void 0 && option.disabled !== true && option.label.toLowerCase().startsWith(text);
		}) ?? -1;
	};
	const onKeyDown = (event) => {
		const { key } = event;
		const printable = key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
		if (!open) {
			if (key === "ArrowDown" || key === "ArrowUp" || key === "Enter" || key === " ") {
				event.preventDefault();
				openList(selectedIndex);
			} else if (key === "Home" || key === "End") {
				event.preventDefault();
				openList(key === "Home" ? stepEnabled(options, -1, 1) : stepEnabled(options, options.length, -1));
			} else if (printable) {
				const found = findTyped(key, event.timeStamp);
				if (found >= 0) openList(found);
			}
			return;
		}
		switch (key) {
			case "ArrowDown":
			case "ArrowUp":
				event.preventDefault();
				if (event.altKey) return pick(active);
				return setActive(stepEnabled(options, active, key === "ArrowDown" ? 1 : -1));
			case "Home":
				event.preventDefault();
				return setActive(stepEnabled(options, -1, 1));
			case "End":
				event.preventDefault();
				return setActive(stepEnabled(options, options.length, -1));
			case "Enter":
			case " ":
				event.preventDefault();
				return pick(active);
			case "Escape":
				event.preventDefault();
				event.stopPropagation();
				return setOpen(false);
			case "Tab": return pick(active);
		}
		if (printable) {
			const found = findTyped(key, event.timeStamp);
			if (found >= 0) setActive(found);
		}
	};
	const shown = options[selectedIndex];
	return /* @__PURE__ */ jsxs("span", {
		ref: rootRef,
		className: ["edu-select", props.className].filter(Boolean).join(" "),
		children: [/* @__PURE__ */ jsxs("button", {
			ref: buttonRef,
			type: "button",
			role: "combobox",
			className: "edu-select-button",
			value: props.value,
			"aria-label": props.ariaLabel,
			"aria-haspopup": "listbox",
			"aria-expanded": open,
			"aria-controls": listId,
			"aria-activedescendant": open ? `${listId}-${active}` : void 0,
			onClick: () => open ? setOpen(false) : openList(selectedIndex),
			onKeyDown,
			children: [/* @__PURE__ */ jsxs("span", {
				className: "edu-select-labels",
				children: [options.map((o) => /* @__PURE__ */ jsx("span", {
					"aria-hidden": true,
					className: "edu-select-sizer",
					children: o.label
				}, o.value)), /* @__PURE__ */ jsx("span", {
					className: "edu-select-value",
					children: shown?.label ?? ""
				})]
			}), /* @__PURE__ */ jsx("svg", {
				className: "edu-select-chevron",
				viewBox: "0 0 24 24",
				"aria-hidden": true,
				children: /* @__PURE__ */ jsx("path", { d: "m6 9 6 6 6-6" })
			})]
		}), /* @__PURE__ */ jsx("ul", {
			ref: listRef,
			id: listId,
			role: "listbox",
			"aria-label": props.ariaLabel,
			className: "edu-select-list",
			hidden: !open,
			style: {
				left: place.left,
				minWidth: place.width,
				top: place.top ?? void 0,
				bottom: place.bottom ?? void 0
			},
			children: options.map((o, i) => /* @__PURE__ */ jsxs("li", {
				id: `${listId}-${i}`,
				"data-index": i,
				"data-value": o.value,
				role: "option",
				"aria-selected": i === selectedIndex,
				"aria-disabled": o.disabled === true || void 0,
				className: ["edu-select-option", i === active ? "is-active" : ""].filter(Boolean).join(" "),
				onPointerDown: (event) => event.preventDefault(),
				onPointerEnter: () => {
					if (o.disabled !== true) setActive(i);
				},
				onClick: (event) => {
					event.preventDefault();
					pick(i);
					buttonRef.current?.focus();
				},
				children: [/* @__PURE__ */ jsx("span", {
					className: "edu-select-text",
					children: o.label
				}), i === selectedIndex && /* @__PURE__ */ jsx("svg", {
					className: "edu-select-check",
					viewBox: "0 0 24 24",
					"aria-hidden": true,
					children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" })
				})]
			}, o.value))
		})]
	});
}
// src/ui/Bookmarks.tsx
var BAR = "";
var NEW_FOLDER = "\0new";
/** Where a bookmark can live: the bar itself or one of the folders. */
var folderOptions = (folders) => [{
	value: BAR,
	label: "Панель закладок"
}, ...folders.map((f) => ({
	value: f,
	label: `📁 ${f}`
}))];
/** The bar under the address bar: bookmarks of the bar itself, then the folders. */
var BookmarkBar = ({ web, browser, dispatch }) => {
	const onBar = browser.bookmarks.filter((b) => b.folder === BAR);
	const empty = onBar.length === 0 && browser.folders.length === 0;
	return /* @__PURE__ */ jsxs("div", {
		className: `eb-bookmark-bar${empty ? " is-empty" : ""}`,
		"aria-label": "Панель закладок",
		children: [
			empty && /* @__PURE__ */ jsx("span", {
				className: "eb-muted",
				children: "Тут з'являться закладки. Натисни ☆ в адресному рядку."
			}),
			onBar.map((b) => /* @__PURE__ */ jsxs("button", {
				type: "button",
				className: "eb-chip",
				title: `${b.title}\n${b.url}`,
				onClick: () => dispatch({
					type: "op",
					op: {
						op: "navigate",
						url: b.url,
						how: "bookmark"
					}
				}),
				onContextMenu: (e) => {
					e.preventDefault();
					dispatch({
						type: "menu",
						menu: {
							kind: "bookmark",
							x: e.clientX,
							y: e.clientY,
							id: b.id
						}
					});
				},
				children: [/* @__PURE__ */ jsx("span", {
					"aria-hidden": "true",
					children: iconOf(web.map, b.url)
				}), /* @__PURE__ */ jsx("span", {
					className: "eb-chip-text",
					children: b.title
				})]
			}, b.id)),
			browser.folders.map((folder) => /* @__PURE__ */ jsxs("button", {
				type: "button",
				className: "eb-chip eb-chip-folder",
				"aria-haspopup": "menu",
				onClick: (e) => {
					const r = e.currentTarget.getBoundingClientRect();
					dispatch({
						type: "menu",
						menu: {
							kind: "folder",
							x: r.left,
							y: r.bottom + 2,
							folder
						}
					});
				},
				children: [/* @__PURE__ */ jsx("span", {
					"aria-hidden": "true",
					children: "📁"
				}), /* @__PURE__ */ jsx("span", {
					className: "eb-chip-text",
					children: folder
				})]
			}, folder))
		]
	});
};
/** The star dialog: name the bookmark and choose its folder, or a new folder. */
var BookmarkDialog = ({ web, browser, dispatch }) => {
	const tab = activeTabOf(browser);
	const url = tab ? currentUrl(tab) : "";
	const existing = browser.bookmarks.find((b) => b.url === url);
	const [title, setTitle] = useState(existing?.title ?? titleOf(web.map, url));
	const [folder, setFolder] = useState(existing?.folder ?? BAR);
	const [newFolder, setNewFolder] = useState("");
	const close = () => dispatch({
		type: "bookmarkDialog",
		open: false
	});
	const save = (e) => {
		e.preventDefault();
		const ops = [];
		let target = folder;
		if (folder === NEW_FOLDER) {
			const name = newFolder.trim();
			if (name.length === 0) {
				dispatch({
					type: "notify",
					message: "Надрукуй назву нової папки."
				});
				return;
			}
			const same = browser.folders.find((f) => f.toLocaleLowerCase("uk") === name.toLocaleLowerCase("uk"));
			if (same === void 0) ops.push({
				op: "addFolder",
				name
			});
			target = same ?? name.replace(/\s+/g, " ");
		}
		if (existing) {
			if (title.trim() !== existing.title && title.trim().length > 0) ops.push({
				op: "renameBookmark",
				id: existing.id,
				title
			});
			if (target !== existing.folder) ops.push({
				op: "moveBookmark",
				id: existing.id,
				folder: target
			});
		} else ops.push({
			op: "addBookmark",
			title,
			folder: target
		});
		if (ops.length > 0) dispatch({
			type: "ops",
			ops
		});
		close();
	};
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("div", {
		className: "eb-backdrop",
		onPointerDown: close
	}), /* @__PURE__ */ jsxs("form", {
		className: "eb-dialog eb-bookmark-dialog",
		role: "dialog",
		"aria-label": existing ? "Зміна закладки" : "Нова закладка",
		onSubmit: save,
		children: [
			/* @__PURE__ */ jsx("h2", { children: existing ? "Закладку додано" : "Додати закладку" }),
			/* @__PURE__ */ jsxs("label", { children: [/* @__PURE__ */ jsx("span", { children: "Назва" }), /* @__PURE__ */ jsx("input", {
				value: title,
				onChange: (e) => setTitle(e.target.value),
				maxLength: 60,
				autoFocus: true
			})] }),
			/* @__PURE__ */ jsxs("div", {
				className: "eb-field",
				children: [/* @__PURE__ */ jsx("span", { children: "Папка" }), /* @__PURE__ */ jsx(Select, {
					ariaLabel: "Папка",
					value: folder,
					options: [...folderOptions(browser.folders), {
						value: NEW_FOLDER,
						label: "➕ Нова папка…"
					}],
					onChange: setFolder
				})]
			}),
			folder === NEW_FOLDER && /* @__PURE__ */ jsxs("label", { children: [/* @__PURE__ */ jsx("span", { children: "Назва нової папки" }), /* @__PURE__ */ jsx("input", {
				value: newFolder,
				onChange: (e) => setNewFolder(e.target.value),
				maxLength: 60,
				autoFocus: true,
				placeholder: "Наприклад, Навчання"
			})] }),
			/* @__PURE__ */ jsxs("div", {
				className: "eb-dialog-actions",
				children: [existing && /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "eb-btn",
					onClick: () => {
						dispatch({
							type: "op",
							op: {
								op: "deleteBookmark",
								id: existing.id
							}
						});
						close();
					},
					children: "Видалити"
				}), /* @__PURE__ */ jsx("button", {
					type: "submit",
					className: "eb-btn is-primary",
					children: "Готово"
				})]
			})
		]
	})] });
};
var BookmarkRow = ({ web, bookmark, folders, dispatch }) => {
	const [renaming, setRenaming] = useState(false);
	const [title, setTitle] = useState(bookmark.title);
	const finished = useRef(false);
	const rename = (e) => {
		e.preventDefault();
		if (finished.current) return;
		finished.current = true;
		if (title.trim().length > 0 && title.trim() !== bookmark.title) dispatch({
			type: "op",
			op: {
				op: "renameBookmark",
				id: bookmark.id,
				title
			}
		});
		setRenaming(false);
	};
	return /* @__PURE__ */ jsxs("li", {
		className: "eb-row",
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "eb-row-icon",
				"aria-hidden": "true",
				children: iconOf(web.map, bookmark.url)
			}),
			renaming ? /* @__PURE__ */ jsx("form", {
				className: "eb-row-main",
				onSubmit: rename,
				children: /* @__PURE__ */ jsx("input", {
					value: title,
					onChange: (e) => setTitle(e.target.value),
					onBlur: rename,
					maxLength: 60,
					autoFocus: true,
					"aria-label": "Нова назва закладки"
				})
			}) : /* @__PURE__ */ jsxs("button", {
				type: "button",
				className: "eb-row-main",
				onClick: () => dispatch({
					type: "op",
					op: {
						op: "navigate",
						url: bookmark.url,
						how: "bookmark"
					}
				}),
				children: [/* @__PURE__ */ jsx("span", {
					className: "eb-row-title",
					children: bookmark.title
				}), /* @__PURE__ */ jsx("span", {
					className: "eb-row-url",
					children: bookmark.url
				})]
			}),
			/* @__PURE__ */ jsx(Select, {
				className: "eb-row-folder",
				value: bookmark.folder,
				ariaLabel: `Папка закладки «${bookmark.title}»`,
				options: folderOptions(folders),
				onChange: (folder) => dispatch({
					type: "op",
					op: {
						op: "moveBookmark",
						id: bookmark.id,
						folder
					}
				})
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "eb-icon-btn",
				"aria-label": `Перейменувати «${bookmark.title}»`,
				title: "Перейменувати",
				onClick: () => {
					finished.current = false;
					setTitle(bookmark.title);
					setRenaming(true);
				},
				children: "✏️"
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "eb-icon-btn",
				"aria-label": `Видалити «${bookmark.title}»`,
				title: "Видалити",
				onClick: () => dispatch({
					type: "op",
					op: {
						op: "deleteBookmark",
						id: bookmark.id
					}
				}),
				children: "✕"
			})
		]
	});
};
/** The bookmark manager: every folder with its bookmarks; rename, move to a folder, delete; a new folder. */
var BookmarksPanel = ({ web, browser, dispatch }) => {
	const [name, setName] = useState("");
	const addFolder = (e) => {
		e.preventDefault();
		if (name.trim().length === 0) return;
		dispatch({
			type: "op",
			op: {
				op: "addFolder",
				name
			}
		});
		setName("");
	};
	const groups = [BAR, ...browser.folders];
	return /* @__PURE__ */ jsxs("div", {
		className: "eb-panel-body",
		children: [groups.map((folder) => {
			const items = browser.bookmarks.filter((b) => b.folder === folder);
			return /* @__PURE__ */ jsxs("section", {
				className: "eb-group",
				children: [/* @__PURE__ */ jsx("h3", { children: folder === BAR ? "⭐ Панель закладок" : `📁 ${folder}` }), items.length === 0 ? /* @__PURE__ */ jsx("p", {
					className: "eb-muted",
					children: "Порожньо"
				}) : /* @__PURE__ */ jsx("ul", {
					className: "eb-rows",
					children: items.map((b) => /* @__PURE__ */ jsx(BookmarkRow, {
						web,
						bookmark: b,
						folders: browser.folders,
						dispatch
					}, b.id))
				})]
			}, folder || "bar");
		}), /* @__PURE__ */ jsxs("form", {
			className: "eb-inline-form",
			onSubmit: addFolder,
			children: [/* @__PURE__ */ jsx("input", {
				value: name,
				onChange: (e) => setName(e.target.value),
				placeholder: "Назва нової папки",
				"aria-label": "Назва нової папки",
				maxLength: 60
			}), /* @__PURE__ */ jsx("button", {
				type: "submit",
				className: "eb-btn",
				children: "Нова папка"
			})]
		})]
	});
};
// src/ui/Chrome.tsx
/** The tabs along the top. On a phone they are hidden and the tab counter opens a list instead. */
var TabStrip = ({ web, browser, dispatch }) => /* @__PURE__ */ jsxs("div", {
	className: "eb-tabs",
	role: "tablist",
	"aria-label": "Вкладки",
	children: [browser.tabs.map((tab) => {
		const url = currentUrl(tab);
		const active = tab.id === browser.activeTab;
		return /* @__PURE__ */ jsxs("div", {
			className: `eb-tab${active ? " is-active" : ""}`,
			title: titleOf(web.map, url),
			children: [/* @__PURE__ */ jsxs("button", {
				type: "button",
				role: "tab",
				"aria-selected": active,
				className: "eb-tab-main",
				onClick: () => !active && dispatch({
					type: "op",
					op: {
						op: "switchTab",
						tab: tab.id
					}
				}),
				onAuxClick: (e) => e.button === 1 && dispatch({
					type: "op",
					op: {
						op: "closeTab",
						tab: tab.id
					}
				}),
				children: [/* @__PURE__ */ jsx("span", {
					className: "eb-tab-icon",
					"aria-hidden": "true",
					children: iconOf(web.map, url)
				}), /* @__PURE__ */ jsx("span", {
					className: "eb-tab-title",
					children: titleOf(web.map, url)
				})]
			}), /* @__PURE__ */ jsx("button", {
				type: "button",
				className: "eb-tab-close",
				"aria-label": `Закрити вкладку «${titleOf(web.map, url)}»`,
				title: "Закрити вкладку (Ctrl+W)",
				onClick: () => dispatch({
					type: "op",
					op: {
						op: "closeTab",
						tab: tab.id
					}
				}),
				children: "✕"
			})]
		}, tab.id);
	}), /* @__PURE__ */ jsx("button", {
		type: "button",
		className: "eb-tab-new",
		"aria-label": "Нова вкладка",
		title: "Нова вкладка (Ctrl+T)",
		onClick: () => dispatch({
			type: "op",
			op: { op: "newTab" }
		}),
		children: "+"
	})]
});
var shownAddress = (url) => url === "about:newtab" ? "" : url;
/** What the lock icon says about the page. */
var security = (web, url) => {
	if (url === "about:newtab") return null;
	const r = resolve(web.map, url);
	if (r.kind === "noSite") return {
		icon: "⚠️",
		label: "Сайт не знайдено",
		safe: false
	};
	if (r.kind === "newTab") return null;
	if (!r.site.secure) return {
		icon: "⚠️",
		label: "Не захищено",
		safe: false
	};
	return {
		icon: "🔒",
		label: "З'єднання захищене (https)",
		safe: true
	};
};
/** The address bar: shows where the student is, takes an address or a search. The star bookmarks the page. */
var AddressBar = ({ web, url, bookmarked, inputRef, onGo, onStar }) => {
	const [text, setText] = useState(shownAddress(url));
	const [editing, setEditing] = useState(false);
	useEffect(() => {
		setText(shownAddress(url));
		setEditing(false);
	}, [url]);
	const submit = (e) => {
		e.preventDefault();
		const typed = text.trim();
		if (typed.length === 0) return;
		inputRef.current?.blur();
		setEditing(false);
		onGo(looksLikeAddress(typed) ? canonicalUrl(web.map, typed) : searchUrl(typed));
	};
	const lock = security(web, url);
	return /* @__PURE__ */ jsxs("form", {
		className: `eb-address${editing ? " is-editing" : ""}`,
		onSubmit: submit,
		role: "search",
		"aria-label": "Адресний рядок",
		children: [
			lock && !editing && /* @__PURE__ */ jsxs("span", {
				className: `eb-lock${lock.safe ? "" : " is-unsafe"}`,
				title: lock.label,
				role: "img",
				"aria-label": lock.label,
				children: [/* @__PURE__ */ jsx("span", {
					"aria-hidden": "true",
					children: lock.icon
				}), !lock.safe && /* @__PURE__ */ jsx("span", {
					className: "eb-lock-text",
					"aria-hidden": "true",
					children: lock.label
				})]
			}),
			/* @__PURE__ */ jsx("input", {
				ref: inputRef,
				className: "eb-address-input",
				value: text,
				onChange: (e) => setText(e.target.value),
				onFocus: (e) => {
					setEditing(true);
					e.target.select();
				},
				onBlur: () => {
					setEditing(false);
					setText(shownAddress(url));
				},
				onKeyDown: (e) => {
					if (e.key === "Escape") {
						setText(shownAddress(url));
						e.currentTarget.blur();
					}
				},
				placeholder: "Шукай або введи адресу",
				"aria-label": "Адреса сторінки",
				spellCheck: false,
				autoCapitalize: "off",
				autoCorrect: "off",
				autoComplete: "off",
				enterKeyHint: "go"
			}),
			url !== "about:newtab" && !editing && /* @__PURE__ */ jsx("button", {
				type: "button",
				className: `eb-star${bookmarked ? " is-on" : ""}`,
				onClick: onStar,
				"aria-label": bookmarked ? "Змінити закладку" : "Додати в закладки",
				title: bookmarked ? "Змінити закладку" : "Додати в закладки (Ctrl+D)",
				children: bookmarked ? "★" : "☆"
			})
		]
	});
};
/** The «⋮» menu: search on the page and the zoom, as in a desktop browser. Not in the large mode. */
var MoreMenu = ({ zoom, dispatch }) => {
	const [open, setOpen] = useState(false);
	const setZoom = (level) => dispatch({
		type: "op",
		op: {
			op: "zoom",
			level
		}
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "eb-more",
		children: [/* @__PURE__ */ jsx("button", {
			type: "button",
			className: "eb-tool",
			"aria-haspopup": "menu",
			"aria-expanded": open,
			onClick: () => setOpen((o) => !o),
			"aria-label": "Меню",
			title: "Меню",
			children: "⋮"
		}), open && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("div", {
			className: "eb-backdrop",
			onPointerDown: () => setOpen(false)
		}), /* @__PURE__ */ jsxs("div", {
			className: "eb-menu eb-more-menu",
			role: "menu",
			"aria-label": "Меню",
			children: [/* @__PURE__ */ jsxs("button", {
				type: "button",
				role: "menuitem",
				onClick: () => {
					setOpen(false);
					dispatch({
						type: "findBar",
						open: true
					});
				},
				children: ["🔍 Знайти на сторінці ", /* @__PURE__ */ jsx("kbd", { children: "Ctrl+F" })]
			}), /* @__PURE__ */ jsxs("div", {
				className: "eb-zoom-row",
				role: "group",
				"aria-label": "Масштаб",
				children: [
					/* @__PURE__ */ jsx("span", { children: "Масштаб" }),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						role: "menuitem",
						onClick: () => setZoom(nextZoom(zoom, -1)),
						disabled: zoom === nextZoom(zoom, -1),
						"aria-label": "Зменшити масштаб",
						title: "Зменшити (Ctrl −)",
						children: "−"
					}),
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						role: "menuitem",
						onClick: () => setZoom(100),
						"aria-label": `Масштаб ${zoom} %, повернути 100 %`,
						title: "Повернути 100 % (Ctrl+0)",
						children: [zoom, " %"]
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						role: "menuitem",
						onClick: () => setZoom(nextZoom(zoom, 1)),
						disabled: zoom === nextZoom(zoom, 1),
						"aria-label": "Збільшити масштаб",
						title: "Збільшити (Ctrl +)",
						children: "+"
					})
				]
			})]
		})] })]
	});
};
var Toolbar = ({ web, browser, tab, large, addressRef, dispatch, full, onFull }) => {
	const url = currentUrl(tab);
	const bookmarked = browser.bookmarks.some((b) => b.url === url);
	const panel = (p) => dispatch({
		type: "panel",
		panel: p
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "eb-toolbar",
		children: [
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "eb-tool",
				disabled: tab.index === 0,
				onClick: () => dispatch({
					type: "op",
					op: { op: "back" }
				}),
				"aria-label": "Назад",
				title: "Назад (Alt+←)",
				children: "←"
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "eb-tool eb-forward",
				disabled: tab.index >= tab.stack.length - 1,
				onClick: () => dispatch({
					type: "op",
					op: { op: "forward" }
				}),
				"aria-label": "Вперед",
				title: "Вперед (Alt+→)",
				children: "→"
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "eb-tool eb-reload",
				onClick: () => dispatch({
					type: "op",
					op: { op: "reload" }
				}),
				"aria-label": "Оновити",
				title: "Оновити (F5)",
				children: "⟳"
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "eb-tool eb-home",
				onClick: () => dispatch({
					type: "op",
					op: {
						op: "navigate",
						url: browser.home,
						how: "home"
					}
				}),
				"aria-label": "Домашня сторінка",
				title: "Домашня сторінка",
				children: "🏠"
			}),
			/* @__PURE__ */ jsx(AddressBar, {
				web,
				url,
				bookmarked,
				inputRef: addressRef,
				onGo: (to) => dispatch({
					type: "op",
					op: {
						op: "navigate",
						url: to,
						how: "typed"
					}
				}),
				onStar: () => dispatch({
					type: "bookmarkDialog",
					open: true
				})
			}),
			browser.zoom !== 100 && /* @__PURE__ */ jsxs("button", {
				type: "button",
				className: "eb-zoom-badge",
				onClick: () => dispatch({
					type: "op",
					op: {
						op: "zoom",
						level: 100
					}
				}),
				"aria-label": `Масштаб ${browser.zoom} %. Повернути 100 %`,
				title: "Повернути 100 % (Ctrl+0)",
				children: [
					"🔍 ",
					browser.zoom,
					" %"
				]
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "eb-tool eb-tabs-count",
				onClick: () => panel("tabs"),
				"aria-label": `Вкладки: ${browser.tabs.length}`,
				title: "Усі вкладки",
				children: /* @__PURE__ */ jsx("span", { children: browser.tabs.length })
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "eb-tool",
				onClick: () => panel("history"),
				"aria-label": "Історія",
				title: "Історія (Ctrl+H)",
				children: "🕘"
			}),
			browser.downloads.length > 0 && /* @__PURE__ */ jsx("button", {
				type: "button",
				className: "eb-tool",
				onClick: () => panel("downloads"),
				"aria-label": "Завантаження",
				title: "Завантаження",
				children: "⬇"
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "eb-tool eb-adult",
				onClick: () => dispatch({
					type: "op",
					op: { op: "callAdult" }
				}),
				"aria-label": "Покликати дорослого",
				title: "Покликати дорослого",
				children: "🙋"
			}),
			!large && /* @__PURE__ */ jsx("button", {
				type: "button",
				className: "eb-tool",
				onClick: () => panel("bookmarks"),
				"aria-label": "Менеджер закладок",
				title: "Менеджер закладок",
				children: "📑"
			}),
			!large && /* @__PURE__ */ jsx(MoreMenu, {
				zoom: browser.zoom,
				dispatch
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "eb-tool eb-full",
				onClick: onFull,
				"aria-label": full ? "Вийти з повного екрана" : "На весь екран",
				title: full ? "Вийти з повного екрана" : "На весь екран",
				children: full ? "🗗" : "⛶"
			})
		]
	});
};
// src/ui/FindBar.tsx
/** Highlight names for the CSS Custom Highlight API: every match, and the one in focus. */
var ALL = "eb-find";
var CURRENT = "eb-find-current";
/** Older browsers have no highlights: the bar still counts and scrolls to the matches. */
var canHighlight = () => typeof Highlight !== "undefined" && typeof CSS !== "undefined" && "highlights" in CSS;
var clearHighlights = () => {
	if (!canHighlight()) return;
	CSS.highlights.delete(ALL);
	CSS.highlights.delete(CURRENT);
};
/** Ranges of every match of `query` in the text under `root`, ignoring case. The page is not changed. */
var findRanges = (root, query) => {
	const needle = query.trim().toLocaleLowerCase("uk");
	if (needle.length === 0) return [];
	const ranges = [];
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
		const text = (node.nodeValue ?? "").toLocaleLowerCase("uk");
		for (let at = text.indexOf(needle); at >= 0; at = text.indexOf(needle, at + needle.length)) {
			const range = document.createRange();
			range.setStart(node, at);
			range.setEnd(node, at + needle.length);
			ranges.push(range);
		}
	}
	return ranges;
};
/** «Знайти на сторінці» (Ctrl+F): a field under the toolbar that highlights the words on the page. */
var FindBar = ({ pageRef, pageKey, onSearch, onClose }) => {
	const [text, setText] = useState("");
	const [ranges, setRanges] = useState([]);
	const [current, setCurrent] = useState(0);
	const logged = useRef("");
	const inputRef = useRef(null);
	useEffect(() => {
		inputRef.current?.focus();
		return clearHighlights;
	}, []);
	useEffect(() => {
		const id = window.requestAnimationFrame(() => {
			const root = pageRef.current;
			setRanges(root ? findRanges(root, text) : []);
			setCurrent(0);
		});
		return () => window.cancelAnimationFrame(id);
	}, [
		text,
		pageKey,
		pageRef
	]);
	useEffect(() => {
		if (!canHighlight()) return;
		const focus = ranges[current];
		CSS.highlights.set(ALL, new Highlight(...ranges));
		if (focus) CSS.highlights.set(CURRENT, new Highlight(focus));
		else CSS.highlights.delete(CURRENT);
		focus?.startContainer.parentElement?.scrollIntoView({ block: "center" });
	}, [ranges, current]);
	const move = (delta) => {
		if (ranges.length > 0) setCurrent((c) => (c + delta + ranges.length) % ranges.length);
	};
	const submit = (e) => {
		e.preventDefault();
		const words = text.trim();
		if (words.length === 0) return;
		if (words !== logged.current) {
			logged.current = words;
			onSearch(words);
		} else move(1);
	};
	const query = text.trim();
	return /* @__PURE__ */ jsxs("form", {
		className: "eb-findbar",
		role: "search",
		onSubmit: submit,
		children: [
			/* @__PURE__ */ jsx("input", {
				ref: inputRef,
				type: "search",
				value: text,
				onChange: (e) => setText(e.target.value),
				onKeyDown: (e) => {
					if (e.key === "Escape") {
						e.stopPropagation();
						onClose();
					}
				},
				placeholder: "Знайти на сторінці",
				"aria-label": "Знайти на сторінці",
				maxLength: 60,
				enterKeyHint: "search",
				autoComplete: "off"
			}),
			/* @__PURE__ */ jsx("span", {
				className: "eb-findbar-count",
				role: "status",
				children: query.length === 0 ? "" : ranges.length === 0 ? "Немає збігів" : `${current + 1} з ${ranges.length}`
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "eb-tool",
				onClick: () => move(-1),
				disabled: ranges.length < 2,
				"aria-label": "Попередній збіг",
				title: "Попередній збіг",
				children: "↑"
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "eb-tool",
				onClick: () => move(1),
				disabled: ranges.length < 2,
				"aria-label": "Наступний збіг",
				title: "Наступний збіг (Enter)",
				children: "↓"
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "eb-tool",
				onClick: onClose,
				"aria-label": "Закрити пошук на сторінці",
				title: "Закрити (Esc)",
				children: "✕"
			})
		]
	});
};
// src/ui/fullscreen.ts
/** While the trainer covers the page, the page under it does not scroll. */
var PAGE_FULL_CLASS = "eb-page-full";
/**
* Set when «Наступне завдання» leaves a trainer in full screen: the trainer of the next exercise, mounted right
* after it, opens in full screen too, so the student does not drop back to the page between exercises.
*/
var carryFull = false;
/**
* Full screen for the trainer. The trainer covers the page (a fixed layer), so it works on an iPhone too, and
* where the browser can, the page goes to the browser's full screen as well. The button leaves it; so does Esc
* where the browser has its own full screen. The trainer keeps Esc for itself otherwise (closing a menu,
* cancelling a rename), so the same key does not also fold the trainer.
*/
var useFullScreen = () => {
	const [full, setFull] = useState(() => carryFull);
	useEffect(() => {
		carryFull = false;
	}, []);
	const leave = useCallback(() => {
		setFull(false);
		if (document.fullscreenElement) document.exitFullscreen().catch(() => void 0);
	}, []);
	const enter = useCallback(() => {
		setFull(true);
		const page = document.documentElement;
		if (typeof page.requestFullscreen === "function" && document.fullscreenEnabled && !document.fullscreenElement) page.requestFullscreen().catch(() => void 0);
	}, []);
	useEffect(() => {
		if (!full) return void 0;
		const page = document.documentElement;
		page.classList.add(PAGE_FULL_CLASS);
		const onChange = () => {
			if (!document.fullscreenElement) setFull(false);
		};
		document.addEventListener("fullscreenchange", onChange);
		return () => {
			page.classList.remove(PAGE_FULL_CLASS);
			document.removeEventListener("fullscreenchange", onChange);
		};
	}, [full]);
	const isFull = useRef(full);
	isFull.current = full;
	const handedOver = useRef(false);
	useEffect(() => () => {
		if (handedOver.current) return;
		if (isFull.current && document.fullscreenElement) document.exitFullscreen().catch(() => void 0);
	}, []);
	/** Call right before the page swaps this trainer for the next exercise. */
	const handOver = useCallback(() => {
		handedOver.current = isFull.current;
		carryFull = isFull.current;
	}, []);
	return {
		full,
		toggle: full ? leave : enter,
		handOver
	};
};
// src/ui/keys.ts
/**
* The browser shortcuts from the textbooks. Letters are read from `code`, so they work in the Ukrainian
* layout too (Ctrl+Т is still Ctrl+T). The real browser keeps Ctrl+T and Ctrl+W for itself in most cases;
* the buttons do the same.
*/
var commandFor = (k) => {
	if (k.key === "Escape") return "escape";
	if (k.key === "F5") return "reload";
	if (k.alt && !k.ctrl && k.key === "ArrowLeft") return "back";
	if (k.alt && !k.ctrl && k.key === "ArrowRight") return "forward";
	if (!k.ctrl || k.alt) return null;
	if (k.key === "Tab") return k.shift ? "prevTab" : "nextTab";
	if (k.key === "+") return "zoomIn";
	switch (k.code) {
		case "KeyF": return "find";
		case "Equal":
		case "NumpadAdd": return "zoomIn";
		case "Minus":
		case "NumpadSubtract": return "zoomOut";
		case "Digit0":
		case "Numpad0": return "zoomReset";
		case "KeyT": return "newTab";
		case "KeyW": return "closeTab";
		case "KeyH": return "history";
		case "KeyD": return "bookmark";
		case "KeyL": return "address";
		case "KeyR": return "reload";
		default: return null;
	}
};
// src/ui/Interactive.tsx
/** A form asks for data. Nothing is sent anywhere and nothing typed is kept: only the press is recorded. */
/** A field the browser hides while typing, as for a password. */
var isSecret = (field) => /пароль/i.test(field);
var FormBlock = ({ id, title, fields, button, sentText, actions }) => {
	const sent = actions.submitted.includes(id);
	const submit = (e) => {
		e.preventDefault();
		actions.submit(id);
	};
	if (sent) return /* @__PURE__ */ jsx("div", {
		className: `eb-form is-sent${sentText === void 0 ? "" : " is-safe"}`,
		role: "status",
		children: sentText ?? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("b", { children: "Дані надіслано." }), " Тепер їх знають незнайомі люди, і забрати їх назад уже не можна."] })
	});
	return /* @__PURE__ */ jsxs("form", {
		className: "eb-form",
		onSubmit: submit,
		autoComplete: "off",
		children: [
			/* @__PURE__ */ jsx("h2", { children: title }),
			fields.map((field) => /* @__PURE__ */ jsxs("label", { children: [/* @__PURE__ */ jsx("span", { children: field }), /* @__PURE__ */ jsx("input", {
				name: field,
				type: isSecret(field) ? "password" : "text",
				autoComplete: "off"
			})] }, field)),
			/* @__PURE__ */ jsx("button", {
				type: "submit",
				className: "eb-form-send",
				children: button
			})
		]
	});
};
/** A chat with scripted messages. What the student writes stays on their screen only. */
var ChatBlock = ({ id, title, messages, reply, actions }) => {
	const [text, setText] = useState("");
	const [mine, setMine] = useState([]);
	const [reported, setReported] = useState(false);
	const send = (e) => {
		e.preventDefault();
		if (text.trim().length === 0) return;
		setMine([...mine, text.trim()]);
		setText("");
		actions.submit(id);
	};
	return /* @__PURE__ */ jsxs("section", {
		className: "eb-chat",
		"aria-label": title,
		children: [
			/* @__PURE__ */ jsxs("h2", { children: ["💬 ", title] }),
			/* @__PURE__ */ jsxs("ul", {
				className: "eb-chat-log",
				children: [
					messages.map((m, i) => /* @__PURE__ */ jsxs("li", { children: [
						/* @__PURE__ */ jsxs("b", { children: [m.from, ":"] }),
						" ",
						m.text
					] }, i)),
					mine.map((m, i) => /* @__PURE__ */ jsxs("li", {
						className: "is-mine",
						children: [
							/* @__PURE__ */ jsx("b", { children: "Ти:" }),
							" ",
							m
						]
					}, `me${i}`)),
					mine.length > 0 && reply !== void 0 && /* @__PURE__ */ jsxs("li", { children: [
						/* @__PURE__ */ jsxs("b", { children: [messages.at(-1)?.from ?? "?", ":"] }),
						" ",
						reply
					] }),
					reported && /* @__PURE__ */ jsx("li", {
						className: "is-system",
						children: "Скаргу надіслано. Модератор перевірить повідомлення."
					})
				]
			}),
			/* @__PURE__ */ jsxs("form", {
				className: "eb-chat-send",
				onSubmit: send,
				children: [/* @__PURE__ */ jsx("input", {
					value: text,
					onChange: (e) => setText(e.target.value),
					placeholder: "Напиши повідомлення…",
					"aria-label": "Повідомлення",
					autoComplete: "off"
				}), /* @__PURE__ */ jsx("button", {
					type: "submit",
					className: "eb-btn",
					children: "Надіслати"
				})]
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "eb-btn eb-chat-report",
				disabled: reported,
				onClick: () => {
					setReported(true);
					actions.report(id);
				},
				children: "🚩 Поскаржитися"
			})
		]
	});
};
var DownloadBlock = ({ file, label, size, actions }) => /* @__PURE__ */ jsxs("div", {
	className: "eb-download",
	children: [
		/* @__PURE__ */ jsx("span", {
			className: "eb-download-icon",
			"aria-hidden": "true",
			children: "📦"
		}),
		/* @__PURE__ */ jsxs("span", {
			className: "eb-download-name",
			children: [file, /* @__PURE__ */ jsx("small", { children: size })]
		}),
		/* @__PURE__ */ jsxs("button", {
			type: "button",
			className: "eb-btn is-primary",
			onClick: () => actions.download(file),
			children: ["⬇ ", label]
		})
	]
});
/** A window over the page. It blocks the page until the student chooses. */
var PopupWindow = ({ popup, onAccept, onClose }) => /* @__PURE__ */ jsx("div", {
	className: "eb-popup-layer",
	children: /* @__PURE__ */ jsxs("div", {
		className: "eb-popup",
		role: "alertdialog",
		"aria-modal": "true",
		"aria-labelledby": `eb-popup-${popup.spec.id}`,
		children: [
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "eb-popup-x",
				"aria-label": "Закрити вікно",
				onClick: onClose,
				children: "✕"
			}),
			popup.spec.icon && /* @__PURE__ */ jsx("div", {
				className: "eb-popup-icon",
				"aria-hidden": "true",
				children: popup.spec.icon
			}),
			/* @__PURE__ */ jsx("h2", {
				id: `eb-popup-${popup.spec.id}`,
				children: popup.spec.title
			}),
			/* @__PURE__ */ jsx("p", { children: popup.spec.text }),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				className: "eb-popup-accept",
				onClick: onAccept,
				children: popup.spec.accept
			}),
			popup.spec.decline && /* @__PURE__ */ jsx("button", {
				type: "button",
				className: "eb-popup-decline",
				onClick: onClose,
				children: popup.spec.decline
			})
		]
	})
});
/** The antivirus stops a dangerous file and asks what to do. */
var AntivirusDialog = ({ item, onDelete, onOpen }) => /* @__PURE__ */ jsx("div", {
	className: "eb-popup-layer",
	children: /* @__PURE__ */ jsxs("div", {
		className: "eb-antivirus",
		role: "alertdialog",
		"aria-modal": "true",
		"aria-labelledby": "eb-av-title",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "eb-antivirus-head",
				children: "🛡️ Антивірус"
			}),
			/* @__PURE__ */ jsx("h2", {
				id: "eb-av-title",
				children: "Знайдено загрозу!"
			}),
			/* @__PURE__ */ jsxs("p", { children: [
				"У файлі ",
				/* @__PURE__ */ jsx("b", { children: item.file }),
				" є вірус. Він може зіпсувати комп'ютер або вкрасти твої дані."
			] }),
			/* @__PURE__ */ jsxs("div", {
				className: "eb-dialog-actions",
				children: [/* @__PURE__ */ jsx("button", {
					type: "button",
					className: "eb-btn",
					onClick: onOpen,
					children: "Відкрити все одно"
				}), /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "eb-btn is-primary",
					onClick: onDelete,
					children: "Видалити файл"
				})]
			})
		]
	})
});
var STATUS_TEXT = {
	done: "Завантажено",
	warned: "⚠️ Знайдено вірус",
	deleted: "Видалено",
	opened: "⚠️ Відкрито"
};
var DownloadsPanelBody = ({ downloads, onDelete }) => /* @__PURE__ */ jsxs("div", {
	className: "eb-panel-body",
	children: [downloads.length === 0 && /* @__PURE__ */ jsx("p", {
		className: "eb-muted",
		children: "Ти ще нічого не завантажував."
	}), /* @__PURE__ */ jsx("ul", {
		className: "eb-rows",
		children: [...downloads].reverse().map((d) => /* @__PURE__ */ jsxs("li", {
			className: "eb-row",
			children: [
				/* @__PURE__ */ jsx("span", {
					className: "eb-row-icon",
					"aria-hidden": "true",
					children: "📦"
				}),
				/* @__PURE__ */ jsxs("span", {
					className: "eb-row-main",
					children: [/* @__PURE__ */ jsx("span", {
						className: `eb-row-title${d.status === "deleted" ? " is-deleted" : ""}`,
						children: d.file
					}), /* @__PURE__ */ jsxs("span", {
						className: "eb-row-url",
						children: [
							STATUS_TEXT[d.status],
							" · ",
							d.from
						]
					})]
				}),
				d.status !== "deleted" && /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "eb-icon-btn",
					"aria-label": `Видалити «${d.file}»`,
					title: "Видалити файл",
					onClick: () => onDelete(d.id),
					children: "🗑"
				})
			]
		}, d.id))
	})]
});
// src/ui/links.ts
/** Hold a finger this long on a link to get its menu, as on a phone. */
var LONG_PRESS_MS = 550;
/** A finger that moves farther than this scrolls the page instead. */
var MOVE_PX = 10;
var pressTimer;
var pressStart = null;
/** A long press opened the menu: the click that follows it must not also follow the link. */
var swallowClick = false;
var cancelPress = () => {
	window.clearTimeout(pressTimer);
	pressStart = null;
};
/**
* Props for a link of a made-up page: a click follows it, Ctrl+click or the middle button opens it
* in a new tab, the right button or a long press shows «Відкрити в новій вкладці».
*/
var linkProps = (url, handlers) => ({
	href: `#${url}`,
	onClick: (e) => {
		e.preventDefault();
		if (swallowClick) {
			swallowClick = false;
			return;
		}
		if (e.ctrlKey || e.metaKey) handlers.openInNewTab(url);
		else handlers.open(url);
	},
	onAuxClick: (e) => {
		if (e.button !== 1) return;
		e.preventDefault();
		handlers.openInNewTab(url);
	},
	onContextMenu: (e) => {
		e.preventDefault();
		cancelPress();
		handlers.menu(url, e.clientX, e.clientY);
	},
	onPointerDown: (e) => {
		if (e.pointerType === "mouse") return;
		cancelPress();
		swallowClick = false;
		pressStart = {
			x: e.clientX,
			y: e.clientY
		};
		const { clientX, clientY } = e;
		pressTimer = window.setTimeout(() => {
			swallowClick = true;
			pressStart = null;
			handlers.menu(url, clientX, clientY);
		}, LONG_PRESS_MS);
	},
	onPointerMove: (e) => {
		if (pressStart && Math.hypot(e.clientX - pressStart.x, e.clientY - pressStart.y) > MOVE_PX) cancelPress();
	},
	onPointerUp: cancelPress,
	onPointerCancel: cancelPress
});
// src/ui/PageView.tsx
var Link = ({ url, links, children, className }) => /* @__PURE__ */ jsx("a", {
	className: `eb-link${className ? ` ${className}` : ""}`,
	...linkProps(url, links),
	children
});
var Text = ({ text, base, links }) => /* @__PURE__ */ jsx(Fragment, { children: splitLinks(text).map((part, i) => typeof part === "string" ? /* @__PURE__ */ jsx("span", { children: part }, i) : /* @__PURE__ */ jsx(Link, {
	url: absoluteUrl(base, part.url),
	links,
	children: part.text
}, i)) });
var SearchForm = ({ initial, onSearch, big }) => {
	const [query, setQuery] = useState(initial);
	const submit = (e) => {
		e.preventDefault();
		if (query.trim().length > 0) onSearch(query);
	};
	return /* @__PURE__ */ jsxs("form", {
		className: `eb-search${big ? " is-big" : ""}`,
		role: "search",
		onSubmit: submit,
		children: [/* @__PURE__ */ jsx("input", {
			type: "search",
			value: query,
			onChange: (e) => setQuery(e.target.value),
			placeholder: "Що шукаємо?",
			"aria-label": "Пошуковий запит",
			enterKeyHint: "search",
			autoComplete: "off"
		}), /* @__PURE__ */ jsx("button", {
			type: "submit",
			children: "Знайти"
		})]
	});
};
var SearchBlock = ({ web, query, links, onSearch }) => {
	const hits = query.length > 0 ? search(web.list, query) : [];
	return /* @__PURE__ */ jsxs("div", {
		className: "eb-search-page",
		children: [
			query.length === 0 && /* @__PURE__ */ jsx("div", {
				className: "eb-search-logo",
				children: "🔎 Пошук"
			}),
			/* @__PURE__ */ jsx(SearchForm, {
				initial: query,
				onSearch,
				big: query.length === 0
			}, query),
			query.length > 0 && (hits.length === 0 ? /* @__PURE__ */ jsxs("p", {
				className: "eb-muted",
				children: [
					"За запитом «",
					query,
					"» нічого не знайдено. Спробуй інші ключові слова."
				]
			}) : /* @__PURE__ */ jsx("ol", {
				className: "eb-hits",
				children: hits.map((hit) => /* @__PURE__ */ jsxs("li", {
					className: hit.ad ? "is-ad" : void 0,
					children: [
						/* @__PURE__ */ jsxs("span", {
							className: "eb-hit-site",
							children: [
								hit.ad && /* @__PURE__ */ jsx("span", {
									className: "eb-ad-mark",
									children: "Реклама"
								}),
								/* @__PURE__ */ jsx("span", {
									"aria-hidden": "true",
									children: hit.site.icon
								}),
								" ",
								hit.site.name,
								" ·",
								" ",
								/* @__PURE__ */ jsxs("span", {
									className: `eb-hit-url${hit.site.secure ? "" : " is-unsafe"}`,
									children: [hit.site.secure ? "🔒 " : "⚠️ ", hit.url]
								})
							]
						}),
						/* @__PURE__ */ jsx(Link, {
							url: hit.url,
							links,
							className: "eb-hit-title",
							children: hit.title
						}),
						hit.snippet.length > 0 && /* @__PURE__ */ jsx("p", { children: hit.snippet })
					]
				}, hit.url))
			}))
		]
	});
};
var BlockView = ({ block, base, web, query, links, onSearch, actions }) => {
	switch (block.type) {
		case "heading": return /* @__PURE__ */ jsx("h1", {
			className: "eb-h",
			children: block.text
		});
		case "text": return /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx(Text, {
			text: block.text,
			base,
			links
		}) });
		case "note": return /* @__PURE__ */ jsx("p", {
			className: "eb-note",
			children: /* @__PURE__ */ jsx(Text, {
				text: block.text,
				base,
				links
			})
		});
		case "fine": return /* @__PURE__ */ jsx("p", {
			className: "eb-fine",
			children: block.text
		});
		case "photo": return /* @__PURE__ */ jsxs("figure", {
			className: "eb-photo",
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "eb-photo-art",
					style: { background: block.bg ?? "#e2e8f0" },
					role: "img",
					"aria-label": block.caption,
					children: block.art
				}),
				/* @__PURE__ */ jsxs("figcaption", { children: [
					block.caption,
					/* @__PURE__ */ jsxs("span", {
						className: "eb-author",
						children: ["Фото: ", block.author]
					}),
					block.license && /* @__PURE__ */ jsxs("span", {
						className: "eb-license",
						children: ["Ліцензія: ", block.license]
					})
				] }),
				block.file !== void 0 && /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "eb-btn eb-photo-save",
					onClick: () => block.file !== void 0 && actions.download(block.file),
					children: "⬇ Завантажити фото"
				})
			]
		});
		case "links": return /* @__PURE__ */ jsxs("nav", {
			className: "eb-links",
			"aria-label": block.title ?? "Посилання",
			children: [block.title && /* @__PURE__ */ jsx("h2", { children: block.title }), /* @__PURE__ */ jsx("ul", { children: block.items.map((item) => /* @__PURE__ */ jsxs("li", { children: [/* @__PURE__ */ jsx(Link, {
				url: absoluteUrl(base, item.url),
				links,
				children: item.text
			}), item.note && /* @__PURE__ */ jsx("small", { children: item.note })] }, item.url)) })]
		});
		case "list": return /* @__PURE__ */ jsx("ul", {
			className: "eb-list",
			children: block.items.map((item) => /* @__PURE__ */ jsx("li", { children: item }, item))
		});
		case "table": return /* @__PURE__ */ jsx("div", {
			className: "eb-table-wrap",
			children: /* @__PURE__ */ jsxs("table", {
				className: "eb-table",
				children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { children: block.head.map((h) => /* @__PURE__ */ jsx("th", { children: h }, h)) }) }), /* @__PURE__ */ jsx("tbody", { children: block.rows.map((row) => /* @__PURE__ */ jsx("tr", { children: row.map((cell, i) => /* @__PURE__ */ jsx("td", { children: cell }, i)) }, row.join("|"))) })]
			})
		});
		case "banner": return /* @__PURE__ */ jsx(Link, {
			url: absoluteUrl(base, block.url),
			links,
			className: "eb-banner",
			children: block.text
		});
		case "search": return /* @__PURE__ */ jsx(SearchBlock, {
			web,
			query,
			links,
			onSearch
		});
		case "form": return /* @__PURE__ */ jsx(FormBlock, {
			id: block.id,
			title: block.title,
			fields: block.fields,
			button: block.button,
			sentText: block.sent,
			actions
		});
		case "chat": return /* @__PURE__ */ jsx(ChatBlock, {
			id: block.id,
			title: block.title,
			messages: block.messages,
			reply: block.reply,
			actions
		});
		case "download": return /* @__PURE__ */ jsx(DownloadBlock, {
			file: block.file,
			label: block.label,
			size: block.size,
			actions
		});
	}
};
var SiteHeader = ({ site, links }) => /* @__PURE__ */ jsxs("header", {
	className: "eb-site-head",
	style: { background: site.color },
	children: [/* @__PURE__ */ jsxs(Link, {
		url: site.host,
		links,
		className: "eb-site-name",
		children: [
			/* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				children: site.icon
			}),
			" ",
			site.name
		]
	}), site.nav && /* @__PURE__ */ jsx("nav", {
		"aria-label": "Меню сайту",
		children: site.nav.map((item) => /* @__PURE__ */ jsx(Link, {
			url: absoluteUrl(site.host, item.url),
			links,
			children: item.text
		}, item.url))
	})]
});
var NewTabPage = ({ web, links, onSearch }) => /* @__PURE__ */ jsxs("div", {
	className: "eb-newtab",
	children: [
		/* @__PURE__ */ jsx("div", {
			className: "eb-search-logo",
			children: "🔎 Пошук"
		}),
		/* @__PURE__ */ jsx(SearchForm, {
			initial: "",
			onSearch,
			big: true
		}),
		/* @__PURE__ */ jsx("ul", {
			className: "eb-tiles",
			"aria-label": "Часто відвідувані сайти",
			children: tileSites(web.list).map((site) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link, {
				url: site.host,
				links,
				className: "eb-tile",
				children: [/* @__PURE__ */ jsx("span", {
					className: "eb-tile-icon",
					style: { background: site.color },
					"aria-hidden": "true",
					children: site.icon
				}), /* @__PURE__ */ jsx("span", { children: site.name })]
			}) }, site.host))
		})
	]
});
/** The made-up page at `url`, drawn from its blocks. No HTML from data and no network. */
var PageView = ({ web, url, links, onSearch, actions }) => {
	if (url === "about:newtab") return /* @__PURE__ */ jsx(NewTabPage, {
		web,
		links,
		onSearch
	});
	const r = resolve(web.map, url);
	switch (r.kind) {
		case "newTab": return /* @__PURE__ */ jsx(NewTabPage, {
			web,
			links,
			onSearch
		});
		case "noSite": return /* @__PURE__ */ jsxs("div", {
			className: "eb-error",
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "eb-error-icon",
					"aria-hidden": "true",
					children: "🦖"
				}),
				/* @__PURE__ */ jsx("h1", { children: "Не вдається відкрити сайт" }),
				/* @__PURE__ */ jsxs("p", { children: [
					"Сайту ",
					/* @__PURE__ */ jsx("b", { children: r.host }),
					" не знайдено."
				] }),
				/* @__PURE__ */ jsx("p", {
					className: "eb-muted",
					children: "Перевір, чи правильно надруковано адресу: кожна літера і крапка важливі."
				})
			]
		});
		case "noPage": return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(SiteHeader, {
			site: r.site,
			links
		}), /* @__PURE__ */ jsxs("div", {
			className: "eb-error",
			children: [/* @__PURE__ */ jsx("h1", { children: "Сторінку не знайдено" }), /* @__PURE__ */ jsxs("p", {
				className: "eb-muted",
				children: [
					"На сайті ",
					r.site.name,
					" немає сторінки «",
					r.path,
					"». Перейди на ",
					/* @__PURE__ */ jsx(Link, {
						url: r.site.host,
						links,
						children: "головну сторінку сайту"
					}),
					"."
				]
			})]
		})] });
		case "page": return /* @__PURE__ */ jsxs(Fragment, { children: [r.site.host !== "пошук.edu" && /* @__PURE__ */ jsx(SiteHeader, {
			site: r.site,
			links
		}), /* @__PURE__ */ jsx("article", {
			className: "eb-article",
			children: r.page.blocks.map((block, i) => /* @__PURE__ */ jsx(BlockView, {
				block,
				base: r.site.host,
				web,
				query: r.query,
				links,
				onSearch,
				actions
			}, i))
		})] });
	}
};
// src/ui/Panels.tsx
var dayName = (day) => day === 0 ? "Сьогодні" : day === -1 ? "Учора" : `${-day} дні тому`;
/** History: newest first, grouped by day, with a search, «✕» on every entry and «Очистити історію». */
var HistoryPanel = ({ web, browser, dispatch }) => {
	const [query, setQuery] = useState("");
	const [confirm, setConfirm] = useState(false);
	const q = query.trim().toLocaleLowerCase("uk");
	const shown = [...browser.history].reverse().filter((h) => q.length === 0 || `${h.title} ${h.url}`.toLocaleLowerCase("uk").includes(q));
	const days = [...new Set(shown.map((h) => h.day))].sort((a, b) => b - a);
	const byDay = (day) => shown.filter((h) => h.day === day);
	return /* @__PURE__ */ jsxs("div", {
		className: "eb-panel-body",
		children: [
			/* @__PURE__ */ jsx("input", {
				className: "eb-panel-search",
				type: "search",
				value: query,
				onChange: (e) => setQuery(e.target.value),
				placeholder: "Пошук в історії",
				"aria-label": "Пошук в історії"
			}),
			browser.history.length === 0 && /* @__PURE__ */ jsx("p", {
				className: "eb-muted",
				children: "Історія порожня."
			}),
			browser.history.length > 0 && shown.length === 0 && /* @__PURE__ */ jsx("p", {
				className: "eb-muted",
				children: "Нічого не знайдено."
			}),
			days.map((day) => /* @__PURE__ */ jsxs("section", {
				className: "eb-group",
				children: [/* @__PURE__ */ jsx("h3", { children: dayName(day) }), /* @__PURE__ */ jsx("ul", {
					className: "eb-rows",
					children: byDay(day).map((h) => /* @__PURE__ */ jsxs("li", {
						className: "eb-row",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "eb-row-icon",
								"aria-hidden": "true",
								children: iconOf(web.map, h.url)
							}),
							/* @__PURE__ */ jsxs("button", {
								type: "button",
								className: "eb-row-main",
								onClick: () => dispatch({
									type: "op",
									op: {
										op: "navigate",
										url: h.url,
										how: "history"
									}
								}),
								children: [/* @__PURE__ */ jsx("span", {
									className: "eb-row-title",
									children: h.title
								}), /* @__PURE__ */ jsx("span", {
									className: "eb-row-url",
									children: h.url
								})]
							}),
							/* @__PURE__ */ jsx("button", {
								type: "button",
								className: "eb-icon-btn",
								"aria-label": `Видалити з історії «${h.title}»`,
								title: "Видалити з історії",
								onClick: () => dispatch({
									type: "op",
									op: {
										op: "deleteHistory",
										id: h.id
									}
								}),
								children: "✕"
							})
						]
					}, h.id))
				})]
			}, day)),
			browser.history.length > 0 && (confirm ? /* @__PURE__ */ jsxs("div", {
				className: "eb-confirm",
				role: "alertdialog",
				"aria-label": "Очистити історію",
				children: [
					/* @__PURE__ */ jsx("p", { children: "Видалити всю історію? Це не можна скасувати." }),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "eb-btn is-danger",
						onClick: () => {
							dispatch({
								type: "op",
								op: { op: "clearHistory" }
							});
							setConfirm(false);
						},
						children: "Так, очистити"
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "eb-btn",
						onClick: () => setConfirm(false),
						children: "Скасувати"
					})
				]
			}) : /* @__PURE__ */ jsx("button", {
				type: "button",
				className: "eb-btn eb-clear",
				onClick: () => setConfirm(true),
				children: "🧹 Очистити історію"
			}))
		]
	});
};
/** On a phone: every tab as a row. */
var TabsPanel = ({ web, browser, dispatch }) => /* @__PURE__ */ jsxs("div", {
	className: "eb-panel-body",
	children: [/* @__PURE__ */ jsx("ul", {
		className: "eb-rows",
		children: browser.tabs.map((tab) => {
			const url = currentUrl(tab);
			const active = tab.id === browser.activeTab;
			return /* @__PURE__ */ jsxs("li", {
				className: `eb-row${active ? " is-active" : ""}`,
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "eb-row-icon",
						"aria-hidden": "true",
						children: iconOf(web.map, url)
					}),
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						className: "eb-row-main",
						"aria-current": active,
						onClick: () => dispatch({
							type: "op",
							op: {
								op: "switchTab",
								tab: tab.id
							}
						}),
						children: [/* @__PURE__ */ jsx("span", {
							className: "eb-row-title",
							children: titleOf(web.map, url)
						}), /* @__PURE__ */ jsx("span", {
							className: "eb-row-url",
							children: url === "about:newtab" ? "" : url
						})]
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "eb-icon-btn",
						"aria-label": `Закрити вкладку «${titleOf(web.map, url)}»`,
						onClick: () => dispatch({
							type: "op",
							op: {
								op: "closeTab",
								tab: tab.id
							}
						}),
						children: "✕"
					})
				]
			}, tab.id);
		})
	}), /* @__PURE__ */ jsx("button", {
		type: "button",
		className: "eb-btn is-primary",
		onClick: () => dispatch({
			type: "op",
			op: { op: "newTab" }
		}),
		children: "+ Нова вкладка"
	})]
});
var PANEL_TITLES = {
	history: "🕘 Історія",
	bookmarks: "📑 Закладки",
	tabs: "Вкладки",
	downloads: "⬇ Завантаження"
};
var SidePanel = ({ panel, onClose, children }) => /* @__PURE__ */ jsxs("section", {
	className: `eb-panel eb-panel--${panel}`,
	"aria-label": PANEL_TITLES[panel],
	children: [/* @__PURE__ */ jsxs("div", {
		className: "eb-panel-head",
		children: [/* @__PURE__ */ jsx("h2", { children: PANEL_TITLES[panel] }), /* @__PURE__ */ jsx("button", {
			type: "button",
			className: "eb-icon-btn",
			"aria-label": "Закрити панель",
			onClick: onClose,
			children: "✕"
		})]
	}), children]
});
/** Right-click menus: a link, a bookmark on the bar, the bookmarks of a folder. */
var ContextMenu = ({ web, browser, menu, dispatch }) => {
	const close = () => dispatch({
		type: "menu",
		menu: null
	});
	const items = [];
	if (menu.kind === "link") {
		items.push({
			label: "Відкрити",
			run: () => dispatch({
				type: "op",
				op: {
					op: "navigate",
					url: menu.url,
					how: "link"
				}
			})
		});
		items.push({
			label: "Відкрити в новій вкладці",
			run: () => dispatch({
				type: "op",
				op: {
					op: "newTab",
					url: menu.url,
					how: "link"
				}
			})
		});
	}
	if (menu.kind === "bookmark") {
		const b = browser.bookmarks.find((x) => x.id === menu.id);
		if (b) {
			items.push({
				label: "Відкрити",
				run: () => dispatch({
					type: "op",
					op: {
						op: "navigate",
						url: b.url,
						how: "bookmark"
					}
				})
			});
			items.push({
				label: "Відкрити в новій вкладці",
				run: () => dispatch({
					type: "op",
					op: {
						op: "newTab",
						url: b.url,
						how: "bookmark"
					}
				})
			});
			items.push({
				label: "Змінити…",
				run: () => dispatch({
					type: "panel",
					panel: "bookmarks"
				})
			});
			items.push({
				label: "Видалити",
				run: () => dispatch({
					type: "op",
					op: {
						op: "deleteBookmark",
						id: b.id
					}
				})
			});
		}
	}
	if (menu.kind === "folder") {
		const inFolder = browser.bookmarks.filter((b) => b.folder === menu.folder);
		for (const b of inFolder) items.push({
			label: /* @__PURE__ */ jsxs(Fragment, { children: [
				/* @__PURE__ */ jsx("span", {
					"aria-hidden": "true",
					children: iconOf(web.map, b.url)
				}),
				" ",
				b.title
			] }),
			run: () => dispatch({
				type: "op",
				op: {
					op: "navigate",
					url: b.url,
					how: "bookmark"
				}
			})
		});
		if (inFolder.length === 0) items.push({
			label: /* @__PURE__ */ jsx("span", {
				className: "eb-muted",
				children: "Папка порожня"
			}),
			run: close
		});
	}
	const x = Math.min(menu.x, window.innerWidth - 240);
	const y = Math.min(menu.y, window.innerHeight - 44 * items.length - 12);
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("div", {
		className: "eb-backdrop",
		onPointerDown: close,
		onContextMenu: (e) => e.preventDefault()
	}), /* @__PURE__ */ jsx("ul", {
		className: "eb-menu",
		role: "menu",
		style: {
			left: Math.max(8, x),
			top: Math.max(8, y)
		},
		children: items.map((item, i) => /* @__PURE__ */ jsx("li", {
			role: "none",
			children: /* @__PURE__ */ jsx("button", {
				type: "button",
				role: "menuitem",
				onClick: () => {
					close();
					item.run();
				},
				children: item.label
			})
		}, i))
	})] });
};
// src/ui/store.ts
var initialUi = (web, browser, ops = []) => ({
	web,
	browser,
	ops,
	panel: null,
	menu: null,
	bookmarkDialog: false,
	findBar: false,
	message: null,
	results: null,
	reloads: 0,
	resets: 0
});
/** Steps after which the menus and the star dialog close: the page in front changed. */
var MOVES = /* @__PURE__ */ new Set([
	"navigate",
	"back",
	"forward",
	"newTab",
	"closeTab",
	"switchTab"
]);
/** What the trainer says after a step that has no other visible result. */
var FEEDBACK = {
	callAdult: "🙋 Дорослий уже поруч. Молодець: коли щось лякає або дивує, треба розповісти дорослому!",
	openDownload: "😱 Вірус потрапив на комп'ютер! Так робити не можна. Натисни «Почати спочатку» і спробуй ще раз.",
	report: "🚩 Скаргу надіслано модераторам сайту.",
	deleteDownload: "🗑 Файл видалено.",
	download: "⬇ Файл завантажено. Він є в панелі завантажень ⬇ угорі."
};
var applyAll = (state, ops) => {
	let browser = state.browser;
	for (const op of ops) {
		const result = applyOp(state.web, browser, op);
		if (!result.ok) return {
			...state,
			message: result.error,
			menu: null
		};
		browser = result.state;
	}
	const moved = ops.some((op) => MOVES.has(op.op));
	const said = ops.map((op) => FEEDBACK[op.op]).find((m) => m !== void 0);
	return {
		...state,
		message: said ?? state.message,
		browser,
		ops: [...state.ops, ...ops],
		results: null,
		menu: null,
		bookmarkDialog: moved ? false : state.bookmarkDialog,
		panel: moved && state.panel === "tabs" ? null : state.panel,
		reloads: ops.some((op) => op.op === "reload") ? state.reloads + 1 : state.reloads
	};
};
var reducer = (state, action) => {
	switch (action.type) {
		case "op": return applyAll(state, [action.op]);
		case "ops": return applyAll(state, action.ops);
		case "panel": return {
			...state,
			panel: action.panel,
			menu: null,
			bookmarkDialog: false
		};
		case "menu": return {
			...state,
			menu: action.menu
		};
		case "bookmarkDialog": return {
			...state,
			bookmarkDialog: action.open,
			menu: null
		};
		case "findBar": return {
			...state,
			findBar: action.open,
			menu: null
		};
		case "notify": return {
			...state,
			message: action.message
		};
		case "dismiss": return {
			...state,
			message: null
		};
		case "check": return {
			...state,
			results: checkGoals(state.web, state.browser, action.goals),
			menu: null
		};
		case "reset": return {
			...initialUi(state.web, action.browser),
			resets: state.resets + 1
		};
	}
};
// src/ui/Questions.tsx
var Answer = ({ question, saved, dispatch }) => {
	const [text, setText] = useState(saved ?? "");
	const save = (e) => {
		e?.preventDefault();
		if (text.trim() === (saved ?? "") || text.trim().length === 0) return;
		dispatch({
			type: "op",
			op: {
				op: "answer",
				question: question.id,
				text
			}
		});
	};
	const isSaved = saved !== void 0 && text.trim() === saved;
	return /* @__PURE__ */ jsx("form", {
		className: "eb-answer",
		onSubmit: save,
		children: /* @__PURE__ */ jsxs("label", { children: [/* @__PURE__ */ jsx("span", { children: question.text }), /* @__PURE__ */ jsxs("span", {
			className: "eb-answer-row",
			children: [/* @__PURE__ */ jsx("input", {
				value: text,
				onChange: (e) => setText(e.target.value),
				onBlur: () => save(),
				placeholder: question.placeholder,
				maxLength: 80,
				autoComplete: "off"
			}), /* @__PURE__ */ jsx("button", {
				type: "submit",
				className: "eb-btn",
				disabled: isSaved || text.trim().length === 0,
				children: isSaved ? "✓" : "Записати"
			})]
		})] })
	});
};
/** The questions of the task: the student writes what they found on the sites. */
var Questions = ({ questions, answers, dispatch }) => questions.length === 0 ? null : /* @__PURE__ */ jsx("div", {
	className: "eb-questions",
	children: questions.map((q) => /* @__PURE__ */ jsx(Answer, {
		question: q,
		saved: answers[q.id],
		dispatch
	}, q.id))
});
// src/ui/TaskPanel.tsx
/** The task card: what to do, the "Перевірити" button and the result of each condition. */
var TaskPanel = ({ scenario, state, open, onToggle, onReset, dispatch, selfCheck, next, onNext }) => {
	const results = state.results;
	const solved = results !== null && allMet(results);
	return /* @__PURE__ */ jsxs("div", {
		className: `eb-task ${open ? "is-open" : ""}`,
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "eb-task-head",
				children: [/* @__PURE__ */ jsx("h2", { children: scenario.title }), /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "eb-task-hide",
					"aria-label": "Сховати завдання",
					onClick: onToggle,
					children: "✕"
				})]
			}),
			/* @__PURE__ */ jsx("ol", {
				className: "eb-task-steps",
				children: scenario.task.map((step) => /* @__PURE__ */ jsx("li", { children: step }, step))
			}),
			/* @__PURE__ */ jsx(Questions, {
				questions: state.browser.questions,
				answers: state.browser.answers,
				dispatch
			}, state.resets),
			/* @__PURE__ */ jsxs("div", {
				className: "eb-task-actions",
				children: [selfCheck && /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "eb-check",
					onClick: () => dispatch({
						type: "check",
						goals: scenario.goals
					}),
					children: "Перевірити"
				}), /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "eb-reset",
					onClick: onReset,
					children: "Почати спочатку"
				})]
			}),
			results !== null && /* @__PURE__ */ jsxs("div", {
				className: `eb-results ${solved ? "is-solved" : ""}`,
				role: "status",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "eb-results-head",
						children: solved ? "🎉 Молодець! Усе виконано." : `Виконано ${results.filter((r) => r.ok).length} з ${results.length}`
					}),
					/* @__PURE__ */ jsx("ul", { children: results.map((r) => /* @__PURE__ */ jsxs("li", {
						className: r.ok ? "is-ok" : "is-bad",
						children: [
							/* @__PURE__ */ jsx("span", {
								"aria-hidden": "true",
								children: r.ok ? "✅" : "❌"
							}),
							" ",
							r.text,
							!r.ok && /* @__PURE__ */ jsx("small", { children: r.hint })
						]
					}, r.text)) }),
					solved && next !== void 0 && /* @__PURE__ */ jsxs("button", {
						type: "button",
						className: "eb-next",
						onClick: onNext,
						children: [/* @__PURE__ */ jsx("span", { children: "Наступне завдання →" }), /* @__PURE__ */ jsx("small", { children: next.title })]
					})
				]
			})
		]
	});
};
// src/ui/EduBrowser.tsx
var MESSAGE_MS = 4e3;
/** Typing in a field keeps its own keys. */
var isTextField = (target) => target instanceof HTMLElement && (target.isContentEditable || [
	"INPUT",
	"TEXTAREA",
	"SELECT"
].includes(target.tagName));
var startUi = (web, scenario, ops) => {
	const begin = buildState(web, scenario.start);
	const replayed = replay(web, begin, ops);
	return replayed.ok ? initialUi(web, replayed.state, ops) : initialUi(web, begin);
};
/** The whole trainer for one scenario: a browser window with made-up sites and the task card. */
var EduBrowser = ({ scenario, onCheck, onChange, initialOps = [], selfCheck = true, next, web = defaultWeb }) => {
	const [state, dispatch] = useReducer(reducer, null, () => startUi(web, scenario, initialOps));
	const [taskOpen, setTaskOpen] = useState(true);
	const { full, toggle: toggleFull, handOver } = useFullScreen();
	const addressRef = useRef(null);
	const pageRef = useRef(null);
	const rootRef = useRef(null);
	const { browser } = state;
	const tab = activeTabOf(browser);
	const url = tab ? currentUrl(tab) : "";
	const reset = useCallback(() => dispatch({
		type: "reset",
		browser: buildState(web, scenario.start)
	}), [web, scenario]);
	const changed = useRef(onChange);
	useEffect(() => {
		changed.current = onChange;
	});
	useEffect(() => {
		changed.current?.(state.ops);
	}, [state.ops]);
	useEffect(() => {
		if (state.message === null) return;
		const timer = window.setTimeout(() => dispatch({ type: "dismiss" }), MESSAGE_MS);
		return () => window.clearTimeout(timer);
	}, [state.message]);
	useEffect(() => {
		if (state.results !== null) onCheck?.(allMet(state.results));
	}, [state.results, onCheck]);
	useEffect(() => {
		pageRef.current?.scrollTo({ top: 0 });
	}, [url, browser.activeTab]);
	const links = useMemo(() => ({
		open: (to) => dispatch({
			type: "op",
			op: {
				op: "navigate",
				url: to,
				how: "link"
			}
		}),
		openInNewTab: (to) => dispatch({
			type: "op",
			op: {
				op: "newTab",
				url: to,
				how: "link"
			}
		}),
		menu: (to, x, y) => dispatch({
			type: "menu",
			menu: {
				kind: "link",
				x,
				y,
				url: to
			}
		})
	}), []);
	const actions = useMemo(() => ({
		submitted: browser.submitted,
		submit: (form) => dispatch({
			type: "op",
			op: {
				op: "submitForm",
				form
			}
		}),
		report: (form) => dispatch({
			type: "op",
			op: {
				op: "report",
				form
			}
		}),
		download: (file) => dispatch({
			type: "op",
			op: {
				op: "download",
				file
			}
		})
	}), [browser.submitted]);
	const popup = browser.popups.find((p) => p.status === "open");
	const warned = browser.downloads.find((d) => d.status === "warned");
	const onSearch = useCallback((query) => dispatch({
		type: "op",
		op: {
			op: "navigate",
			url: searchUrl(query),
			how: "typed"
		}
	}), []);
	/** Keys belong to the trainer only after a click inside it, so keys elsewhere on the page stay the page's. */
	const focused = useRef(false);
	useEffect(() => {
		const onPointerDown = (e) => {
			focused.current = rootRef.current?.contains(e.target) ?? false;
		};
		const onKeyDown = (e) => {
			if (!focused.current) return;
			const command = commandFor({
				key: e.key,
				code: e.code,
				ctrl: e.ctrlKey || e.metaKey,
				shift: e.shiftKey,
				alt: e.altKey
			});
			if (command === null) return;
			if (command === "escape") {
				if (state.findBar) return dispatch({
					type: "findBar",
					open: false
				});
				if (state.menu || state.bookmarkDialog) dispatch({
					type: "menu",
					menu: null
				});
				if (state.bookmarkDialog) dispatch({
					type: "bookmarkDialog",
					open: false
				});
				else if (state.panel && !isTextField(e.target)) dispatch({
					type: "panel",
					panel: null
				});
				return;
			}
			if (isTextField(e.target) && (command === "back" || command === "forward")) return;
			e.preventDefault();
			const index = browser.tabs.findIndex((t) => t.id === browser.activeTab);
			const neighbour = (d) => browser.tabs[(index + d + browser.tabs.length) % browser.tabs.length]?.id ?? browser.activeTab;
			switch (command) {
				case "newTab": return dispatch({
					type: "op",
					op: { op: "newTab" }
				});
				case "closeTab": return dispatch({
					type: "op",
					op: {
						op: "closeTab",
						tab: browser.activeTab
					}
				});
				case "nextTab": return dispatch({
					type: "op",
					op: {
						op: "switchTab",
						tab: neighbour(1)
					}
				});
				case "prevTab": return dispatch({
					type: "op",
					op: {
						op: "switchTab",
						tab: neighbour(-1)
					}
				});
				case "history": return dispatch({
					type: "panel",
					panel: state.panel === "history" ? null : "history"
				});
				case "bookmark": return url === "about:newtab" ? void 0 : dispatch({
					type: "bookmarkDialog",
					open: true
				});
				case "address":
					addressRef.current?.focus();
					return addressRef.current?.select();
				case "back": return tab && tab.index > 0 ? dispatch({
					type: "op",
					op: { op: "back" }
				}) : void 0;
				case "forward": return tab && tab.index < tab.stack.length - 1 ? dispatch({
					type: "op",
					op: { op: "forward" }
				}) : void 0;
				case "reload": return dispatch({
					type: "op",
					op: { op: "reload" }
				});
				case "find": return dispatch({
					type: "findBar",
					open: true
				});
				case "zoomIn":
				case "zoomOut": {
					const level = nextZoom(browser.zoom, command === "zoomIn" ? 1 : -1);
					return level === browser.zoom ? void 0 : dispatch({
						type: "op",
						op: {
							op: "zoom",
							level
						}
					});
				}
				case "zoomReset": return browser.zoom === 100 ? void 0 : dispatch({
					type: "op",
					op: {
						op: "zoom",
						level: 100
					}
				});
			}
		};
		document.addEventListener("pointerdown", onPointerDown, true);
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("pointerdown", onPointerDown, true);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [
		browser,
		tab,
		url,
		state.menu,
		state.bookmarkDialog,
		state.panel,
		state.findBar
	]);
	const closePanel = () => dispatch({
		type: "panel",
		panel: null
	});
	return /* @__PURE__ */ jsxs("div", {
		ref: rootRef,
		className: `eb-root${scenario.large ? " eb-large" : ""}${full ? " is-full" : ""}${state.panel ? " has-panel" : ""}`,
		onContextMenu: (e) => e.preventDefault(),
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "eb-window",
				children: [
					/* @__PURE__ */ jsx(TabStrip, {
						web,
						browser,
						dispatch
					}),
					tab && /* @__PURE__ */ jsx(Toolbar, {
						web,
						browser,
						tab,
						large: scenario.large === true,
						addressRef,
						dispatch,
						full,
						onFull: toggleFull
					}),
					/* @__PURE__ */ jsx(BookmarkBar, {
						web,
						browser,
						dispatch
					}),
					state.findBar && /* @__PURE__ */ jsx(FindBar, {
						pageRef,
						pageKey: `${browser.activeTab}|${url}|${state.reloads}|${state.resets}|${browser.zoom}`,
						onSearch: (text) => dispatch({
							type: "op",
							op: {
								op: "find",
								text
							}
						}),
						onClose: () => dispatch({
							type: "findBar",
							open: false
						})
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "eb-body",
						children: [/* @__PURE__ */ jsx("div", {
							className: "eb-page",
							ref: pageRef,
							children: /* @__PURE__ */ jsx("div", {
								className: "eb-page-inner",
								style: browser.zoom === 100 ? void 0 : { zoom: `${browser.zoom}%` },
								children: /* @__PURE__ */ jsx(PageView, {
									web,
									url,
									links,
									onSearch,
									actions
								})
							}, `${browser.activeTab}|${url}|${state.reloads}|${state.resets}`)
						}), state.panel && /* @__PURE__ */ jsxs(SidePanel, {
							panel: state.panel,
							onClose: closePanel,
							children: [
								state.panel === "history" && /* @__PURE__ */ jsx(HistoryPanel, {
									web,
									browser,
									dispatch
								}),
								state.panel === "bookmarks" && /* @__PURE__ */ jsx(BookmarksPanel, {
									web,
									browser,
									dispatch
								}),
								state.panel === "tabs" && /* @__PURE__ */ jsx(TabsPanel, {
									web,
									browser,
									dispatch
								}),
								state.panel === "downloads" && /* @__PURE__ */ jsx(DownloadsPanelBody, {
									downloads: browser.downloads,
									onDelete: (id) => dispatch({
										type: "op",
										op: {
											op: "deleteDownload",
											id
										}
									})
								})
							]
						})]
					}),
					popup && /* @__PURE__ */ jsx(PopupWindow, {
						popup,
						onAccept: () => dispatch({
							type: "op",
							op: {
								op: "acceptPopup",
								id: popup.spec.id
							}
						}),
						onClose: () => dispatch({
							type: "op",
							op: {
								op: "closePopup",
								id: popup.spec.id
							}
						})
					}),
					!popup && warned && /* @__PURE__ */ jsx(AntivirusDialog, {
						item: warned,
						onDelete: () => dispatch({
							type: "op",
							op: {
								op: "deleteDownload",
								id: warned.id
							}
						}),
						onOpen: () => dispatch({
							type: "ops",
							ops: [{
								op: "openDownload",
								id: warned.id
							}]
						})
					}),
					state.bookmarkDialog && /* @__PURE__ */ jsx(BookmarkDialog, {
						web,
						browser,
						dispatch
					}, url)
				]
			}),
			state.menu && /* @__PURE__ */ jsx(ContextMenu, {
				web,
				browser,
				menu: state.menu,
				dispatch
			}),
			state.message !== null && /* @__PURE__ */ jsx("div", {
				className: "eb-toast",
				role: "status",
				children: state.message
			}),
			/* @__PURE__ */ jsx(TaskPanel, {
				scenario,
				state,
				open: taskOpen,
				onToggle: () => setTaskOpen((o) => !o),
				onReset: reset,
				dispatch,
				selfCheck,
				next,
				onNext: () => {
					handOver();
					next?.go();
				}
			}),
			!taskOpen && /* @__PURE__ */ jsx("button", {
				type: "button",
				className: "eb-task-show",
				onClick: () => setTaskOpen(true),
				children: "📋 Завдання"
			})
		]
	});
};
export { EduBrowser };
