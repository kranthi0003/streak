/**
 * Dynamic DNR rule sync — keeps Chrome's network-layer blocking in sync with
 * the user's custom blocklist and allowlist settings.
 *
 * Rule ID convention (must not collide with the 25k static rules from
 * blocklist.json, which use IDs 1..25000):
 *   - Custom block rules:  100_000 + index
 *   - Allow rules:         200_000 + index
 *
 * Allow rules use a higher `priority` than block rules so they win the match.
 */
import { get } from "./storage";

const CUSTOM_BLOCK_ID_BASE = 100_000;
const ALLOW_ID_BASE = 200_000;

export async function syncDynamicRules(): Promise<void> {
  const settings = await get("settings");

  // Wipe our previous dynamic rules first.
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeIds = existing
    .map((r) => r.id)
    .filter((id) => id >= CUSTOM_BLOCK_ID_BASE && id < ALLOW_ID_BASE + 100_000);

  const blockRules = settings.customBlocklist.map((domain, i) => ({
    id: CUSTOM_BLOCK_ID_BASE + i,
    priority: 1,
    action: {
      type: "redirect" as chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: {
        extensionPath: `/blocked.html?from=${encodeURIComponent(domain)}&reason=custom`,
      },
    },
    condition: {
      requestDomains: [domain],
      resourceTypes: [
        "main_frame" as chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
      ],
    },
  }));

  const allowRules = settings.allowlist.map((domain, i) => ({
    id: ALLOW_ID_BASE + i,
    priority: 2, // higher than block rules — allow wins
    action: {
      type: "allow" as chrome.declarativeNetRequest.RuleActionType.ALLOW,
    },
    condition: {
      requestDomains: [domain],
      resourceTypes: [
        "main_frame" as chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
      ],
    },
  }));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeIds,
    addRules: [...blockRules, ...allowRules],
  });
}
