---
name: Scoring Data Improvements
overview: Make the requested surgical scoring and provider-layer changes without touching UI files or restructuring the app. The implementation will update AI relevance filtering, sentiment-directed scoring, X post ingestion fields, an in-memory post cache, and richer mock fixtures.
todos:
  - id: types
    content: Update scoring/provider types for AI post stats, cached metadata, and like counts.
    status: completed
  - id: heuristic
    content: Replace heuristic scoring with AI filtering, sentiment-directed lab scoring, confidence caps, and new headlines.
    status: completed
  - id: x-provider
    content: Fetch 100 X posts with public metrics and map like counts.
    status: completed
  - id: cache
    content: Add in-memory post cache and wire it into provider resolution.
    status: completed
  - id: mock-data
    content: Expand demo fixture posts to exercise positive, negative, neutral, and non-AI cases.
    status: completed
  - id: verify
    content: Run diagnostics and `npm run build`, then summarize requested outputs.
    status: completed
isProject: false
---

# Targeted Scoring And Data Improvements

## Scope
Only these files will be changed:
- [lib/scoring/heuristic.ts](lib/scoring/heuristic.ts)
- [lib/scoring/types.ts](lib/scoring/types.ts)
- [lib/providers/types.ts](lib/providers/types.ts)
- [lib/providers/x-provider.ts](lib/providers/x-provider.ts)
- [lib/providers/index.ts](lib/providers/index.ts)
- [lib/cache/post-cache.ts](lib/cache/post-cache.ts) new file
- [lib/mock-data.ts](lib/mock-data.ts)

No UI files will be edited, including `app/page.tsx`, `components/slop-home.tsx`, `components/result-card.tsx`, `components/score-spectrum.tsx`, `app/layout.tsx`, or `globals.css`.

## Implementation Plan

1. Update scoring types in [lib/scoring/types.ts](lib/scoring/types.ts):
   - Add `totalPosts: number`, `aiPosts: number`, and `aiPct: number` to `SlopScoreResult`.
   - Keep `postsAnalyzed` for compatibility with the existing UI, likely mirroring total posts.

2. Replace the heuristic pass in [lib/scoring/heuristic.ts](lib/scoring/heuristic.ts):
   - Add AI relevance detection using lab names, model names, broad AI concepts, and hype/doom terms when paired with AI terms.
   - Count all posts in `totalPosts`, count only AI-relevant posts in `aiPosts`, and compute `aiPct` rounded to 1 decimal.
   - Give non-AI posts zero scoring contribution while still counting them in volume.
   - Score AI-relevant posts with per-lab sentiment:
     - Direct positive lab/model mentions add weighted points to that lab.
     - Negative mentions about one lab add weaker cross-signal points to the other lab at 60% of direct positive weight.
     - Neutral/general AI posts add small neutral points.
   - Preserve the existing recency weighting function and apply it only to AI-relevant scoring contributions.
   - Normalize percentages across AI-relevant scoring points, not all posts.
   - Base confidence caps on `aiPosts`: `<3 => 0.25`, `3-9 => 0.55`, `10-19 => 0.75`, `20+ => 0.95`.
   - Expand `vibeHeadline` selection to the requested labels, using AI post share and lab lean thresholds.

3. Update provider types and live X mapping:
   - In [lib/providers/types.ts](lib/providers/types.ts), add `likeCount?: number` to `Post`.
   - Expand `PostsFetchMeta.source` to include `"cache"` and add optional `cachedAt?: number`, since cached responses must return `meta.source = "cache"` and expose the cache timestamp.
   - In [lib/providers/x-provider.ts](lib/providers/x-provider.ts), fetch `max_results=100` with `tweet.fields=created_at,text,public_metrics` and map `public_metrics.like_count` to `Post.likeCount`.

4. Add the in-memory cache:
   - Create [lib/cache/post-cache.ts](lib/cache/post-cache.ts) with a module-level `Map` keyed by normalized handle.
   - Export `getCache(handle)`, `setCache(handle, posts, source)`, and `clearCache()`.
   - Treat entries older than `600000` ms as stale and return no cache hit for stale entries.
   - Store `{ posts, fetchedAt, source }` as requested.

5. Wire cache into [lib/providers/index.ts](lib/providers/index.ts):
   - Normalize the handle once.
   - Check `getCache(handle)` before constructing/calling providers.
   - On a fresh cache hit, return `{ ok: true, posts, meta: { source: "cache", cachedAt: fetchedAt, detail: source } }`.
   - On provider success, call `setCache(handle, result.posts, result.meta.source)` before returning.
   - Preserve existing live-then-mock fallback behavior and error handling.

6. Refresh mock fixtures in [lib/mock-data.ts](lib/mock-data.ts):
   - Expand each demo account to 8-10 posts.
   - Include 2-3 positive posts about the dominant lab, at least one mild negative post about the other lab, and a mix of non-AI posts so `aiPct` is below 100%.
   - Avoid changing mock provider behavior outside the fixture content.

7. Verify after edits:
   - Run lints/diagnostics for edited files.
   - Run `npm run build` to confirm no TypeScript/build errors.
   - Report every modified file, the final `SlopScoreResult` type, the cache module exports, and build status.