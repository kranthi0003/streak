import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  srcDir: "src",
  // Output to a visible folder (not the default hidden `.output`)
  // so `npm run build` writes to `dist/chrome-mv3/` and you can find it.
  outDir: "dist",
  manifest: {
    name: "Streak — Stay focused, stay clean",
    description:
      "Block adult sites, filter search results, and protect your streak. Privacy-first, no account required.",
    // "spanning" → same storage + service worker shared between normal and
    // incognito windows. User still has to enable "Allow in incognito" once.
    incognito: "spanning",
    permissions: [
      "storage",
      "declarativeNetRequest",
      "declarativeNetRequestFeedback",
      "webNavigation",
      "tabs",
      "alarms",
    ],
    host_permissions: ["<all_urls>"],
    action: {
      default_title: "Streak",
      default_popup: "popup.html",
    },
    options_ui: {
      page: "options.html",
      open_in_tab: true,
    },
    web_accessible_resources: [
      {
        resources: ["blocked.html"],
        matches: ["<all_urls>"],
      },
    ],
    declarative_net_request: {
      rule_resources: [
        {
          id: "blocklist",
          enabled: true,
          path: "rules/blocklist.json",
        },
      ],
    },
  },
});
