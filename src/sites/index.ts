import { SEARCH_HOST, SEARCH_PATH, type Site } from "../core/sites.ts"
import { makeWeb } from "../core/state.ts"
import { fakeDiary, freeGames, igry, kazkyFree, pryz } from "./danger.ts"
import { kazky } from "./kazky.ts"
import { encyclopedia, photoNature, shkola, slovnyk, wikiKids } from "./knowledge.ts"
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
export const allSites: ReadonlyArray<Site> = [poshuk, kosmos, kazky, shkola, slovnyk, encyclopedia, wikiKids, photoNature, igry, pryz, kazkyFree, freeGames, fakeDiary]

export const defaultWeb = makeWeb(allSites)

export { encyclopedia, freeGames, igry, kazky, kazkyFree, kosmos, photoNature, pryz, shkola, slovnyk, wikiKids }
