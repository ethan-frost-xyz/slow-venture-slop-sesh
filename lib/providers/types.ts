/** Normalized public post for scraping-style ingestion (no auth in MVP). */
export type Post = {
  id: string;
  text: string;
  /** ISO 8601 timestamp */
  createdAt: string;
  /** From platform public_metrics when available */
  likeCount?: number;
};

export type PostsFetchMeta = {
  /** Where the text ultimately came from */
  source: "live" | "mock" | "fallback" | "cache";
  /** Optional note for UI/debug, e.g. live fetch failed */
  detail?: string;
  /** Epoch ms when a cached bundle was stored */
  cachedAt?: number;
  /** Profile display name from the platform when available */
  displayName?: string;
  /** Public profile bio / description (e.g. X `description`) when available */
  profileBio?: string;
};

export type PostsFetchResult =
  | { ok: true; posts: Post[]; meta: PostsFetchMeta }
  | { ok: false; error: string; meta?: PostsFetchMeta };

export interface PostProvider {
  name: string;
  fetchPosts(handle: string): Promise<PostsFetchResult>;
}

/** First path segment on x.com / twitter.com that is never a @handle. */
const RESERVED_PROFILE_PATH_LEADING = new Set([
  "home",
  "i",
  "intent",
  "search",
  "explore",
  "settings",
  "messages",
  "notifications",
  "compose",
  "login",
  "signup",
  "hashtag",
  "following",
  "followers",
  "verified_followers",
  "lists",
  "communities",
  "topics",
  "who_to_follow",
  "tos",
  "privacy",
  "rules",
  "download",
]);

function twitterLikeHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^www\./, "");
  return h === "x.com" || h === "twitter.com" || h.endsWith(".twitter.com");
}

/** X/Twitter usernames: letters, digits, underscore; max length 15. */
function isLikelyUsername(s: string): boolean {
  return /^[a-z0-9_]{1,15}$/i.test(s);
}

/** True if the string plausibly intends an X/Twitter URL (not e.g. `foox.combar`). */
function mightBeTwitterUrl(t: string): boolean {
  const l = t.toLowerCase();
  if (/^https?:\/\/([a-z0-9-]+\.)?(x\.com|twitter\.com)\b/.test(l)) return true;
  if (/^(www\.)?(x\.com|twitter\.com)(\/|$|\?)/.test(l)) return true;
  return false;
}

/**
 * Parses a handle from an X/Twitter URL.
 *
 * - `null` — string does not look like an X/Twitter URL; caller should treat input as a plain handle.
 * - `""` — looks like X/Twitter but no usable handle (reject input).
 * - otherwise — username from path or `screen_name` on intent links.
 */
function tryParseHandleFromTwitterUrl(raw: string): string | null {
  const t = raw.trim().replace(/^@+/, "");
  if (!mightBeTwitterUrl(t)) {
    return null;
  }

  const withScheme = /:\/\//.test(t) ? t : `https://${t}`;
  let u: URL;
  try {
    u = new URL(withScheme);
  } catch {
    return "";
  }

  if (!twitterLikeHost(u.hostname)) {
    return null;
  }

  const screen = u.searchParams.get("screen_name")?.trim() ?? "";
  if (screen && isLikelyUsername(screen) && /\/intent\//i.test(u.pathname)) {
    return screen;
  }

  const segments = u.pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return "";
  }

  const first = segments[0];
  if (!isLikelyUsername(first)) {
    return "";
  }
  if (RESERVED_PROFILE_PATH_LEADING.has(first.toLowerCase())) {
    return "";
  }

  return first;
}

/**
 * Accepts `@handle`, `handle`, or profile URLs (`https://x.com/handle`, `twitter.com/handle`,
 * tweet URLs `/handle/status/…`, `intent/...?screen_name=`) and returns a normalized handle
 * (lowercase, no `@`). Unparseable X URLs yield `""`.
 */
export function normalizeHandle(raw: string): string {
  const trimmed = raw.trim();
  const fromTwitterUrl = tryParseHandleFromTwitterUrl(trimmed);
  if (fromTwitterUrl !== null) {
    return fromTwitterUrl.replace(/^@+/, "").toLowerCase();
  }
  return trimmed.replace(/^@+/, "").toLowerCase();
}
