# Streak — Stay focused, stay clean

A free, privacy-first browser extension that blocks distracting adult sites, filters search results, and helps you protect your streak. No account, no tracking, no server.

> Built for people working on digital wellbeing and habit recovery. Open source. MIT licensed.

## Install (early access — no app store yet)

We're in early access while we gather feedback. Pick your browser:

### 🦊 Firefox (easiest — one click)
*Coming soon — signed `.xpi` will be attached to the [latest release](https://github.com/kranthi0003/streak/releases). Until then, use Firefox Developer Edition or Nightly with `xpinstall.signatures.required = false` in `about:config`.*

1. Download `streak-firefox.zip` from the [latest release](https://github.com/kranthi0003/streak/releases).
2. Open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on…**, pick the zip's `manifest.json`
4. Done. (Temporary add-ons disappear on Firefox restart — signed XPI coming in v0.2.)

### 🟢 Chrome / Brave / Edge / Arc
1. Download `streak-chrome.zip` from the [latest release](https://github.com/kranthi0003/streak/releases) and unzip it.
2. Open `chrome://extensions` (or `edge://extensions`, `brave://extensions`, etc.)
3. Toggle **Developer mode** ON (top-right)
4. Click **Load unpacked**, pick the unzipped folder
5. Pin the Streak icon to your toolbar

> **Why isn't this on the Chrome Web Store yet?** We're validating with early users first. The store version comes after v0.5 once features stabilise.

## Features (MVP — v0.1)

- 🛑 **Domain blocking** — curated list of known adult sites (currently 15, expanding)
- 🔍 **Search filtering** — forces SafeSearch on Google / Bing / DuckDuckGo
- 🧠 **Content heuristics** — catches new/unknown sites by scanning page title + meta keywords
- ⏳ **Tamper resistance** — PIN-protected disable + configurable cooldown (default 24 hours)
- 🔥 **Streak counter** — track days clean with milestones (1d, 3d, 7d, 14d, 30d, 60d, 90d, 180d, 365d)
- 🆘 **Panic page** — when blocked, see your streak, a 4-7-8 breathing exercise, and a reflective journal prompt
- 🔒 **Privacy-first** — all data stored locally. No server. No telemetry. No account.

## Build from source (alternative install)

If you'd rather build it yourself instead of downloading the release zip:

```bash
git clone https://github.com/kranthi0003/streak.git
cd streak
npm install
npm run build           # writes to ./dist/chrome-mv3
npm run build:firefox   # writes to ./dist/firefox-mv2
```

Then in Chrome: `chrome://extensions` → Developer mode ON → **Load unpacked** → select the `dist/chrome-mv3` folder inside the cloned `streak` directory.

### Where exactly is the folder?

If you cloned into your home directory, the path is:
- **macOS / Linux:** `~/streak/dist/chrome-mv3`
- **Windows:** `C:\Users\<you>\streak\dist\chrome-mv3`

(It's a regular folder — visible in Finder/Explorer. The Chrome "Load unpacked" picker needs you to **select the `chrome-mv3` folder itself**, not double-click into it.)

### Enable in Incognito / Private mode

Chrome disables every extension in Incognito by default. To make Streak work there too:

1. `chrome://extensions` → find the Streak card → click **Details**
2. Scroll to **"Allow in Incognito"** → toggle it ON

Firefox: `about:addons` → Streak → Permissions → enable **"Run in Private Windows"**.

## Cross-browser support

Built with [WXT](https://wxt.dev/) — single codebase ships to Chrome, Firefox, Edge, Brave, Arc, Opera, and (later) Safari.

```bash
npm run build           # Chrome MV3  → ./dist/chrome-mv3
npm run build:firefox   # Firefox MV2 → ./dist/firefox-mv2
npm run zip             # Production zip → ./dist/streak-<ver>-chrome.zip
npm run dev             # Live-reload dev mode
```

## Project layout

```
src/
  entrypoints/
    background.ts          # Service worker: rule updates, streak tick, cooldown
    content.ts             # Content script: heuristic scan + SafeSearch enforcement
    popup/                 # Toolbar popup (streak, quick disable)
    options/               # Settings page (PIN, blocklist, allowlist, cooldown)
    blocked/               # The "panic" page shown on block
  public/
    rules/blocklist.json   # Generated declarativeNetRequest rules
    rules/_seed.json       # Source domain list (edit this, run scripts/build-rules.mjs)
  lib/
    storage.ts             # Typed wrappers around chrome.storage.local
    streak.ts              # Streak math + milestones
    blocklist.ts           # Heuristic categoriser
    pin.ts                 # PIN hashing (SHA-256)
scripts/
  build-rules.mjs          # Generates DNR rules from _seed.json
```

## Roadmap

- **v0.2** — Signed Firefox XPI, expanded blocklist (5k+ domains), custom blocklist DNR wiring
- **v0.3** — Accountability partner notifications
- **v0.4** — AI urge-support chat (privacy-preserving, opt-in)
- **v0.5** — Chrome Web Store + Firefox AMO listing
- **v1.0** — Cross-device sync (optional, opt-in account) and premium tier

## Contributing

Issues and PRs welcome. The blocklist (`src/public/rules/_seed.json`) is community-curated — PRs to add domains are appreciated.

## Privacy

Streak collects **zero** data. Everything (your streak, PIN hash, custom blocklist, allowlist, settings) lives in your browser's local storage. There is no server. There is no account. There is no analytics. There is no telemetry.

If you uninstall the extension, all data is removed by the browser.

## Honest disclaimer

- No blocker is perfect. Determined users can always bypass. Streak adds **friction**, not impossibility.
- This is a digital wellbeing tool. It is not a replacement for therapy, counselling, or peer support.
- The curated blocklist is small (v0.1) and expanding. If a site is missed, add it to your custom blocklist in Settings.

## Licence

MIT
