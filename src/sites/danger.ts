import type { Site } from "../core/sites.ts"

/**
 * Sites for the lesson about safety (inf3-10). Everything here is made up and harmless: forms send nothing,
 * files are names in a list, the «virus» only makes the antivirus warn.
 */

/** A games site for children with a chat where a stranger asks for a password. */
export const igry: Site = {
  host: "ігри-онлайн.edu",
  aliases: ["igry-online.edu"],
  name: "Ігри онлайн",
  icon: "🎮",
  color: "#6d28d9",
  secure: true,
  nav: [
    { text: "Ігри", url: "/" },
    { text: "Чат гравців", url: "/чат" },
    { text: "Правила", url: "/правила" }
  ],
  pages: {
    "": {
      title: "Ігри онлайн",
      keywords: ["ігри", "гра", "грати", "перегони"],
      blocks: [
        { type: "heading", text: "Грай і спілкуйся!" },
        {
          type: "links",
          title: "Наші ігри",
          items: [
            { text: "🏎️ Перегони", url: "/чат", note: "Змагайся з друзями" },
            { text: "🧩 Пазли", url: "/чат", note: "Збери картинку" }
          ]
        },
        { type: "text", text: "Перед грою прочитай [правила](/правила)." }
      ]
    },
    чат: {
      title: "Чат гравців — Ігри онлайн",
      keywords: ["чат", "гравці"],
      blocks: [
        { type: "heading", text: "Перегони: чат гравців" },
        {
          type: "chat",
          id: "chat",
          title: "Чат гравців",
          messages: [
            { from: "Модератор", text: "Ласкаво просимо в ігровий чат! Будь чемним 🙂" },
            { from: "Сонечко_7", text: "Хто грає в перегони?" },
            { from: "Котик_2011", text: "Привіт! Давай дружити 😺" },
            { from: "Котик_2011", text: "Я дам тобі 1000 монет у грі! Напиши тільки свій пароль і де ти живеш." }
          ],
          reply: "Ура! А тепер скажи номер маминого телефону 😼"
        }
      ]
    },
    правила: {
      title: "Правила — Ігри онлайн",
      keywords: ["правила", "безпека"],
      blocks: [
        { type: "heading", text: "Правила безпечної гри" },
        {
          type: "list",
          items: [
            "Нікому не кажи свій пароль, навіть друзям.",
            "Не пиши в чаті своє прізвище, адресу, номер телефону і назву школи.",
            "Якщо хтось просить секрети або пише щось неприємне — не відповідай і розкажи дорослому.",
            "Натисни «Поскаржитися», і модератор перевірить повідомлення."
          ]
        }
      ]
    }
  }
}

/** A bright bait site: no lock, a strange domain, a prize for nothing and a form for personal data. */
export const pryz: Site = {
  host: "приз-телефон.win",
  aliases: ["pryz-telefon.win"],
  name: "СУПЕР ПРИЗ!!!",
  icon: "🎁",
  color: "#db2777",
  secure: false,
  pages: {
    "": {
      title: "ТИ ВИГРАВ ТЕЛЕФОН!!!",
      adKeywords: ["казки", "ігри", "мультфільми", "телефон"],
      blocks: [
        { type: "banner", text: "🎉🎉 ВІТАЄМО!!! ТИ ВИГРАВ НОВИЙ ТЕЛЕФОН!!! 🎉🎉", url: "/" },
        { type: "text", text: "Залишилося лише 2 хвилини! Заповни форму, і телефон приїде до тебе вже завтра. Це абсолютно безкоштовно!!!" },
        { type: "form", id: "prize", title: "Отримати приз", fields: ["Ім'я та прізвище", "Номер телефону мами", "Домашня адреса"], button: "ОТРИМАТИ ТЕЛЕФОН" }
      ]
    }
  }
}

/** A copy of the school diary on a strange address, without the lock: it collects logins and passwords. */
export const fakeDiary: Site = {
  host: "щоденник-школа.xyz",
  aliases: ["shchodennyk-shkola.xyz"],
  name: "Наша школа",
  icon: "🏫",
  color: "#065f46",
  secure: false,
  pages: {
    "": {
      title: "Вхід у щоденник — Наша школа",
      adKeywords: ["щоденник", "вхід у щоденник", "оцінки"],
      blocks: [
        { type: "heading", text: "Електронний щоденник" },
        { type: "text", text: "УВАГА! Твій щоденник буде заблоковано через 10 хвилин! Терміново увійди, щоб зберегти оцінки." },
        { type: "form", id: "fake-login", title: "Вхід у щоденник", fields: ["Логін", "Пароль"], button: "Увійти" }
      ]
    }
  }
}

/** A site that offers fairy tales but asks to download a program first. */
export const kazkyFree: Site = {
  host: "казки-безкоштовно.xyz",
  aliases: ["kazky-bezkoshtovno.xyz"],
  name: "Безкоштовні казки",
  icon: "📕",
  color: "#b45309",
  secure: false,
  pages: {
    "": {
      title: "Безкоштовні казки — читай без реєстрації",
      keywords: ["казки", "казка", "безкоштовно", "читати"],
      blocks: [
        { type: "heading", text: "Усі казки світу безкоштовно!" },
        { type: "text", text: "Щоб читати казки, спершу завантаж і запусти нашу програму-читалку." },
        { type: "download", file: "казки-читалка.exe", label: "Завантажити читалку", size: "3 МБ", virus: true },
        { type: "banner", text: "🎁 Натисни тут і отримай подарунок!", url: "приз-телефон.win" }
      ]
    }
  }
}

/** A site with a game to download, and the file has a virus. */
export const freeGames: Site = {
  host: "безкоштовні-ігри.xyz",
  aliases: ["bezkoshtovni-igry.xyz"],
  name: "Безкоштовні ігри",
  icon: "🕹️",
  color: "#0f766e",
  secure: false,
  pages: {
    "": {
      title: "Супер-гонки — завантажити безкоштовно",
      keywords: ["ігри", "гра", "гонки", "завантажити"],
      blocks: [
        { type: "heading", text: "🏁 Супер-гонки 3000" },
        { type: "photo", art: "🏎️", caption: "Гра «Супер-гонки 3000»", author: "Студія «Швидкі колеса»", bg: "#ccfbf1" },
        { type: "text", text: "Найкраща гра року! Завантаж просто зараз — безкоштовно і без реєстрації." },
        { type: "download", file: "супер-гонки.exe", label: "Завантажити гру", size: "12 МБ", virus: true }
      ]
    }
  }
}
