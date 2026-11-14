import { describe, expect, test } from "vitest"
import { allSites, defaultWeb } from "../sites/index.ts"
import { canonicalUrl, linksOn, resolve, search, splitLinks, titleOf } from "./sites.ts"
import { NEW_TAB } from "./url.ts"

const web = defaultWeb

describe("sites", () => {
  test("a latin alias opens the same site", () => {
    expect(canonicalUrl(web.map, "https://kosmos.edu/місяць")).toBe("космос.edu/місяць")
  })

  test("unknown sites and pages resolve to «not found»", () => {
    expect(resolve(web.map, "нема.edu").kind).toBe("noSite")
    expect(resolve(web.map, "космос.edu/марс").kind).toBe("noPage")
    expect(resolve(web.map, NEW_TAB).kind).toBe("newTab")
  })

  test("titles", () => {
    expect(titleOf(web.map, "космос.edu/місяць")).toBe("Місяць — Космос для дітей")
    expect(titleOf(web.map, "пошук.edu/пошук?q=місяць")).toBe("місяць — Пошук")
  })

  test("every link on every page leads to a page that exists", () => {
    for (const site of allSites)
      for (const path of Object.keys(site.pages)) {
        const url = path === "" ? site.host : `${site.host}/${path}`
        for (const link of linksOn(web.list, web.map, url)) expect(resolve(web.map, link).kind, `${url} → ${link}`).toBe("page")
      }
  })

  test("every photo has an author", () => {
    for (const site of allSites)
      for (const page of Object.values(site.pages))
        for (const block of page.blocks) if (block.type === "photo") expect(block.author.length).toBeGreaterThan(3)
  })
})

describe("splitLinks", () => {
  test("finds links written as [text](address)", () => {
    expect(splitLinks("Читай про [Місяць](/місяць).")).toEqual(["Читай про ", { text: "Місяць", url: "/місяць" }, "."])
  })
})

describe("search", () => {
  test("finds pages by keywords and word stems", () => {
    expect(search(web.list, "розклад гуртків")[0]?.url).toBe("школа.edu/гуртки")
    expect(search(web.list, "ракети").map((h) => h.url)).toContain("космос.edu/ракети")
    expect(search(web.list, "лелека").map((h) => h.url)).toEqual(expect.arrayContaining(["енциклопедія.edu/лелека", "вікі-діти.edu/лелека"]))
  })

  test("an empty or unknown query finds nothing", () => {
    expect(search(web.list, "  ")).toEqual([])
    expect(search(web.list, "динозавр")).toEqual([])
  })

  test("search results are links of the search page", () => {
    expect(linksOn(web.list, web.map, "пошук.edu/пошук?q=місяць")).toContain("космос.edu/місяць")
  })
})
