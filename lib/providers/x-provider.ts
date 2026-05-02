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
        error: "Live X ingest not configured (missing X_BEARER_TOKEN).",
      };
    }

    try {
      const userRes = await fetch(
        `https://api.twitter.com/2/users/by/username/${encodeURIComponent(handle)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      if (!userRes.ok) {
        return {
          ok: false,
          error: `X user lookup failed (${userRes.status}).`,
        };
      }
      const userJson = (await userRes.json()) as { data?: { id?: string } };
      const userId = userJson.data?.id;
      if (!userId) {
        return { ok: false, error: "X user not found or inaccessible." };
      }

      const timelineRes = await fetch(
        `https://api.twitter.com/2/users/${userId}/tweets?max_results=100&tweet.fields=created_at,text,public_metrics`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      if (!timelineRes.ok) {
        return {
          ok: false,
          error: `X timeline fetch failed (${timelineRes.status}).`,
        };
      }
      const timeline = (await timelineRes.json()) as {
        data?: Array<{
          id: string;
          text?: string;
          created_at?: string;
          public_metrics?: { like_count?: number };
        }>;
      };
      const posts: Post[] = (timeline.data ?? []).map((t) => ({
        id: t.id,
        text: t.text ?? "",
        createdAt: t.created_at ?? new Date().toISOString(),
        likeCount:
          typeof t.public_metrics?.like_count === "number"
            ? t.public_metrics.like_count
            : undefined,
      }));

      return {
        ok: true,
        posts,
        meta: { source: "live" },
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      return { ok: false, error: `X fetch error: ${msg}` };
    }
  }
}
