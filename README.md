# Slop Sentiment Index

Hackathon MVP: review **specific X profiles** and see each profile’s **slop alignment score**—a parody breakdown of **OpenAI-coded** vs **Anthropic-coded** vs **neutral/indie** posting-style similarity. **Not** employment, compensation, affiliation, bribery, or paid promotion detection.

## Local setup

1. `npm install` then `npm run dev`
2. Open [http://localhost:3000](http://localhost:3000)
3. Submit a public X username.

Without live Twitter/X API access, the app scores **deterministic synthetic sample posts** keyed to that handle (not fetched from X). Configure live ingest below when you want real timelines.

## Scripts

| Command     | Description        |
|------------|--------------------|
| `npm run dev`   | Dev server        |
| `npm run build` | Production build  |
| `npm run start` | Run production    |
| `npm run lint`  | ESLint            |

## Optional live X ingest

To call the Twitter/X API v2 (Bearer token):

1. Copy `.env.example` → `.env.local`
2. Set `X_BEARER_TOKEN` to an app-only Bearer token with read access.
3. Set `SLOP_TRY_LIVE_X=1`

Live mode fetches up to **200** of the account’s most recent posts using **paginated** X API v2 calls (`max_results` 100 per request, not a single invalid `max_results=200`).

If the live request fails or returns an empty timeline, the app falls back to **synthetic sample** posts so scoring still runs.

| Variable | Purpose |
|----------|---------|
| `X_BEARER_TOKEN` | Twitter API v2 Bearer token |
| `SLOP_TRY_LIVE_X` | `1` = try live fetch before fallback |
| `SLOP_FORCE_MOCK` | `1` = never call live X |

## Grok tie-breaker (OpenRouter)

Optional LLM that resolves **toss-up** mass. The UI button is **Let Grok decide** (default model **`x-ai/grok-2-mini`** via OpenRouter). Override with `OPENROUTER_REFEREE_MODEL` if you want another Grok or non-xAI model.

| Variable | Purpose |
|----------|---------|
| `OPENROUTER_API_KEY` | [OpenRouter](https://openrouter.ai/) API key — required for **Let Grok decide** |
| `OPENROUTER_REFEREE_MODEL` | Optional model id (default `x-ai/grok-2-mini`) |
| `OPENROUTER_HTTP_REFERER` | Optional site URL for OpenRouter rankings |
| `OPENROUTER_APP_TITLE` | Optional app title for OpenRouter rankings |

Without `OPENROUTER_API_KEY`, the button still appears when there is toss-up mass; the API returns **503** with a clear message.

## Architecture (where things live)

- **UI:** `app/page.tsx`, `components/slop-home.tsx`, `components/result-card.tsx`
- **API:** `app/api/score/route.ts`, `app/api/referee/route.ts`
- **Providers:** `lib/providers/*` (synthetic fallback + optional X), `lib/mock-data.ts`
- **Scoring:** `lib/scoring/heuristic.ts` (deterministic receipts)

## Product guardrails

Copy in the UI states this is **entertainment**: a profile’s **slop alignment score** reflects similarity of tone to common “lab launch thread” shapes—not proof of who someone works for or is paid by.
