import { defineBackground } from "wxt/sandbox";
import { get, onChanged, update } from "@/lib/storage";
import { syncDynamicRules } from "@/lib/dynamic-rules";

export default defineBackground(() => {
  // Initialise state on first install.
  chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === "install") {
      await update("streak", (s) => ({ ...s, startedAt: Date.now() }));
    }
    // Always sync dynamic rules after install/update.
    void syncDynamicRules();
  });

  // Re-sync dynamic rules whenever settings change (covers blocklist/allowlist edits).
  onChanged("settings", () => {
    void syncDynamicRules();
  });

  // Daily heartbeat — refreshes streak math, updates badge text.
  chrome.alarms.create("streak-tick", { periodInMinutes: 60 });
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== "streak-tick") return;
    const streak = await get("streak");
    const days = Math.max(0, Math.floor((Date.now() - streak.startedAt) / 86_400_000));
    chrome.action.setBadgeText({ text: days > 0 ? String(days) : "" });
    chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
  });

  // Pending-disable cooldown: clears the protection.cooldownUntil once due.
  chrome.alarms.create("cooldown-check", { periodInMinutes: 1 });
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== "cooldown-check") return;
    const p = await get("protection");
    if (p.cooldownUntil && Date.now() >= p.cooldownUntil) {
      await update("protection", () => ({ enabled: false, cooldownUntil: null }));
      // Pause the network rules.
      try {
        await chrome.declarativeNetRequest.updateEnabledRulesets({
          disableRulesetIds: ["blocklist"],
        });
      } catch {
        /* ignore — only available with declarative_net_request perm */
      }
    }
  });

  // Re-enable protection on extension startup if it was on, and re-sync dynamic rules.
  chrome.runtime.onStartup.addListener(async () => {
    const p = await get("protection");
    try {
      if (p.enabled) {
        await chrome.declarativeNetRequest.updateEnabledRulesets({
          enableRulesetIds: ["blocklist"],
        });
      } else {
        await chrome.declarativeNetRequest.updateEnabledRulesets({
          disableRulesetIds: ["blocklist"],
        });
      }
    } catch {
      /* ignore */
    }
    void syncDynamicRules();
  });

  // Messaging entry point for the content script's heuristic blocker.
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === "redirect-blocked") {
      sendResponse({ ok: true });
      const from = encodeURIComponent(msg.from ?? "heuristic");
      const url = chrome.runtime.getURL(`blocked.html?from=${from}&reason=heuristic`);
      if (_sender.tab?.id) chrome.tabs.update(_sender.tab.id, { url });
      return true;
    }
    return false;
  });
});
