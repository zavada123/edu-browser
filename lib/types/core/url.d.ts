/**
 * Addresses of the made-up web. A canonical address is `host/path?q=…` without a scheme, `www.`
 * or a trailing slash: `космос.edu/місяць`. The new-tab page is `NEW_TAB`.
 */
export type Url = string;
export declare const NEW_TAB: Url;
export interface ParsedUrl {
    readonly host: string;
    readonly path: string;
    /** The search query, `пошук.edu/пошук?q=місяць` → `місяць`. */
    readonly query: string;
}
/** Turns what a student typed or a link holds into the canonical address. */
export declare const normalizeUrl: (raw: string) => Url;
export declare const parseUrl: (url: Url) => ParsedUrl;
export declare const hostOf: (url: Url) => string;
/** `космос.edu`, `приз-телефон.win`: something with a dot and no spaces looks like an address. */
export declare const looksLikeAddress: (text: string) => boolean;
export declare const sameUrl: (a: Url, b: Url) => boolean;
