/**
 * Storage layer — typed wrappers around browser.storage.local.
 * All Streak state lives here; no server, no sync (MVP).
 */

export interface StreakState {
  startedAt: number; // epoch ms when current streak began
  longestDays: number;
  relapses: Array<{ at: number; note?: string }>;
}

export interface ProtectionState {
  enabled: boolean;
  cooldownUntil: number | null; // epoch ms; if set, "disable" is pending
}

export interface StrictModeState {
  active: boolean;
  lockedUntil: number | null; // epoch ms; cannot be turned off until this passes
  enabledAt: number | null;
}

export interface PinState {
  hash: string | null; // sha-256 hex, empty if PIN not set
  setAt: number | null;
}

export interface Settings {
  cooldownHours: number; // delay before disable takes effect
  blockSearchResults: boolean;
  enforceSafeSearch: boolean;
  heuristicScan: boolean;
  customBlocklist: string[]; // user-added domains
  allowlist: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  cooldownHours: 24,
  blockSearchResults: true,
  enforceSafeSearch: true,
  heuristicScan: true,
  customBlocklist: [],
  allowlist: [],
};

export const DEFAULT_STREAK: StreakState = {
  startedAt: Date.now(),
  longestDays: 0,
  relapses: [],
};

export const DEFAULT_PROTECTION: ProtectionState = {
  enabled: true,
  cooldownUntil: null,
};

export const DEFAULT_STRICT: StrictModeState = {
  active: false,
  lockedUntil: null,
  enabledAt: null,
};

export const DEFAULT_PIN: PinState = { hash: null, setAt: null };

type Keys = {
  streak: StreakState;
  protection: ProtectionState;
  strict: StrictModeState;
  pin: PinState;
  settings: Settings;
};

const DEFAULTS: Keys = {
  streak: DEFAULT_STREAK,
  protection: DEFAULT_PROTECTION,
  strict: DEFAULT_STRICT,
  pin: DEFAULT_PIN,
  settings: DEFAULT_SETTINGS,
};

export async function get<K extends keyof Keys>(key: K): Promise<Keys[K]> {
  const result = await chrome.storage.local.get(key);
  return (result[key] as Keys[K]) ?? DEFAULTS[key];
}

export async function set<K extends keyof Keys>(key: K, value: Keys[K]): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

export async function update<K extends keyof Keys>(
  key: K,
  updater: (current: Keys[K]) => Keys[K]
): Promise<Keys[K]> {
  const current = await get(key);
  const next = updater(current);
  await set(key, next);
  return next;
}

export function onChanged<K extends keyof Keys>(
  key: K,
  cb: (next: Keys[K]) => void
): () => void {
  const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
    if (key in changes) cb(changes[key].newValue as Keys[K]);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
