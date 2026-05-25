/**
 * Streak math — days clean, milestones, reset on relapse.
 */
import { get, set, update, type StreakState } from "./storage";

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysSince(epochMs: number, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - epochMs) / DAY_MS));
}

export interface Milestone {
  days: number;
  label: string;
}

export const MILESTONES: Milestone[] = [
  { days: 1, label: "Day 1 — the hardest one" },
  { days: 3, label: "72 hours" },
  { days: 7, label: "One week" },
  { days: 14, label: "Two weeks" },
  { days: 30, label: "One month" },
  { days: 60, label: "Two months" },
  { days: 90, label: "90 days" },
  { days: 180, label: "Half a year" },
  { days: 365, label: "One year" },
];

export function nextMilestone(currentDays: number): Milestone | null {
  return MILESTONES.find((m) => m.days > currentDays) ?? null;
}

export async function readStreakDays(): Promise<number> {
  const s = await get("streak");
  return daysSince(s.startedAt);
}

export async function recordRelapse(note?: string): Promise<StreakState> {
  return update("streak", (s) => {
    const ranDays = daysSince(s.startedAt);
    return {
      startedAt: Date.now(),
      longestDays: Math.max(s.longestDays, ranDays),
      relapses: [...s.relapses, { at: Date.now(), note }],
    };
  });
}

export async function resetStreak(): Promise<void> {
  await set("streak", {
    startedAt: Date.now(),
    longestDays: 0,
    relapses: [],
  });
}
