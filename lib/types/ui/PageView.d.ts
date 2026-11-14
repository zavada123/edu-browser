import type { Web } from "../core/state.ts";
import { type Url } from "../core/url.ts";
import { type LinkHandlers } from "./links.ts";
interface Props {
    readonly web: Web;
    readonly url: Url;
    readonly links: LinkHandlers;
    /** A search typed into the search site or the new-tab page. */
    readonly onSearch: (query: string) => void;
}
/** The made-up page at `url`, drawn from its blocks. No HTML from data and no network. */
export declare const PageView: ({ web, url, links, onSearch }: Props) => import("react").JSX.Element;
export {};
