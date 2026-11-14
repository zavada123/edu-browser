import { type FormEvent, type ReactNode, useState } from "react"
import { absoluteUrl, type Block, resolve, search, SEARCH_HOST, type Site, splitLinks, tileSites } from "../core/sites.ts"
import type { Web } from "../core/state.ts"
import { NEW_TAB, type Url } from "../core/url.ts"
import { ChatBlock, DownloadBlock, FormBlock, type PageActions } from "./Interactive.tsx"
import { type LinkHandlers, linkProps } from "./links.ts"

interface Props {
  readonly web: Web
  readonly url: Url
  readonly links: LinkHandlers
  /** A search typed into the search site or the new-tab page. */
  readonly onSearch: (query: string) => void
  readonly actions: PageActions
}

const Link = ({ url, links, children, className }: { readonly url: Url; readonly links: LinkHandlers; readonly children: ReactNode; readonly className?: string }) => (
  <a className={`eb-link${className ? ` ${className}` : ""}`} {...linkProps(url, links)}>
    {children}
  </a>
)

const Text = ({ text, base, links }: { readonly text: string; readonly base: Url; readonly links: LinkHandlers }) => (
  <>
    {splitLinks(text).map((part, i) =>
      typeof part === "string" ? (
        <span key={i}>{part}</span>
      ) : (
        <Link key={i} url={absoluteUrl(base, part.url)} links={links}>
          {part.text}
        </Link>
      )
    )}
  </>
)

const SearchForm = ({ initial, onSearch, big }: { readonly initial: string; readonly onSearch: (q: string) => void; readonly big?: boolean }) => {
  const [query, setQuery] = useState(initial)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (query.trim().length > 0) onSearch(query)
  }
  return (
    <form className={`eb-search${big ? " is-big" : ""}`} role="search" onSubmit={submit}>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Що шукаємо?"
        aria-label="Пошуковий запит"
        enterKeyHint="search"
        autoComplete="off"
      />
      <button type="submit">Знайти</button>
    </form>
  )
}

const SearchBlock = ({ web, query, links, onSearch }: { readonly web: Web; readonly query: string; readonly links: LinkHandlers; readonly onSearch: (q: string) => void }) => {
  const hits = query.length > 0 ? search(web.list, query) : []
  return (
    <div className="eb-search-page">
      {query.length === 0 && <div className="eb-search-logo">🔎 Пошук</div>}
      <SearchForm key={query} initial={query} onSearch={onSearch} big={query.length === 0} />
      {query.length > 0 &&
        (hits.length === 0 ? (
          <p className="eb-muted">За запитом «{query}» нічого не знайдено. Спробуй інші ключові слова.</p>
        ) : (
          <ol className="eb-hits">
            {hits.map((hit) => (
              <li key={hit.url} className={hit.ad ? "is-ad" : undefined}>
                <span className="eb-hit-site">
                  {hit.ad && <span className="eb-ad-mark">Реклама</span>}
                  <span aria-hidden="true">{hit.site.icon}</span> {hit.site.name} ·{" "}
                  <span className={`eb-hit-url${hit.site.secure ? "" : " is-unsafe"}`}>
                    {hit.site.secure ? "🔒 " : "⚠️ "}
                    {hit.url}
                  </span>
                </span>
                <Link url={hit.url} links={links} className="eb-hit-title">
                  {hit.title}
                </Link>
                {hit.snippet.length > 0 && <p>{hit.snippet}</p>}
              </li>
            ))}
          </ol>
        ))}
    </div>
  )
}

interface BlockProps {
  readonly block: Block
  readonly base: Url
  readonly web: Web
  readonly query: string
  readonly links: LinkHandlers
  readonly onSearch: (q: string) => void
  readonly actions: PageActions
}

const BlockView = ({ block, base, web, query, links, onSearch, actions }: BlockProps) => {
  switch (block.type) {
    case "heading":
      return <h1 className="eb-h">{block.text}</h1>
    case "text":
      return (
        <p>
          <Text text={block.text} base={base} links={links} />
        </p>
      )
    case "note":
      return (
        <p className="eb-note">
          <Text text={block.text} base={base} links={links} />
        </p>
      )
    case "fine":
      return <p className="eb-fine">{block.text}</p>
    case "photo":
      return (
        <figure className="eb-photo">
          <div className="eb-photo-art" style={{ background: block.bg ?? "#e2e8f0" }} role="img" aria-label={block.caption}>
            {block.art}
          </div>
          <figcaption>
            {block.caption}
            <span className="eb-author">Фото: {block.author}</span>
            {block.license && <span className="eb-license">Ліцензія: {block.license}</span>}
          </figcaption>
          {block.file !== undefined && (
            <button type="button" className="eb-btn eb-photo-save" onClick={() => block.file !== undefined && actions.download(block.file)}>
              ⬇ Завантажити фото
            </button>
          )}
        </figure>
      )
    case "links":
      return (
        <nav className="eb-links" aria-label={block.title ?? "Посилання"}>
          {block.title && <h2>{block.title}</h2>}
          <ul>
            {block.items.map((item) => (
              <li key={item.url}>
                <Link url={absoluteUrl(base, item.url)} links={links}>
                  {item.text}
                </Link>
                {item.note && <small>{item.note}</small>}
              </li>
            ))}
          </ul>
        </nav>
      )
    case "list":
      return (
        <ul className="eb-list">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )
    case "table":
      return (
        <div className="eb-table-wrap">
          <table className="eb-table">
            <thead>
              <tr>
                {block.head.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.join("|")}>
                  {row.map((cell, i) => (
                    <td key={i}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case "banner":
      return (
        <Link url={absoluteUrl(base, block.url)} links={links} className="eb-banner">
          {block.text}
        </Link>
      )
    case "search":
      return <SearchBlock web={web} query={query} links={links} onSearch={onSearch} />
    case "form":
      return <FormBlock id={block.id} title={block.title} fields={block.fields} button={block.button} sentText={block.sent} actions={actions} />
    case "chat":
      return <ChatBlock id={block.id} title={block.title} messages={block.messages} reply={block.reply} actions={actions} />
    case "download":
      return <DownloadBlock file={block.file} label={block.label} size={block.size} actions={actions} />
  }
}

const SiteHeader = ({ site, links }: { readonly site: Site; readonly links: LinkHandlers }) => (
  <header className="eb-site-head" style={{ background: site.color }}>
    <Link url={site.host} links={links} className="eb-site-name">
      <span aria-hidden="true">{site.icon}</span> {site.name}
    </Link>
    {site.nav && (
      <nav aria-label="Меню сайту">
        {site.nav.map((item) => (
          <Link key={item.url} url={absoluteUrl(site.host, item.url)} links={links}>
            {item.text}
          </Link>
        ))}
      </nav>
    )}
  </header>
)

const NewTabPage = ({ web, links, onSearch }: { readonly web: Web; readonly links: LinkHandlers; readonly onSearch: (q: string) => void }) => (
  <div className="eb-newtab">
    <div className="eb-search-logo">🔎 Пошук</div>
    <SearchForm initial="" onSearch={onSearch} big />
    <ul className="eb-tiles" aria-label="Часто відвідувані сайти">
      {tileSites(web.list).map((site) => (
          <li key={site.host}>
            <Link url={site.host} links={links} className="eb-tile">
              <span className="eb-tile-icon" style={{ background: site.color }} aria-hidden="true">
                {site.icon}
              </span>
              <span>{site.name}</span>
            </Link>
          </li>
        ))}
    </ul>
  </div>
)

/** The made-up page at `url`, drawn from its blocks. No HTML from data and no network. */
export const PageView = ({ web, url, links, onSearch, actions }: Props) => {
  if (url === NEW_TAB) return <NewTabPage web={web} links={links} onSearch={onSearch} />
  const r = resolve(web.map, url)
  switch (r.kind) {
    case "newTab":
      return <NewTabPage web={web} links={links} onSearch={onSearch} />
    case "noSite":
      return (
        <div className="eb-error">
          <div className="eb-error-icon" aria-hidden="true">
            🦖
          </div>
          <h1>Не вдається відкрити сайт</h1>
          <p>
            Сайту <b>{r.host}</b> не знайдено.
          </p>
          <p className="eb-muted">Перевір, чи правильно надруковано адресу: кожна літера і крапка важливі.</p>
        </div>
      )
    case "noPage":
      return (
        <>
          <SiteHeader site={r.site} links={links} />
          <div className="eb-error">
            <h1>Сторінку не знайдено</h1>
            <p className="eb-muted">
              На сайті {r.site.name} немає сторінки «{r.path}». Перейди на <Link url={r.site.host} links={links}>головну сторінку сайту</Link>.
            </p>
          </div>
        </>
      )
    case "page":
      return (
        <>
          {r.site.host !== SEARCH_HOST && <SiteHeader site={r.site} links={links} />}
          <article className="eb-article">
            {r.page.blocks.map((block, i) => (
              <BlockView key={i} block={block} base={r.site.host} web={web} query={r.query} links={links} onSearch={onSearch} actions={actions} />
            ))}
          </article>
        </>
      )
  }
}
