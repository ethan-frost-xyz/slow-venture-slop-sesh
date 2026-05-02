import { MockPostProvider } from "@/lib/providers/mock-provider";
import type { PostProvider, PostsFetchResult } from "@/lib/providers/types";
import { normalizeHandle } from "@/lib/providers/types";
import { XPostProvider } from "@/lib/providers/x-provider";

/**
 * Resolves posts for a handle: tries live X when enabled, then mock/demo fallback.
 */
export async function resolvePostsForHandle(
  rawHandle: string,
): Promise<PostsFetchResult> {
  const handle = normalizeHandle(rawHandle);
  if (!handle) {
    return { ok: false, error: "Please enter an X username." };
  }

  const forceMock =
    process.env.SLOP_FORCE_MOCK === "1" || process.env.SLOP_FORCE_MOCK === "true";

  const tryLive = process.env.SLOP_TRY_LIVE_X === "1" ||
    process.env.SLOP_TRY_LIVE_X === "true";

  const providers: PostProvider[] = [];
  if (!forceMock && tryLive) {
    providers.push(new XPostProvider());
  }
  providers.push(new MockPostProvider());

  let lastError: string | undefined;
  for (const p of providers) {
    const result = await p.fetchPosts(handle);
    if (result.ok && result.posts.length > 0) {
      return result;
    }
    if (!result.ok) {
      lastError = result.error;
    }
  }

  // Empty timeline from live but mock might still apply for unknown
  const mock = new MockPostProvider();
  const mockResult = await mock.fetchPosts(handle);
  if (mockResult.ok) {
    return {
      ...mockResult,
      meta: {
        ...mockResult.meta,
        detail: lastError
          ? `${mockResult.meta.detail ?? ""} after: ${lastError}`.trim()
          : mockResult.meta.detail,
      },
    };
  }

  return {
    ok: true,
    posts: [],
    meta: { source: "fallback", detail: lastError ?? "no_posts" },
  };
}

export type { Post, PostsFetchResult } from "@/lib/providers/types";

