// Build the declarativeNetRequest rules file from the seed domain list.
// Run via `node scripts/build-rules.mjs` (also wired into wxt prepare).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.resolve(__dirname, "../src/public/rules/_seed.json");
const outPath = path.resolve(__dirname, "../src/public/rules/blocklist.json");
const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));

const rules = seed.map(({ id, domain }) => ({
  id,
  priority: 1,
  action: {
    type: "redirect",
    redirect: {
      extensionPath: `/blocked.html?from=${encodeURIComponent(domain)}`,
    },
  },
  condition: {
    requestDomains: [domain],
    resourceTypes: ["main_frame"],
  },
}));

fs.writeFileSync(outPath, JSON.stringify(rules, null, 2));
console.log(`Wrote ${rules.length} rules to ${outPath}`);
