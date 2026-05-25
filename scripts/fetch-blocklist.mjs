#!/usr/bin/env node
// Fetch and convert public porn hosts blocklists into a single deduped seed.
//
// Source: Steven Black's unified hosts (porn variant) — MIT licensed, well-
// curated, used by uBlock Origin and other privacy projects.
//   https://github.com/StevenBlack/hosts
//
// We pull the "porn-only" variant, parse the hosts file, strip aliases,
// dedupe, and emit JSON in our DNR-rule-friendly format.
//
// Run with:  node scripts/fetch-blocklist.mjs
// Output:    src/public/rules/_seed.json (overwrites)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../src/_seed.json");

const SOURCES = [
  // Steven Black — porn only, no general malware/ads bloat
  "https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/porn-only/hosts",
];

// Chrome MV3 caps static DNR rules at 30,000 per ruleset.
// Leave headroom: 25k. Pulling more than this requires multiple rulesets.
const MAX_RULES = 25_000;

// Always-include extras (manually curated — sites Steven Black sometimes misses).
const MANUAL_EXTRAS = [
  "onlyfans.com",
  "fansly.com",
  "justfor.fans",
  "manyvids.com",
  "chaturbate.com",
  "stripchat.com",
  "cam4.com",
  "bongacams.com",
  "livejasmin.com",
  "redgifs.com",
];

// Educational / recovery resources we never want to block by mistake.
// Used by heuristic scanner exemptions in src/lib/blocklist.ts.
// (Not used by DNR rules — those only block, they don't allow.)
const RECOVERY_DOMAINS = [
  "reddit.com",
  "nofap.com",
  "rebootnation.org",
  "yourbrainonporn.com",
  "fortifyprogram.org",
  "wikipedia.org",
  "github.com",
];

async function fetchSource(url) {
  console.log(`Fetching: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return await res.text();
}

function parseHosts(text) {
  // hosts-file format: "0.0.0.0 example.com" — we only want example.com.
  const domains = new Set();
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) continue;
    const domain = parts[1].toLowerCase();
    // Sanity check: must be a valid-looking domain
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) continue;
    if (domain === "0.0.0.0" || domain === "localhost") continue;
    domains.add(domain);
  }
  return domains;
}

const allDomains = new Set();
for (const url of SOURCES) {
  const text = await fetchSource(url);
  for (const d of parseHosts(text)) allDomains.add(d);
}
for (const d of MANUAL_EXTRAS) allDomains.add(d.toLowerCase());

// Remove recovery domains (defensive — Steven Black shouldn't have these,
// but make absolutely sure).
for (const d of RECOVERY_DOMAINS) allDomains.delete(d);

const sorted = [...allDomains].sort();
const capped = sorted.slice(0, MAX_RULES);

const seed = capped.map((domain, i) => ({ id: i + 1, domain }));

fs.writeFileSync(OUT, JSON.stringify(seed, null, 0) + "\n");
console.log(`Wrote ${seed.length} domains to ${OUT}`);
if (sorted.length > MAX_RULES) {
  console.log(
    `Warning: source had ${sorted.length} domains, capped to ${MAX_RULES} (Chrome DNR limit).`
  );
}
