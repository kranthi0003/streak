import { useEffect, useState } from "react";
import { get, update } from "@/lib/storage";
import { daysSince, nextMilestone, recordRelapse } from "@/lib/streak";
import { hasPin, verifyPin } from "@/lib/pin";

export function Popup() {
  const [days, setDays] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [pinSet, setPinSet] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
    const i = setInterval(() => void refresh(), 5_000);
    return () => clearInterval(i);
  }, []);

  async function refresh() {
    const [s, p, hp] = await Promise.all([get("streak"), get("protection"), hasPin()]);
    setDays(daysSince(s.startedAt));
    setEnabled(p.enabled);
    setCooldownUntil(p.cooldownUntil);
    setPinSet(hp);
  }

  async function handleDisableClick() {
    setError(null);
    if (pinSet) {
      setShowPinPrompt(true);
      return;
    }
    await scheduleDisable();
  }

  async function scheduleDisable() {
    const { cooldownHours } = await get("settings");
    const until = Date.now() + cooldownHours * 3600_000;
    await update("protection", (p) => ({ ...p, cooldownUntil: until }));
    setShowPinPrompt(false);
    setPinInput("");
    await refresh();
  }

  async function confirmPinAndDisable() {
    setError(null);
    if (!(await verifyPin(pinInput))) {
      setError("Incorrect PIN");
      return;
    }
    await scheduleDisable();
  }

  async function cancelCooldown() {
    await update("protection", (p) => ({ ...p, cooldownUntil: null }));
    await refresh();
  }

  async function relapse() {
    if (!confirm("Reset streak to day 0? This logs a relapse for your records.")) return;
    await recordRelapse();
    await refresh();
  }

  const next = nextMilestone(days);

  return (
    <div className="popup">
      <header className="header">
        <h1>Streak</h1>
        <span className={`pill ${enabled ? "on" : "off"}`}>{enabled ? "Protection ON" : "OFF"}</span>
      </header>

      <section className="streak-card">
        <div className="days">{days}</div>
        <div className="label">{days === 1 ? "day clean" : "days clean"}</div>
        {next && (
          <div className="next">
            Next milestone in <strong>{next.days - days}d</strong> — {next.label}
          </div>
        )}
      </section>

      {cooldownUntil ? (
        <div className="cooldown">
          <p>
            Disable pending — protection turns off{" "}
            <strong>{new Date(cooldownUntil).toLocaleString()}</strong>
          </p>
          <button onClick={cancelCooldown}>Cancel disable (stay protected)</button>
        </div>
      ) : (
        <div className="actions">
          {enabled && (
            <button className="danger" onClick={handleDisableClick}>
              Disable protection…
            </button>
          )}
        </div>
      )}

      {showPinPrompt && (
        <div className="pin-prompt">
          <p>Enter your PIN to schedule disable:</p>
          <input
            type="password"
            value={pinInput}
            autoFocus
            onChange={(e) => setPinInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void confirmPinAndDisable()}
          />
          {error && <p className="error">{error}</p>}
          <div className="row">
            <button onClick={() => setShowPinPrompt(false)}>Cancel</button>
            <button onClick={() => void confirmPinAndDisable()}>Confirm</button>
          </div>
        </div>
      )}

      <footer className="footer">
        <button className="link" onClick={() => void relapse()}>
          I had a relapse — reset
        </button>
        <button className="link" onClick={() => chrome.runtime.openOptionsPage()}>
          Settings
        </button>
      </footer>
    </div>
  );
}
