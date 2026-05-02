# Slop Sentiment Index

Hackathon MVP: a **parody** “posting-style similarity” score for public X handles—**OpenAI-coded** vs **Anthropic-coded** hype vs **neutral/indie** vibes. **Not** employment, compensation, affiliation, bribery, or paid promotion detection.

## Quick demo (60s)

1. `npm install` (if needed) then `npm run dev`
2. Open [http://localhost:3000](http://localhost:3000)
3. Click a demo handle:
   - `@gpt_hype_architect`
   - `@claude_maximalist`
   - `@indieposter_9000`
4. Or type any handle—the app falls back to **mock/generic** text if live X is unavailable.

## Scripts

| Command     | Description        |
|------------|--------------------|
| `npm run dev`   | Dev server        |
| `npm run build` | Production build  |
| `npm run start` | Run production    |
| `npm run lint`  | ESLint            |

## Optional live X ingest

By default the app uses **mock/fixture** data so demos work offline.

To try the Twitter/X API v2 (Bearer token):

1. Copy `.env.example` → `.env.local`
2. Set `X_BEARER_TOKEN` to an app-only Bearer token with read access.
3. Set `SLOP_TRY_LIVE_X=1`

If the live request fails or returns an empty timeline, the app still returns scores using **mock or generic fallback** posts.

| Variable | Purpose |
|----------|---------|
| `X_BEARER_TOKEN` | Twitter API v2 Bearer token |
| `SLOP_TRY_LIVE_X` | `1` = try live fetch before mock |
| `SLOP_FORCE_MOCK` | `1` = never call live X |

## Architecture (where things live)

- **UI:** `app/page.tsx`, `components/slop-home.tsx`, `components/result-card.tsx`
- **API:** `app/api/score/route.ts`
- **Providers:** `lib/providers/*` (mock + optional X), `lib/mock-data.ts`
- **Scoring:** `lib/scoring/heuristic.ts` (deterministic receipts)

## Product guardrails

Copy in the UI states this is **entertainment**: similarity of tone to common “lab launch thread” shapes, not proof of who someone works for or is paid by.
