import { defineContentScript } from "wxt/sandbox";
import { scanPage } from "@/lib/blocklist";
import { get } from "@/lib/storage";

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_end",
  async main() {
    const protection = await get("protection");
    if (!protection.enabled) return;

    const settings = await get("settings");

    // Heuristic scan: if title/meta look adult, redirect to blocked page.
    if (settings.heuristicScan) {
      const result = scanPage(document);
      if (result.blocked) {
        chrome.runtime.sendMessage({
          type: "redirect-blocked",
          from: location.hostname,
          matches: result.matches,
        });
        // Clear page immediately so user sees a clean intermediate state.
        document.documentElement.innerHTML = "";
        return;
      }
    }

    // Enforce SafeSearch on common search engines by appending the params.
    if (settings.enforceSafeSearch) {
      const host = location.hostname;
      const url = new URL(location.href);
      let changed = false;

      if (host.includes("google.")) {
        if (url.searchParams.get("safe") !== "active") {
          url.searchParams.set("safe", "active");
          changed = true;
        }
      } else if (host.includes("bing.")) {
        if (url.searchParams.get("adlt") !== "strict") {
          url.searchParams.set("adlt", "strict");
          changed = true;
        }
      } else if (host.includes("duckduckgo.")) {
        if (url.searchParams.get("kp") !== "1") {
          url.searchParams.set("kp", "1");
          changed = true;
        }
      }

      if (changed) location.replace(url.toString());
    }
  },
});
