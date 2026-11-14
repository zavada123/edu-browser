import { type BrowserState, type Web } from "../core/state.ts";
import type { UiAction } from "./store.ts";
/** The bar under the address bar: bookmarks of the bar itself, then the folders. */
export declare const BookmarkBar: ({ web, browser, dispatch }: {
    readonly web: Web;
    readonly browser: BrowserState;
    readonly dispatch: (a: UiAction) => void;
}) => import("react").JSX.Element;
/** The star dialog: name the bookmark and choose its folder, or a new folder. */
export declare const BookmarkDialog: ({ web, browser, dispatch }: {
    readonly web: Web;
    readonly browser: BrowserState;
    readonly dispatch: (a: UiAction) => void;
}) => import("react").JSX.Element;
/** The bookmark manager: every folder with its bookmarks; rename, move to a folder, delete; a new folder. */
export declare const BookmarksPanel: ({ web, browser, dispatch }: {
    readonly web: Web;
    readonly browser: BrowserState;
    readonly dispatch: (a: UiAction) => void;
}) => import("react").JSX.Element;
