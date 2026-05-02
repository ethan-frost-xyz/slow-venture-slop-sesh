import { genericFallbackPosts } from "@/lib/mock-data";
import type { PostProvider, PostsFetchResult } from "@/lib/providers/types";
import { normalizeHandle } from "@/lib/providers/types";

/** Readable synthetic label for mock/fallback ingests (no live profile). */
function placeholderDisplayName(handle: string): string {
  const parts = handle.split(/[._-]+/).filter(Boolean);
  if (parts.length === 0) return handle;
  return parts
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase())
    .join(" ");
}

export class MockPostProvider implements PostProvider {
  name = "mock";

  async fetchPosts(rawHandle: string): Promise<PostsFetchResult> {
    const handle = normalizeHandle(rawHandle);
    if (!handle) {
      return { ok: false, error: "Handle is required." };
    }
    return {
      ok: true,
      posts: genericFallbackPosts(handle),
      meta: {
        source: "fallback",
        detail: "synthetic_fallback",
        displayName: placeholderDisplayName(handle),
      },
    };
  }
}
