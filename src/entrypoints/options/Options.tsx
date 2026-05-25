import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, get, set, type Settings } from "@/lib/storage";
import { normaliseDomain } from "@/lib/blocklist";
import { clearPin, hasPin, setPin } from "@/lib/pin";
import {
  daysLeftInLock,
  disableStrict,
  enableStrict,
  hoursLeftInLock,
  isStrictLocked,
  LOCK_DURATIONS,
} from "@/lib/strict";

export function Options() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [pinIsSet, setPinIsSet] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [oldPin, setOldPin] = useState("");
  const [domainInput, setDomainInput] = useState("");
  const [allowInput, setAllowInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [strictLocked, setStrictLocked] = useState(false);
  const [strictLockUntil, setStrictLockUntil] = useState<number | null>(null);
  const [strictActive, setStrictActive] = useState(false);
  const [pickerDays, setPickerDays] = useState<number>(7);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    const [s, hp, strict, locked] = await Promise.all([
      get("settings"),
      hasPin(),
      get("strict"),
      isStrictLocked(),
    ]);
    setSettings(s);
    setPinIsSet(hp);
    setStrictActive(strict.active);
    setStrictLocked(locked);
    setStrictLockUntil(strict.lockedUntil);
  }

  async function save(next: Settings) {
    setSettings(next);
    await set("settings", next);
    setStatus("Saved");
    setTimeout(() => setStatus(null), 1500);
  }

  async function addBlock() {
    const d = normaliseDomain(domainInput);
    if (!d) return;
    await save({ ...settings, customBlocklist: Array.from(new Set([...settings.customBlocklist, d])) });
    setDomainInput("");
  }

  async function addAllow() {
    if (strictLocked) {
      setStatus("Strict Mode active — allowlist additions are locked.");
      return;
    }
    const d = normaliseDomain(allowInput);
    if (!d) return;
    await save({ ...settings, allowlist: Array.from(new Set([...settings.allowlist, d])) });
    setAllowInput("");
  }

  async function removeFromList(key: "customBlocklist" | "allowlist", domain: string) {
    if (strictLocked) {
      setStatus("Strict Mode active — removing from blocklist/allowlist is locked.");
      return;
    }
    await save({ ...settings, [key]: settings[key].filter((d) => d !== domain) });
  }

  async function handleEnableStrict() {
    try {
      const next = await enableStrict(pickerDays);
      setStrictActive(true);
      setStrictLocked(true);
      setStrictLockUntil(next.lockedUntil);
      setStatus(`Strict Mode enabled for ${pickerDays} day${pickerDays === 1 ? "" : "s"}`);
    } catch (e) {
      setStatus((e as Error).message);
    }
  }

  async function handleDisableStrict() {
    try {
      await disableStrict();
      setStrictActive(false);
      setStrictLocked(false);
      setStrictLockUntil(null);
      setStatus("Strict Mode disabled");
    } catch (e) {
      setStatus((e as Error).message);
    }
  }

  async function handleSetPin() {
    try {
      await setPin(newPin);
      setNewPin("");
      setPinIsSet(true);
      setStatus("PIN saved");
    } catch (e) {
      setStatus((e as Error).message);
    }
  }

  async function handleClearPin() {
    if (strictLocked) {
      setStatus("Strict Mode active — PIN cannot be cleared.");
      return;
    }
    try {
      await clearPin(oldPin);
      setOldPin("");
      setPinIsSet(false);
      setStatus("PIN cleared");
    } catch (e) {
      setStatus((e as Error).message);
    }
  }

  return (
    <div className="container">
      <header>
        <h1>Streak — Settings</h1>
        <p className="sub">Privacy-first. All data lives in this browser.</p>
      </header>

      <section>
        <h2>🔒 Strict Mode</h2>
        {!strictActive && (
          <>
            <p className="hint" style={{ marginBottom: 12 }}>
              Lock protection so it cannot be turned off for a period you choose.
              Once enabled, the disable button disappears, the cooldown shortcut
              is hidden, and you can only make the blocklist <em>stricter</em> —
              never weaker — until the lock expires.
            </p>
            <div className="row">
              <select
                value={pickerDays}
                onChange={(e) => setPickerDays(Number(e.target.value))}
              >
                {LOCK_DURATIONS.map((d) => (
                  <option key={d.days} value={d.days}>
                    {d.label}
                  </option>
                ))}
              </select>
              <button onClick={() => void handleEnableStrict()}>Enable Strict Mode</button>
            </div>
            <p className="hint" style={{ marginTop: 12 }}>
              <strong>Honest limit:</strong> uninstalling the extension still removes Streak.
              That's a browser-level action no extension can prevent. Strict Mode adds friction;
              it doesn't make bypass impossible.
            </p>
          </>
        )}

        {strictActive && strictLocked && strictLockUntil && (
          <div className="strict-banner">
            <p>
              <strong>🔒 Locked</strong> —{" "}
              {daysLeftInLock(strictLockUntil) >= 1
                ? `${daysLeftInLock(strictLockUntil)} day${daysLeftInLock(strictLockUntil) === 1 ? "" : "s"}`
                : `${hoursLeftInLock(strictLockUntil)} hours`}{" "}
              remaining until you can disable Strict Mode.
            </p>
            <p className="hint">Lock expires {new Date(strictLockUntil).toLocaleString()}</p>
          </div>
        )}

        {strictActive && !strictLocked && (
          <div className="row">
            <p style={{ flex: 1, margin: 0 }}>
              Lock period has expired. You can disable Strict Mode now, or it stays on.
            </p>
            <button onClick={() => void handleDisableStrict()}>Disable Strict Mode</button>
          </div>
        )}
      </section>

      <section>
        <h2>Behaviour</h2>
        <label className="row-toggle">
          <input
            type="checkbox"
            checked={settings.blockSearchResults}
            disabled={strictLocked}
            onChange={(e) => void save({ ...settings, blockSearchResults: e.target.checked })}
          />
          <span>Filter adult content from search results (Google, Bing, DuckDuckGo)</span>
        </label>
        <label className="row-toggle">
          <input
            type="checkbox"
            checked={settings.enforceSafeSearch}
            disabled={strictLocked}
            onChange={(e) => void save({ ...settings, enforceSafeSearch: e.target.checked })}
          />
          <span>Force SafeSearch on search engines</span>
        </label>
        <label className="row-toggle">
          <input
            type="checkbox"
            checked={settings.heuristicScan}
            disabled={strictLocked}
            onChange={(e) => void save({ ...settings, heuristicScan: e.target.checked })}
          />
          <span>Heuristic page scan (catch sites not on the blocklist)</span>
        </label>

        <label className="row">
          Disable cooldown (hours)
          <input
            type="number"
            min={0}
            max={168}
            value={settings.cooldownHours}
            disabled={strictLocked}
            onChange={(e) => void save({ ...settings, cooldownHours: Number(e.target.value) })}
          />
        </label>
        <p className="hint">
          When you choose to disable protection, this delay applies before it actually turns off.
          Higher = harder to bypass in a weak moment.{" "}
          {strictLocked && <em>(locked while Strict Mode is active)</em>}
        </p>
      </section>

      <section>
        <h2>PIN protection</h2>
        {pinIsSet ? (
          <div className="row">
            <input
              type="password"
              placeholder="Current PIN"
              value={oldPin}
              onChange={(e) => setOldPin(e.target.value)}
            />
            <button onClick={() => void handleClearPin()}>Clear PIN</button>
          </div>
        ) : (
          <div className="row">
            <input
              type="password"
              placeholder="New PIN (min 4 chars)"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
            />
            <button onClick={() => void handleSetPin()}>Set PIN</button>
          </div>
        )}
        <p className="hint">PIN is required to start the disable cooldown.</p>
      </section>

      <section>
        <h2>Custom blocklist</h2>
        <div className="row">
          <input
            type="text"
            placeholder="example.com"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void addBlock()}
          />
          <button onClick={() => void addBlock()}>Add</button>
        </div>
        <ul className="chips">
          {settings.customBlocklist.map((d) => (
            <li key={d}>
              {d}
              <button onClick={() => void removeFromList("customBlocklist", d)} aria-label={`remove ${d}`}>
                ×
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Allowlist</h2>
        <div className="row">
          <input
            type="text"
            placeholder="example.com"
            value={allowInput}
            onChange={(e) => setAllowInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void addAllow()}
          />
          <button onClick={() => void addAllow()}>Add</button>
        </div>
        <ul className="chips">
          {settings.allowlist.map((d) => (
            <li key={d}>
              {d}
              <button onClick={() => void removeFromList("allowlist", d)} aria-label={`remove ${d}`}>
                ×
              </button>
            </li>
          ))}
        </ul>
      </section>

      {status && <div className="status">{status}</div>}
    </div>
  );
}
