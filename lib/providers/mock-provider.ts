import {
  genericFallbackPosts,
  getDemoAccount,
} from "@/lib/mock-data";
import type { PostProvider, PostsFetchResult } from "@/lib/providers/types";
import { normalizeHandle } from "@/lib/providers/types";

export class MockPostProvider implements PostProvider {
  name = "mock";

  async fetchPosts(rawHandle: string): Promise<PostsFetchResult> {
    const handle = normalizeHandle(rawHandle);
    if (!handle) {
      return { ok: false, error: "Handle is required." };
    }
    const demo = getDemoAccount(handle);
    if (demo) {
      return {
        ok: true,
        posts: demo.posts,
        meta: { source: "mock", detail: "demo_fixture" },
      };
    }
    return {
      ok: true,
      posts: genericFallbackPosts(handle),
      meta: { source: "fallback", detail: "unknown_handle_generic_demo" },
    };
  }
}
