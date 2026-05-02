import type { Post, PostProvider, PostsFetchResult } from "@/lib/providers/types";
import { normalizeHandle } from "@/lib/providers/types";

/**
 * Optional live X (Twitter) API v2 fetch (Bearer token).
 * Set X_BEARER_TOKEN and SLOP_TRY_LIVE_X=1 to attempt live ingest.
 */
export class XPostProvider implements PostProvider {
  name = "x_live";

  async fetchPosts(rawHandle: string): Promise<PostsFetchResult> {
    const handle = normalizeHandle(rawHandle);
    if (!handle) {
      return { ok: false, error: "Handle is required." };
    }
    const token = process.env.X_BEARER_TOKEN;
    if (!token) {
      return {
        ok: false,
        error: "Live X ingest not configured — missing X_BEARER_TOKEN.",
      };
    }

    try {
      const userRes = await fetch(
        `https://api.twitter.com/2/users/by/username/${encodeURIComponent(handle)}?user.fields=name`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      if (!userRes.ok) {
        return {
          ok: false,
          error: `X user lookup failed — HTTP ${userRes.status}.`,
        };
      }
      const userJson = (await userRes.json()) as {
        data?: { id?: string; name?: string };
      };
      const userId = userJson.data?.id;
      if (!userId) {
        return { ok: false, error: "X user not found or inaccessible." };
      }
      const displayName = userJson.data?.name?.trim() || undefined;

      const timelineQuery = new URLSearchParams({
        max_results: "100",
        "tweet.fields": "created_at,text,public_metrics,referenced_tweets",
        expansions: "referenced_tweets.id",
      });
      const timelineRes = await fetch(
        `https://api.twitter.com/2/users/${userId}/tweets?${timelineQuery.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      if (!timelineRes.ok) {
        return {
          ok: false,
          error: `X timeline fetch failed — HTTP ${timelineRes.status}.`,
        };
      }
      type TweetPayload = {
        id: string;
        text?: string;
        created_at?: string;
        public_metrics?: { like_count?: number };
        referenced_tweets?: Array<{ type: string; id: string }>;
      };
      const timeline = (await timelineRes.json()) as {
        data?: TweetPayload[];
        includes?: { tweets?: TweetPayload[] };
      };
      const refById = new Map(
        (timeline.includes?.tweets ?? []).map((t) => [t.id, t]),
      );
      const mergedLikeCount = (t: TweetPayload): number | undefined => {
        const nums: number[] = [];
        const own = t.public_metrics?.like_count;
        if (typeof own === "number") nums.push(own);
        for (const ref of t.referenced_tweets ?? []) {
          const expanded = refById.get(ref.id);
          const n = expanded?.public_metrics?.like_count;
          if (typeof n === "number") nums.push(n);
        }
        if (nums.length === 0) return undefined;
        return Math.max(...nums);
      };

      const posts: Post[] = (timeline.data ?? []).map((t) => ({
        id: t.id,
        text: t.text ?? "",
        createdAt: t.created_at ?? new Date().toISOString(),
        likeCount: mergedLikeCount(t),
      }));

      return {
        ok: true,
        posts,
        meta: { source: "live", ...(displayName ? { displayName } : {}) },
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      return { ok: false, error: `X fetch error: ${msg}` };
    }
  }
}
