import { useEffect, useRef, useState } from "react";
import { get } from "@/lib/storage";
import { daysSince, nextMilestone } from "@/lib/streak";

const PROMPTS = [
  "What were you doing 5 minutes before this urge started?",
  "What emotion is underneath this craving — boredom, loneliness, stress, anger?",
  "Name three things you'll be glad you didn't do tomorrow morning.",
  "Who in your life would be disappointed if they saw this screen?",
  "What's one thing you could do for 10 minutes right now instead?",
];

function pickPrompt(): string {
  return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
}

export function Blocked() {
  const [days, setDays] = useState(0);
  const [from, setFrom] = useState("");
  const [reason, setReason] = useState<string | null>(null);
  const [breath, setBreath] = useState<"in" | "hold" | "out">("in");
  const [prompt] = useState(pickPrompt);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    void (async () => {
      const s = await get("streak");
      setDays(daysSince(s.startedAt));
    })();

    const params = new URLSearchParams(location.search);
    setFrom(params.get("from") ?? "");
    setReason(params.get("reason"));

    // 4-7-8 breathing loop
    const cycle: Array<{ phase: "in" | "hold" | "out"; ms: number }> = [
      { phase: "in", ms: 4000 },
      { phase: "hold", ms: 7000 },
      { phase: "out", ms: 8000 },
    ];
    let i = 0;
    const tick = () => {
      setBreath(cycle[i].phase);
      timerRef.current = setTimeout(() => {
        i = (i + 1) % cycle.length;
        tick();
      }, cycle[i].ms);
    };
    tick();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const next = nextMilestone(days);

  return (
    <main className="wrap">
      <div className="card">
        <p className="kicker">Streak protected you</p>
        <h1>That site is blocked.</h1>
        {from && <p className="from">Attempted: <code>{from}</code></p>}
        {reason === "heuristic" && (
          <p className="from">Detected by content scan, not on the standard blocklist.</p>
        )}

        <div className="streak">
          <div className="days">{days}</div>
          <div className="label">{days === 1 ? "day clean" : "days clean"}</div>
          {next && <p className="next">{next.days - days} days to "{next.label}"</p>}
        </div>

        <div className={`breath ${breath}`}>
          <div className="circle" />
          <p>
            Breathe {breath === "in" ? "in" : breath === "hold" ? "and hold" : "out slowly"}
          </p>
        </div>

        <div className="prompt">
          <p className="prompt-label">A question, just for you:</p>
          <p className="prompt-text">{prompt}</p>
        </div>

        <div className="cta">
          <button onClick={() => history.back()}>Go back</button>
          <a href="https://www.reddit.com/r/NoFap" target="_blank" rel="noopener noreferrer">
            Talk to people who get it →
          </a>
        </div>
      </div>
    </main>
  );
}
