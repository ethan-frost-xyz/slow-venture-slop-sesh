import type { Post } from "@/lib/providers/types";

const TTL_MS = 600_000;

type CacheEntry = {
  posts: Post[];
  fetchedAt: number;
  source: string;
  displayName?: string;
  profileBio?: string;
};

const store = new Map<string, CacheEntry>();

/** Normalize handle: lowercase, no @ — callers should pass normalized handles. */
export function getCache(handle: string): CacheEntry | null {
  const key = handle.trim().replace(/^@+/, "").toLowerCase();
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() - hit.fetchedAt > TTL_MS) {
    store.delete(key);
    return null;
  }
  return hit;
}

export function setCache(
  handle: string,
  posts: Post[],
  source: string,
  displayName?: string,
  profileBio?: string,
): void {
  const key = handle.trim().replace(/^@+/, "").toLowerCase();
  store.set(key, {
    posts,
    fetchedAt: Date.now(),
    source,
    ...(displayName ? { displayName } : {}),
    ...(profileBio ? { profileBio } : {}),
  });
}

export function clearCache(): void {
  store.clear();
}
