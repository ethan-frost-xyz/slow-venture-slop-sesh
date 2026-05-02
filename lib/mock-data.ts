import type { Post } from "@/lib/providers/types";

/** When live X is off or unavailable, deterministic synthetic posts for scoring. */
export function genericFallbackPosts(handle: string): Post[] {
  const h = handle.toLowerCase();
  const now = Date.now();
  return [
    {
      id: "fb1",
      createdAt: new Date(now - 86400000).toISOString(),
      text: `[@${h}] posting about shipping small things, APIs, and not taking model launches too seriously.`,
    },
    {
      id: "fb2",
      createdAt: new Date(now - 172800000).toISOString(),
      text: "Occasionally mentions big labs but mostly complaining about dependencies and CSS.",
    },
    {
      id: "fb3",
      createdAt: new Date(now - 259200000).toISOString(),
      text: "Retweeting memes. One lukewarm 'interesting benchmark' comment. Strong independent-poster energy.",
    },
  ];
}
