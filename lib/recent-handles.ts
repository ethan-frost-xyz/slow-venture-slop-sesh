import { normalizeHandle } from "@/lib/providers/types";

const STORAGE_KEY = "slop-reviewed-handles";
/** Only keep visits within this window for the splash list */
export const RECENT_HANDLE_WINDOW_MS = 20 * 60 * 1000;

type Entry = { handle: string; reviewedAt: number };

function readEntries(): Entry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is Entry =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as Entry).handle === "string" &&
        typeof (x as Entry).reviewedAt === "number",
    );
  } catch {
    return [];
  }
}

function writeEntries(entries: Entry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore quota / private mode
  }
}

function prune(entries: Entry[], now: number, windowMs: number): Entry[] {
  const cutoff = now - windowMs;
  return entries.filter((e) => e.reviewedAt >= cutoff);
}

/** Unique handles from the last `windowMs`, most recently reviewed first (no duplicate handles). */
export function getRecentHandles(windowMs = RECENT_HANDLE_WINDOW_MS): string[] {
  const now = Date.now();
  const byHandle = new Map<string, number>();
  for (const e of prune(readEntries(), now, windowMs)) {
    const prev = byHandle.get(e.handle);
    if (prev === undefined || e.reviewedAt > prev) {
      byHandle.set(e.handle, e.reviewedAt);
    }
  }
  return [...byHandle.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([handle]) => handle);
}

/** Call after a successful score; bumps this handle to now and drops stale rows. */
export function recordReviewedHandle(rawHandle: string): void {
  const handle = normalizeHandle(rawHandle);
  if (!handle) return;

  const now = Date.now();
  const kept = prune(readEntries(), now, RECENT_HANDLE_WINDOW_MS).filter(
    (e) => e.handle !== handle,
  );
  kept.push({ handle, reviewedAt: now });
  writeEntries(kept);
}
