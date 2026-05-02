import { getCache, setCache } from "@/lib/cache/post-cache";
import { MockPostProvider } from "@/lib/providers/mock-provider";
import type { PostProvider, PostsFetchResult } from "@/lib/providers/types";
import { normalizeHandle } from "@/lib/providers/types";
import { XPostProvider } from "@/lib/providers/x-provider";

/**
 * Resolves posts for a handle: tries live X when enabled, then synthetic/mock fallback.
 */
export async function resolvePostsForHandle(
  rawHandle: string,
): Promise<PostsFetchResult> {
  const handle = normalizeHandle(rawHandle);
  if (!handle) {
    return { ok: false, error: "Please enter an X username." };
  }

  const cached = getCache(handle);
  if (cached && cached.posts.length > 0) {
    return {
      ok: true,
      posts: cached.posts,
      meta: {
        source: "cache",
        cachedAt: cached.fetchedAt,
        detail: cached.source,
        ...(cached.displayName ? { displayName: cached.displayName } : {}),
        ...(cached.profileBio ? { profileBio: cached.profileBio } : {}),
      },
    };
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
      setCache(
        handle,
        result.posts,
        result.meta.source,
        result.meta.displayName,
        result.meta.profileBio,
      );
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
    if (mockResult.posts.length > 0) {
      setCache(
        handle,
        mockResult.posts,
        mockResult.meta.source,
        mockResult.meta.displayName,
        mockResult.meta.profileBio,
      );
    }
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

