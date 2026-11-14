import { type RefObject } from "react";
import { type BrowserState, type Tab, type Web } from "../core/state.ts";
import { type Url } from "../core/url.ts";
import type { UiAction } from "./store.ts";
/** The tabs along the top. On a phone they are hidden and the tab counter opens a list instead. */
export declare const TabStrip: ({ web, browser, dispatch }: {
    readonly web: Web;
    readonly browser: BrowserState;
    readonly dispatch: (a: UiAction) => void;
}) => import("react").JSX.Element;
interface AddressProps {
    readonly web: Web;
    readonly url: Url;
    readonly bookmarked: boolean;
    readonly inputRef: RefObject<HTMLInputElement | null>;
    readonly onGo: (url: Url) => void;
    readonly onStar: () => void;
}
/** The address bar: shows where the student is, takes an address or a search. The star bookmarks the page. */
export declare const AddressBar: ({ web, url, bookmarked, inputRef, onGo, onStar }: AddressProps) => import("react").JSX.Element;
interface ToolbarProps {
    readonly web: Web;
    readonly browser: BrowserState;
    readonly tab: Tab;
    readonly large: boolean;
    readonly addressRef: RefObject<HTMLInputElement | null>;
    readonly dispatch: (a: UiAction) => void;
    readonly full: boolean;
    readonly onFull: () => void;
}
export declare const Toolbar: ({ web, browser, tab, large, addressRef, dispatch, full, onFull }: ToolbarProps) => import("react").JSX.Element;
export {};
