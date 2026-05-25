/**
 * PIN hashing using Web Crypto (SHA-256). Not bulletproof, but adds enough
 * friction to defeat the "click disable in a weak moment" scenario.
 */
import { get, set } from "./storage";

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function setPin(pin: string): Promise<void> {
  if (pin.length < 4) throw new Error("PIN must be at least 4 characters");
  const hash = await sha256Hex(pin);
  await set("pin", { hash, setAt: Date.now() });
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await get("pin");
  if (!stored.hash) return true; // no PIN set yet
  const hash = await sha256Hex(pin);
  return hash === stored.hash;
}

export async function hasPin(): Promise<boolean> {
  const stored = await get("pin");
  return Boolean(stored.hash);
}

export async function clearPin(currentPin: string): Promise<void> {
  if (!(await verifyPin(currentPin))) throw new Error("incorrect PIN");
  await set("pin", { hash: null, setAt: null });
}
