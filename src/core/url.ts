/**
 * Addresses of the made-up web. A canonical address is `host/path?q=…` without a scheme, `www.`
 * or a trailing slash: `космос.edu/місяць`. The new-tab page is `NEW_TAB`.
 */
export type Url = string

export const NEW_TAB: Url = "about:newtab"

export interface ParsedUrl {
  readonly host: string
  readonly path: string
  /** The search query, `пошук.edu/пошук?q=місяць` → `місяць`. */
  readonly query: string
}

const lower = (s: string): string => s.toLocaleLowerCase("uk")

/** Turns what a student typed or a link holds into the canonical address. */
export const normalizeUrl = (raw: string): Url => {
  const trimmed = raw.trim()
  if (lower(trimmed) === NEW_TAB) return NEW_TAB
  const noScheme = trimmed.replace(/^[a-z]+:\/\//i, "").replace(/^www\./i, "")
  const [beforeQuery = "", ...rest] = noScheme.split("?")
  const query = rest.join("?")
  const [host = "", ...pathParts] = beforeQuery.split("/")
  const path = pathParts
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .join("/")
  const base = path.length > 0 ? `${lower(host)}/${lower(path)}` : lower(host)
  const q = new URLSearchParams(query).get("q")
  return q !== null && q.trim().length > 0 ? `${base}?q=${q.trim()}` : base
}

export const parseUrl = (url: Url): ParsedUrl => {
  const [beforeQuery = "", query = ""] = url.split("?q=")
  const slash = beforeQuery.indexOf("/")
  return slash < 0
    ? { host: beforeQuery, path: "", query }
    : { host: beforeQuery.slice(0, slash), path: beforeQuery.slice(slash + 1), query }
}

export const hostOf = (url: Url): string => parseUrl(url).host

/** `космос.edu`, `приз-телефон.win`: something with a dot and no spaces looks like an address. */
export const looksLikeAddress = (text: string): boolean => {
  const t = text.trim()
  if (t.length === 0 || /\s/.test(t)) return false
  if (/^[a-z]+:\/\//i.test(t) || lower(t) === NEW_TAB) return true
  const host = t.split(/[/?]/)[0] ?? ""
  return /^[\p{L}\p{N}-]+(\.[\p{L}\p{N}-]+)+$/u.test(host)
}

export const sameUrl = (a: Url, b: Url): boolean => normalizeUrl(a) === normalizeUrl(b)
