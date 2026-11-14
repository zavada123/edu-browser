import { type Url } from "./url.ts";
/**
 * Made-up sites are data, not HTML: a page is a list of ready blocks. The trainer draws every block
 * itself, so a page can show nothing a scenario author did not mean, and needs no network.
 *
 * In `text` a link is written as `[слова](адреса)`; an address without a host (`/місяць`) stays on the same site.
 */
export type Block = {
    readonly type: "heading";
    readonly text: string;
} | {
    readonly type: "text";
    readonly text: string;
}
/** A photo: a big emoji on a coloured card, with the author under it. Every photo has an author. */
 | {
    readonly type: "photo";
    readonly art: string;
    readonly caption: string;
    readonly author: string;
    readonly bg?: string;
    /** «CC BY 4.0», «Усі права захищено». */
    readonly license?: string;
    /** A file name: the photo gets a «Завантажити» button. */
    readonly file?: string;
} | {
    readonly type: "links";
    readonly title?: string;
    readonly items: ReadonlyArray<LinkItem>;
} | {
    readonly type: "list";
    readonly items: ReadonlyArray<string>;
} | {
    readonly type: "table";
    readonly head: ReadonlyArray<string>;
    readonly rows: ReadonlyArray<ReadonlyArray<string>>;
}
/** A bright advert. It is a link too, so a student can follow it. */
 | {
    readonly type: "banner";
    readonly text: string;
    readonly url: Url;
}
/** The search form of the search site and its results for the query in the address. */
 | {
    readonly type: "search";
} | {
    readonly type: "note";
    readonly text: string;
}
/** Small pale print, hard to read without zoom: «Збільш масштаб, щоб прочитати». */
 | {
    readonly type: "fine";
    readonly text: string;
}
/**
 * A form that asks for something. It sends nothing anywhere: the trainer only records that the student
 * pressed the button, never what they typed.
 */
 | {
    readonly type: "form";
    readonly id: string;
    readonly title: string;
    readonly fields: ReadonlyArray<string>;
    readonly button: string;
    /** What the page says after the button. Default: a warning that strangers now know the data. */
    readonly sent?: string;
}
/** A chat with scripted messages; the student can write, or report the writer to the site. */
 | {
    readonly type: "chat";
    readonly id: string;
    readonly title: string;
    readonly messages: ReadonlyArray<ChatMessage>;
    readonly reply?: string;
}
/** A file to download. `virus: true` makes the antivirus warn about it. */
 | {
    readonly type: "download";
    readonly file: string;
    readonly label: string;
    readonly size: string;
    readonly virus?: boolean;
};
export interface ChatMessage {
    readonly from: string;
    readonly text: string;
}
export interface LinkItem {
    readonly text: string;
    readonly url: Url;
    readonly note?: string;
}
export interface Page {
    readonly title: string;
    readonly blocks: ReadonlyArray<Block>;
    /** Words the search site finds this page by. */
    readonly keywords?: ReadonlyArray<string>;
    /** The search site shows this page as «Реклама» above the results for these words. */
    readonly adKeywords?: ReadonlyArray<string>;
}
export interface Site {
    /** `космос.edu` */
    readonly host: string;
    /** Latin spellings that open the same site, for a keyboard without Ukrainian letters: `kosmos.edu`. */
    readonly aliases?: ReadonlyArray<string>;
    readonly name: string;
    readonly icon: string;
    /** The colour of the site's header; every page of a site has the same header. */
    readonly color: string;
    /** `false`: the address bar shows «Не захищено» instead of the lock. */
    readonly secure: boolean;
    /** Links in the site's header, the same on every page. */
    readonly nav?: ReadonlyArray<LinkItem>;
    /** `""` is the home page. */
    readonly pages: Readonly<Record<string, Page>>;
}
export type SiteMap = Readonly<Record<string, Site>>;
export declare const SEARCH_HOST = "\u043F\u043E\u0448\u0443\u043A.edu";
export declare const SEARCH_PATH = "\u043F\u043E\u0448\u0443\u043A";
/** The sites on the new-tab page: the safe ones the class knows, without the search site itself. */
export declare const tileSites: (sites: ReadonlyArray<Site>) => ReadonlyArray<Site>;
export declare const searchUrl: (query: string) => Url;
export declare const siteMap: (sites: ReadonlyArray<Site>) => SiteMap;
/** The address with the site's real host: `kosmos.edu/місяць` → `космос.edu/місяць`. */
export declare const canonicalUrl: (sites: SiteMap, raw: Url) => Url;
export type Resolved = {
    readonly kind: "newTab";
} | {
    readonly kind: "page";
    readonly site: Site;
    readonly page: Page;
    readonly path: string;
    readonly query: string;
} | {
    readonly kind: "noSite";
    readonly host: string;
} | {
    readonly kind: "noPage";
    readonly site: Site;
    readonly path: string;
};
export declare const resolve: (sites: SiteMap, url: Url) => Resolved;
/** What the tab and the history show. */
export declare const titleOf: (sites: SiteMap, url: Url) => string;
export declare const iconOf: (sites: SiteMap, url: Url) => string;
/** A link inside a site: `/місяць` → `космос.edu/місяць`. */
export declare const absoluteUrl: (fromUrl: Url, href: string) => Url;
export type TextPart = string | {
    readonly text: string;
    readonly url: Url;
};
/** `Читай про [Місяць](/місяць).` → text and link parts. */
export declare const splitLinks: (text: string) => ReadonlyArray<TextPart>;
export interface SearchHit {
    readonly url: Url;
    readonly title: string;
    readonly site: Site;
    readonly snippet: string;
    /** Paid: shown first and marked «Реклама». */
    readonly ad?: boolean;
}
/**
 * Adverts for the query first, then pages whose title or keywords hold every word of the query, best first.
 * Hosts sorted for a stable order.
 */
export declare const search: (sites: ReadonlyArray<Site>, query: string) => ReadonlyArray<SearchHit>;
/**
 * Every address a student can reach by a click on this page: links in its blocks, in the site header,
 * and search results. The server checks a «link» step against this list.
 */
export declare const linksOn: (sitesList: ReadonlyArray<Site>, sites: SiteMap, url: Url) => ReadonlyArray<Url>;
/** The blocks of the page at `url`, or none for the new-tab page and pages that do not exist. */
export declare const blocksOn: (sites: SiteMap, url: Url) => ReadonlyArray<Block>;
