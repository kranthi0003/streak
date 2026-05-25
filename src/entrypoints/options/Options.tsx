import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, get, set, type Settings } from "@/lib/storage";
import { normaliseDomain } from "@/lib/blocklist";
import { clearPin, hasPin, setPin } from "@/lib/pin";

export function Options() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [pinIsSet, setPinIsSet] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [oldPin, setOldPin] = useState("");
  const [domainInput, setDomainInput] = useState("");
  const [allowInput, setAllowInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    const s = await get("settings");
    setSettings(s);
    setPinIsSet(await hasPin());
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
    const d = normaliseDomain(allowInput);
    if (!d) return;
    await save({ ...settings, allowlist: Array.from(new Set([...settings.allowlist, d])) });
    setAllowInput("");
  }

  async function removeFromList(key: "customBlocklist" | "allowlist", domain: string) {
    await save({ ...settings, [key]: settings[key].filter((d) => d !== domain) });
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
        <h2>Behaviour</h2>
        <label className="row-toggle">
          <input
            type="checkbox"
            checked={settings.blockSearchResults}
            onChange={(e) => void save({ ...settings, blockSearchResults: e.target.checked })}
          />
          <span>Filter adult content from search results (Google, Bing, DuckDuckGo)</span>
        </label>
        <label className="row-toggle">
          <input
            type="checkbox"
            checked={settings.enforceSafeSearch}
            onChange={(e) => void save({ ...settings, enforceSafeSearch: e.target.checked })}
          />
          <span>Force SafeSearch on search engines</span>
        </label>
        <label className="row-toggle">
          <input
            type="checkbox"
            checked={settings.heuristicScan}
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
            onChange={(e) => void save({ ...settings, cooldownHours: Number(e.target.value) })}
          />
        </label>
        <p className="hint">
          When you choose to disable protection, this delay applies before it actually turns off.
          Higher = harder to bypass in a weak moment.
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
