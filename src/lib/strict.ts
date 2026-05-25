/**
 * Strict Mode — when enabled, protection is locked for N days. During the
 * lock window:
 *   - the "Disable protection" button is hidden in the popup
 *   - the cooldown-cancel button is hidden
 *   - settings are read-only (cooldown, blocklist removal, allowlist add/remove)
 *   - blocklist *additions* are still allowed (you can only make it stricter)
 *   - Strict Mode itself cannot be turned off
 *
 * The only escape is uninstalling the extension. We can't prevent that — it's
 * a browser-level action. Be honest about this in the UI.
 */
import { get, set, type StrictModeState } from "./storage";

const DAY_MS = 24 * 60 * 60 * 1000;

export const LOCK_DURATIONS: ReadonlyArray<{ days: number; label: string }> = [
  { days: 1, label: "1 day" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

export async function isStrictActive(now: number = Date.now()): Promise<boolean> {
  const s = await get("strict");
  if (!s.active) return false;
  // Lock has passed → auto-expire so the user can disable if they want.
  if (s.lockedUntil && now >= s.lockedUntil) return false;
  return true;
}

export async function isStrictLocked(now: number = Date.now()): Promise<boolean> {
  const s = await get("strict");
  return Boolean(s.active && s.lockedUntil && now < s.lockedUntil);
}

export async function enableStrict(days: number): Promise<StrictModeState> {
  if (!LOCK_DURATIONS.some((d) => d.days === days)) {
    throw new Error(`Invalid strict mode duration: ${days}`);
  }
  const next: StrictModeState = {
    active: true,
    enabledAt: Date.now(),
    lockedUntil: Date.now() + days * DAY_MS,
  };
  await set("strict", next);
  return next;
}

export async function disableStrict(): Promise<void> {
  if (await isStrictLocked()) {
    throw new Error("Strict mode is locked. Wait for the lock to expire.");
  }
  await set("strict", { active: false, lockedUntil: null, enabledAt: null });
}

export function daysLeftInLock(lockedUntil: number, now: number = Date.now()): number {
  return Math.max(0, Math.ceil((lockedUntil - now) / DAY_MS));
}

export function hoursLeftInLock(lockedUntil: number, now: number = Date.now()): number {
  return Math.max(0, Math.ceil((lockedUntil - now) / (60 * 60 * 1000)));
}
