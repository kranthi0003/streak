/**
 * Blocklist helpers + heuristic categoriser.
 *
 * declarativeNetRequest handles the bulk-domain blocking declaratively at the
 * network layer (very fast, no per-request callback). The heuristic scanner
 * runs in the content script and catches pages that *aren't* on the list but
 * smell adult (title/keyword density).
 */

// Keep this list short, evidence-based, and easy to audit. Tune by usage.
// All matches are case-insensitive against the lowercased document title +
// meta[name=keywords] + meta[name=description].
const HEURISTIC_KEYWORDS: ReadonlyArray<string> = [
  "porn", "xxx", "nsfw", "hentai", "nude", "naked", "erotic",
  "sex video", "sex tube", "adult video", "adult tube",
  "milf", "anal", "blowjob", "camgirl", "onlyfans leak",
];

/**
 * Domains where the heuristic scan is SKIPPED — these often legitimately
 * contain "porn" or "nofap" in titles/articles (recovery content, news,
 * encyclopedias) and would be false-positives.
 */
const RECOVERY_DOMAINS: ReadonlyArray<string> = [
  "reddit.com",
  "old.reddit.com",
  "nofap.com",
  "rebootnation.org",
  "yourbrainonporn.com",
  "fortifyprogram.org",
  "wikipedia.org",
  "wikimedia.org",
  "github.com",
  "youtube.com",
  "medium.com",
  "substack.com",
  "nytimes.com",
  "bbc.com",
  "bbc.co.uk",
  "theguardian.com",
  "psychologytoday.com",
  "healthline.com",
  "webmd.com",
  "mayoclinic.org",
];

/** Returns true if the heuristic scan should be skipped on this hostname. */
export function isRecoveryDomain(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^www\./, "");
  return RECOVERY_DOMAINS.some((d) => h === d || h.endsWith(`.${d}`));
}

export interface HeuristicResult {
  blocked: boolean;
  score: number; // 0..1
  matches: string[];
}

export function scanPage(doc: Document): HeuristicResult {
  // Always skip recovery/educational domains.
  if (isRecoveryDomain(location.hostname)) {
    return { blocked: false, score: 0, matches: [] };
  }

  const haystacks = [
    doc.title,
    (doc.querySelector('meta[name="keywords"]') as HTMLMetaElement | null)?.content ?? "",
    (doc.querySelector('meta[name="description"]') as HTMLMetaElement | null)?.content ?? "",
  ]
    .join(" ")
    .toLowerCase();

  const matches: string[] = [];
  for (const kw of HEURISTIC_KEYWORDS) {
    if (haystacks.includes(kw)) matches.push(kw);
  }

  // Need at least 2 distinct matches OR one of the strongest signals to block.
  // "porn" alone is no longer a strong signal — too many false-positives on
  // recovery content. Require it to appear with another match.
  const strongSignals = ["xxx", "hentai", "sex video", "sex tube", "adult tube"];
  const hasStrong = matches.some((m) => strongSignals.includes(m));
  const blocked = matches.length >= 2 || hasStrong;
  const score = Math.min(1, matches.length / 4);
  return { blocked, score, matches };
}

/** Normalise a user-typed domain (strip protocol, path, www., trailing dot). */
export function normaliseDomain(input: string): string {
  let s = input.trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "");
  s = s.split("/")[0];
  s = s.replace(/^www\./, "").replace(/\.$/, "");
  return s;
}
