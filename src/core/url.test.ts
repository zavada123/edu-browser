import { describe, expect, test } from "vitest"
import { looksLikeAddress, NEW_TAB, normalizeUrl, parseUrl } from "./url.ts"

describe("normalizeUrl", () => {
  test("drops the scheme, www, trailing slash and case", () => {
    expect(normalizeUrl(" https://www.Космос.EDU/Місяць/ ")).toBe("космос.edu/місяць")
  })

  test("keeps a search query", () => {
    expect(normalizeUrl("пошук.edu/пошук?q=розклад гуртків")).toBe("пошук.edu/пошук?q=розклад гуртків")
    expect(normalizeUrl("пошук.edu/пошук?q=")).toBe("пошук.edu/пошук")
  })

  test("the new-tab page stays as it is", () => {
    expect(normalizeUrl("ABOUT:newtab")).toBe(NEW_TAB)
  })
})

describe("parseUrl", () => {
  test("splits host, path and query", () => {
    expect(parseUrl("пошук.edu/пошук?q=місяць")).toEqual({ host: "пошук.edu", path: "пошук", query: "місяць" })
    expect(parseUrl("казки.edu")).toEqual({ host: "казки.edu", path: "", query: "" })
  })
})

describe("looksLikeAddress", () => {
  test.each(["казки.edu", "kazky.edu/колобок", "https://щось", "приз-телефон.win"])("%s is an address", (s) => {
    expect(looksLikeAddress(s)).toBe(true)
  })
  test.each(["місяць", "розклад гуртків", "", "казки edu"])("%s is a search", (s) => {
    expect(looksLikeAddress(s)).toBe(false)
  })
})
