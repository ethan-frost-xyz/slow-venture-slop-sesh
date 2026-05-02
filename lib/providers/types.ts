/** Normalized public post for scraping-style ingestion (no auth in MVP). */
export type Post = {
  id: string;
  text: string;
  /** ISO 8601 timestamp */
  createdAt: string;
};

export type PostsFetchMeta = {
  /** Where the text ultimately came from */
  source: "live" | "mock" | "fallback";
  /** Optional note for UI/debug, e.g. live fetch failed */
  detail?: string;
};

export type PostsFetchResult =
  | { ok: true; posts: Post[]; meta: PostsFetchMeta }
  | { ok: false; error: string; meta?: PostsFetchMeta };

export interface PostProvider {
  name: string;
  fetchPosts(handle: string): Promise<PostsFetchResult>;
}

/** Strip @ and trim; lowercase for consistent lookups */
export function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "").toLowerCase();
}
