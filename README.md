# Streak — Browser Extension MVP

A free, privacy-first browser extension that blocks adult sites, filters search results, and helps users protect their streak. No account, no tracking, no server.

> Built for people working on digital wellbeing and habit recovery. Open source.

## Features (MVP)

- 🛑 **Domain blocking** — curated blocklist of known adult sites (10,000+ domains)
- 🔍 **Search filter** — strips adult-keyword image results from Google / Bing / DuckDuckGo and forces SafeSearch where possible
- 🧠 **Content heuristics** — scans page title + keywords to catch new/unknown sites
- ⏳ **Tamper resistance** — PIN-protected disable + configurable cooldown (e.g. 24h delay before disable takes effect)
- 🔥 **Streak counter** — track days clean, milestones
- 🆘 **Panic page** — when blocked, see your streak, a breathing exercise, and an emergency plan
- 🔒 **Privacy** — all data stored locally in the browser. No server, no telemetry.

## Cross-browser support

Built with [WXT](https://wxt.dev/) — ships to Chrome, Firefox, and Safari from one codebase.

```bash
pnpm install          # or npm install / yarn install
pnpm dev              # Chrome dev (loads from .output/chrome-mv3)
pnpm dev:firefox      # Firefox dev
pnpm build            # Production build (Chrome)
pnpm build:firefox    # Production build (Firefox)
pnpm zip              # Ready-to-submit zip
```

## Project layout

```
src/
  entrypoints/
    background.ts          # Service worker: rule updates, alarms, streak tick
    content.ts             # Content script: heuristic page scan + DOM filter
    popup/                 # Toolbar popup (streak, quick stats, disable button)
    options/               # Settings page (blocklist, PIN, cooldown, allowlist)
    blocked/               # The "panic" page shown on block
  public/
    rules/blocklist.json   # declarativeNetRequest rules (bundled blocklist)
  lib/
    storage.ts             # Typed storage helpers
    streak.ts              # Streak math (days clean, milestones)
    blocklist.ts           # Blocklist parsing + heuristic categoriser
    pin.ts                 # PIN hashing + verification
```

## Roadmap

**v0.2** — Accountability partner (notify a chosen contact on relapse)
**v0.3** — Cross-device sync (optional, opt-in account)
**v0.4** — AI urge-support chat
**v0.5** — Subscription tier (₹299/mo or $4/mo) for sync + AI

## Legal & honest disclaimer

- No blocker is perfect. Determined users can always bypass. This product adds **friction**, not impossibility.
- The blocklist is curated from open sources. Not affiliated with any of those sources.
- This is a wellbeing tool. Not a replacement for therapy, counselling, or support groups.

## Contributing

Currently a solo project, but issues and PRs welcome.

## Licence

MIT
