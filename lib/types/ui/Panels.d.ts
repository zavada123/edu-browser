import { type ReactNode } from "react";
import { type BrowserState, type Web } from "../core/state.ts";
import type { Menu, Panel, UiAction } from "./store.ts";
/** History: newest first, grouped by day, with a search, «✕» on every entry and «Очистити історію». */
export declare const HistoryPanel: ({ web, browser, dispatch }: {
    readonly web: Web;
    readonly browser: BrowserState;
    readonly dispatch: (a: UiAction) => void;
}) => import("react").JSX.Element;
/** On a phone: every tab as a row. */
export declare const TabsPanel: ({ web, browser, dispatch }: {
    readonly web: Web;
    readonly browser: BrowserState;
    readonly dispatch: (a: UiAction) => void;
}) => import("react").JSX.Element;
export declare const SidePanel: ({ panel, onClose, children }: {
    readonly panel: Panel;
    readonly onClose: () => void;
    readonly children: ReactNode;
}) => import("react").JSX.Element;
/** Right-click menus: a link, a bookmark on the bar, the bookmarks of a folder. */
export declare const ContextMenu: ({ web, browser, menu, dispatch }: {
    readonly web: Web;
    readonly browser: BrowserState;
    readonly menu: Menu;
    readonly dispatch: (a: UiAction) => void;
}) => import("react").JSX.Element;
