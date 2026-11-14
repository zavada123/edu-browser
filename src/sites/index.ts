import { SEARCH_HOST, SEARCH_PATH, type Site } from "../core/sites.ts"
import { makeWeb } from "../core/state.ts"
import { kazky } from "./kazky.ts"
import { encyclopedia, shkola, slovnyk, wikiKids } from "./knowledge.ts"
import { kosmos } from "./kosmos.ts"

/** The home page: a search form. Its results come from the keywords of every other page. */
export const poshuk: Site = {
  host: SEARCH_HOST,
  aliases: ["poshuk.edu"],
  name: "Пошук",
  icon: "🔎",
  color: "#2563eb",
  secure: true,
  pages: {
    "": { title: "Пошук", blocks: [{ type: "search" }] },
    [SEARCH_PATH]: { title: "Пошук", blocks: [{ type: "search" }] }
  }
}

/** Every made-up site the trainer knows. All content is invented: no real brands or people. */
export const allSites: ReadonlyArray<Site> = [poshuk, kosmos, kazky, shkola, slovnyk, encyclopedia, wikiKids]

export const defaultWeb = makeWeb(allSites)

export { encyclopedia, kazky, kosmos, shkola, slovnyk, wikiKids }
