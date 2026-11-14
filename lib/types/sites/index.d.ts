import { type Site } from "../core/sites.ts";
import { kazky } from "./kazky.ts";
import { encyclopedia, shkola, slovnyk, wikiKids } from "./knowledge.ts";
import { kosmos } from "./kosmos.ts";
/** The home page: a search form. Its results come from the keywords of every other page. */
export declare const poshuk: Site;
/** Every made-up site the trainer knows. All content is invented: no real brands or people. */
export declare const allSites: ReadonlyArray<Site>;
export declare const defaultWeb: import("../core.ts").Web;
export { encyclopedia, kazky, kosmos, shkola, slovnyk, wikiKids };
