import { hostOf, NEW_TAB, normalizeUrl, parseUrl, type Url } from "./url.ts"

/**
 * Made-up sites are data, not HTML: a page is a list of ready blocks. The trainer draws every block
 * itself, so a page can show nothing a scenario author did not mean, and needs no network.
 *
 * In `text` a link is written as `[слова](адреса)`; an address without a host (`/місяць`) stays on the same site.
 */
export type Block =
  | { readonly type: "heading"; readonly text: string }
  | { readonly type: "text"; readonly text: string }
  /** A photo: a big emoji on a coloured card, with the author under it. Every photo has an author. */
  | {
      readonly type: "photo"
      readonly art: string
      readonly caption: string
      readonly author: string
      readonly bg?: string
      /** «CC BY 4.0», «Усі права захищено». */
      readonly license?: string
      /** A file name: the photo gets a «Завантажити» button. */
      readonly file?: string
    }
  | { readonly type: "links"; readonly title?: string; readonly items: ReadonlyArray<LinkItem> }
  | { readonly type: "list"; readonly items: ReadonlyArray<string> }
  | { readonly type: "table"; readonly head: ReadonlyArray<string>; readonly rows: ReadonlyArray<ReadonlyArray<string>> }
  /** A bright advert. It is a link too, so a student can follow it. */
  | { readonly type: "banner"; readonly text: string; readonly url: Url }
  /** The search form of the search site and its results for the query in the address. */
  | { readonly type: "search" }
  | { readonly type: "note"; readonly text: string }
  /**
   * A form that asks for something. It sends nothing anywhere: the trainer only records that the student
   * pressed the button, never what they typed.
   */
  | { readonly type: "form"; readonly id: string; readonly title: string; readonly fields: ReadonlyArray<string>; readonly button: string }
  /** A chat with scripted messages; the student can write, or report the writer to the site. */
  | { readonly type: "chat"; readonly id: string; readonly title: string; readonly messages: ReadonlyArray<ChatMessage>; readonly reply?: string }
  /** A file to download. `virus: true` makes the antivirus warn about it. */
  | { readonly type: "download"; readonly file: string; readonly label: string; readonly size: string; readonly virus?: boolean }

export interface ChatMessage {
  readonly from: string
  readonly text: string
}

export interface LinkItem {
  readonly text: string
  readonly url: Url
  readonly note?: string
}

export interface Page {
  readonly title: string
  readonly blocks: ReadonlyArray<Block>
  /** Words the search site finds this page by. */
  readonly keywords?: ReadonlyArray<string>
  /** The search site shows this page as «Реклама» above the results for these words. */
  readonly adKeywords?: ReadonlyArray<string>
}

export interface Site {
  /** `космос.edu` */
  readonly host: string
  /** Latin spellings that open the same site, for a keyboard without Ukrainian letters: `kosmos.edu`. */
  readonly aliases?: ReadonlyArray<string>
  readonly name: string
  readonly icon: string
  /** The colour of the site's header; every page of a site has the same header. */
  readonly color: string
  /** `false`: the address bar shows «Не захищено» instead of the lock. */
  readonly secure: boolean
  /** Links in the site's header, the same on every page. */
  readonly nav?: ReadonlyArray<LinkItem>
  /** `""` is the home page. */
  readonly pages: Readonly<Record<string, Page>>
}

export type SiteMap = Readonly<Record<string, Site>>

export const SEARCH_HOST = "пошук.edu"
export const SEARCH_PATH = "пошук"

/** The sites on the new-tab page: the safe ones the class knows, without the search site itself. */
export const tileSites = (sites: ReadonlyArray<Site>): ReadonlyArray<Site> => sites.filter((s) => s.host !== SEARCH_HOST && s.secure)

export const searchUrl = (query: string): Url => `${SEARCH_HOST}/${SEARCH_PATH}?q=${query.trim()}`

export const siteMap = (sites: ReadonlyArray<Site>): SiteMap => {
  const map: Record<string, Site> = {}
  for (const site of sites) {
    map[site.host] = site
    for (const alias of site.aliases ?? []) map[alias] = site
  }
  return map
}

/** The address with the site's real host: `kosmos.edu/місяць` → `космос.edu/місяць`. */
export const canonicalUrl = (sites: SiteMap, raw: Url): Url => {
  const url = normalizeUrl(raw)
  if (url === NEW_TAB) return url
  const { host, path, query } = parseUrl(url)
  const site = sites[host]
  if (!site) return url
  const base = path.length > 0 ? `${site.host}/${path}` : site.host
  return query.length > 0 ? `${base}?q=${query}` : base
}

export type Resolved =
  | { readonly kind: "newTab" }
  | { readonly kind: "page"; readonly site: Site; readonly page: Page; readonly path: string; readonly query: string }
  | { readonly kind: "noSite"; readonly host: string }
  | { readonly kind: "noPage"; readonly site: Site; readonly path: string }

export const resolve = (sites: SiteMap, url: Url): Resolved => {
  if (url === NEW_TAB) return { kind: "newTab" }
  const { host, path, query } = parseUrl(canonicalUrl(sites, url))
  const site = sites[host]
  if (!site) return { kind: "noSite", host }
  const page = site.pages[path]
  if (!page) return { kind: "noPage", site, path }
  return { kind: "page", site, page, path, query }
}

/** What the tab and the history show. */
export const titleOf = (sites: SiteMap, url: Url): string => {
  const r = resolve(sites, url)
  switch (r.kind) {
    case "newTab":
      return "Нова вкладка"
    case "noSite":
      return "Сайт не знайдено"
    case "noPage":
      return "Сторінку не знайдено"
    case "page":
      return r.query.length > 0 ? `${r.query} — ${r.site.name}` : r.page.title
  }
}

export const iconOf = (sites: SiteMap, url: Url): string => {
  const r = resolve(sites, url)
  return r.kind === "page" || r.kind === "noPage" ? r.site.icon : r.kind === "newTab" ? "✨" : "⚠️"
}

/** A link inside a site: `/місяць` → `космос.edu/місяць`. */
export const absoluteUrl = (fromUrl: Url, href: string): Url => {
  if (!href.startsWith("/")) return href
  const host = hostOf(fromUrl)
  return href === "/" ? host : `${host}${href}`
}

export type TextPart = string | { readonly text: string; readonly url: Url }

/** `Читай про [Місяць](/місяць).` → text and link parts. */
export const splitLinks = (text: string): ReadonlyArray<TextPart> => {
  const parts: TextPart[] = []
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g
  let last = 0
  for (const match of text.matchAll(re)) {
    const at = match.index ?? 0
    if (at > last) parts.push(text.slice(last, at))
    parts.push({ text: match[1] ?? "", url: match[2] ?? "" })
    last = at + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

const blockLinks = (block: Block): ReadonlyArray<Url> => {
  switch (block.type) {
    case "text":
    case "note":
      return splitLinks(block.text).flatMap((p) => (typeof p === "string" ? [] : [p.url]))
    case "links":
      return block.items.map((i) => i.url)
    case "banner":
      return [block.url]
    default:
      return []
  }
}

export interface SearchHit {
  readonly url: Url
  readonly title: string
  readonly site: Site
  readonly snippet: string
  /** Paid: shown first and marked «Реклама». */
  readonly ad?: boolean
}

const words = (s: string): ReadonlyArray<string> =>
  s
    .toLocaleLowerCase("uk")
    .split(/[^\p{L}\p{N}'-]+/u)
    .filter((w) => w.length > 1)

/** Same stem: «ракети» finds «ракета», «Місяця» finds «місяць». */
const stemMatch = (a: string, b: string): boolean => {
  const n = Math.min(a.length, b.length, Math.max(3, Math.min(a.length, b.length) - 2))
  return a.slice(0, n) === b.slice(0, n)
}

const pageUrl = (site: Site, path: string): Url => (path.length > 0 ? `${site.host}/${path}` : site.host)

const snippetOf = (page: Page): string => {
  const firstText = page.blocks.find((b) => b.type === "text")
  return firstText?.type === "text" ? splitLinks(firstText.text).map((p) => (typeof p === "string" ? p : p.text)).join("").slice(0, 140) : ""
}

/** Adverts whose words share a stem with any word of the query. */
const adsFor = (sites: ReadonlyArray<Site>, q: ReadonlyArray<string>): ReadonlyArray<SearchHit> =>
  sites.flatMap((site) =>
    Object.entries(site.pages)
      .filter(([, page]) => (page.adKeywords ?? []).flatMap(words).some((k) => q.some((w) => stemMatch(k, w))))
      .map(([path, page]) => ({ url: pageUrl(site, path), title: page.title, site, snippet: snippetOf(page), ad: true }))
  )

/**
 * Adverts for the query first, then pages whose title or keywords hold every word of the query, best first.
 * Hosts sorted for a stable order.
 */
export const search = (sites: ReadonlyArray<Site>, query: string): ReadonlyArray<SearchHit> => {
  const q = words(query)
  if (q.length === 0) return []
  const hits: Array<SearchHit & { readonly score: number }> = []
  for (const site of sites) {
    if (site.host === SEARCH_HOST) continue
    for (const [path, page] of Object.entries(site.pages)) {
      const titleWords = words(`${page.title} ${site.name}`)
      const keyWords = (page.keywords ?? []).flatMap(words)
      let score = 0
      let all = true
      for (const w of q) {
        const inTitle = titleWords.some((t) => stemMatch(t, w))
        const inKeys = keyWords.some((k) => stemMatch(k, w))
        if (!inTitle && !inKeys) all = false
        score += inTitle ? 2 : inKeys ? 1 : 0
      }
      if (!all) continue
      hits.push({ url: pageUrl(site, path), title: page.title, site, snippet: snippetOf(page), score })
    }
  }
  const found = hits.sort((a, b) => b.score - a.score || a.url.localeCompare(b.url, "uk")).map(({ score: _s, ...hit }) => hit)
  const ads = adsFor(sites, q)
  return [...ads, ...found.filter((hit) => !ads.some((ad) => ad.url === hit.url))]
}

/**
 * Every address a student can reach by a click on this page: links in its blocks, in the site header,
 * and search results. The server checks a «link» step against this list.
 */
export const linksOn = (sitesList: ReadonlyArray<Site>, sites: SiteMap, url: Url): ReadonlyArray<Url> => {
  const r = resolve(sites, url)
  if (r.kind === "newTab") return tileSites(sitesList).map((s) => s.host)
  if (r.kind === "noSite") return []
  const own = r.kind === "page" ? r.page.blocks.flatMap(blockLinks) : []
  const nav = (r.site.nav ?? []).map((i) => i.url)
  const found = r.kind === "page" && r.page.blocks.some((b) => b.type === "search") ? search(sitesList, r.query).map((h) => h.url) : []
  return [...[...own, ...nav].map((href) => canonicalUrl(sites, absoluteUrl(`${r.site.host}`, href))), r.site.host, ...found]
}

/** The blocks of the page at `url`, or none for the new-tab page and pages that do not exist. */
export const blocksOn = (sites: SiteMap, url: Url): ReadonlyArray<Block> => {
  const r = resolve(sites, url)
  return r.kind === "page" ? r.page.blocks : []
}
