/**
 * Referee: redistributes toss-up % into Open vs Anthropic via OpenRouter.
 * Env: OPENROUTER_API_KEY (required). Optional: OPENROUTER_REFEREE_MODEL (default openai/gpt-4o-mini).
 */
import type { ScoreReceipt } from "@/lib/scoring/types";
import { NextResponse } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const DEFAULT_REFEREE_MODEL = "openai/gpt-4o-mini";
const MAX_TWEETS_IN_PROMPT = 12;

type Body = {
  scores?: unknown;
  receipts?: unknown;
};

type LabScores = {
  openAI: number;
  anthropic: number;
  tossUp: number;
};

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

function isLabScores(x: unknown): x is LabScores {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.openAI === "number" &&
    typeof o.anthropic === "number" &&
    typeof o.tossUp === "number"
  );
}

function parseAssistantJson(content: string): unknown {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) {
      return JSON.parse(fenced[1].trim());
    }
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Could not parse model JSON");
  }
}

function receiptTimeMs(r: ScoreReceipt): number {
  if (!r.createdAt) return 0;
  const n = Date.parse(r.createdAt);
  return Number.isNaN(n) ? 0 : n;
}

function pickTossUpReceipts(receipts: ScoreReceipt[]): ScoreReceipt[] {
  const candidates = receipts.filter((r) => r.isTossUpContributor === true);
  candidates.sort((a, b) => receiptTimeMs(b) - receiptTimeMs(a));
  return candidates.slice(0, MAX_TWEETS_IN_PROMPT);
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Referee is not configured (missing OPENROUTER_API_KEY)." },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Send JSON with scores and receipts." }, { status: 400 });
  }

  const scoresRaw = body.scores;
  if (!isLabScores(scoresRaw)) {
    return NextResponse.json({ error: "Body must include scores.openAI, scores.anthropic, scores.tossUp." }, { status: 400 });
  }

  const { openAI: o, anthropic: a, tossUp: t } = scoresRaw;

  if (!Array.isArray(body.receipts)) {
    return NextResponse.json({ error: "Body must include receipts array." }, { status: 400 });
  }

  const receipts = body.receipts as ScoreReceipt[];
  const tossUpReceipts = pickTossUpReceipts(receipts);

  if (t <= 0 || tossUpReceipts.length === 0) {
    return NextResponse.json(
      {
        error:
          "Nothing to referee: need toss-up mass and at least one toss-up receipt. Re-score after deploy if receipts lack flags.",
      },
      { status: 400 },
    );
  }

  const lines = tossUpReceipts.map((r, i) => `${i + 1}. ${r.text.replace(/\s+/g, " ").trim()}`);

  const userPrompt = `These posts mention both OpenAI-ish and Anthropic-ish lab signals (ambiguous). For overall vibe, what fraction of the "toss-up" alignment should lean Anthropic vs OpenAI?

Current lab split (percent, sums to ~100): OpenAI-coded ${o.toFixed(1)}%, Anthropic-coded ${a.toFixed(1)}%, toss-up ${t.toFixed(1)}%.

Posts:
${lines.join("\n")}

Reply with ONLY valid JSON, no other text: {"anthropicShareOfTossUp": <number between 0 and 1>, "oneLiner": "<optional short joke, max 120 chars>"}

Meaning: anthropicShareOfTossUp is how much of the ${t.toFixed(1)}% toss-up bucket moves to Anthropic-coded; the rest of that bucket moves to OpenAI-coded. After refereeing, toss-up becomes 0.`;

  const model =
    process.env.OPENROUTER_REFEREE_MODEL?.trim() || DEFAULT_REFEREE_MODEL;

  let assistantText: string;
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(process.env.OPENROUTER_HTTP_REFERER
          ? { "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER }
          : {}),
        ...(process.env.OPENROUTER_APP_TITLE
          ? { "X-Title": process.env.OPENROUTER_APP_TITLE }
          : { "X-Title": "Slop Referee" }),
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You judge which big-lab posting vibe dominates in ambiguous tweets. Output only the JSON object requested.",
          },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[referee] OpenRouter error", res.status, errText.slice(0, 500));
      return NextResponse.json(
        { error: "Referee model request failed. Try again." },
        { status: 502 },
      );
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return NextResponse.json({ error: "Unexpected model response." }, { status: 502 });
    }
    assistantText = content;
  } catch (e) {
    console.error("[referee]", e);
    return NextResponse.json({ error: "Network error calling Referee." }, { status: 502 });
  }

  let parsed: unknown;
  try {
    parsed = parseAssistantJson(assistantText);
  } catch {
    return NextResponse.json({ error: "Could not parse Referee output." }, { status: 502 });
  }

  if (typeof parsed !== "object" || parsed === null || !("anthropicShareOfTossUp" in parsed)) {
    return NextResponse.json({ error: "Referee JSON missing anthropicShareOfTossUp." }, { status: 502 });
  }

  const shareRaw = (parsed as { anthropicShareOfTossUp: unknown }).anthropicShareOfTossUp;
  if (typeof shareRaw !== "number" || !Number.isFinite(shareRaw)) {
    return NextResponse.json({ error: "anthropicShareOfTossUp must be a number." }, { status: 502 });
  }
  const share = Math.min(1, Math.max(0, shareRaw));

  const rawOpen = o + t * (1 - share);
  const rawAnth = a + t * share;
  let newOpen = round2(rawOpen);
  let newAnth = round2(rawAnth);
  const newToss = 0;
  const drift = round2(100 - newOpen - newAnth - newToss);
  if (drift !== 0) {
    if (newOpen >= newAnth) {
      newOpen = round2(newOpen + drift);
    } else {
      newAnth = round2(newAnth + drift);
    }
  }

  const oneLinerRaw = (parsed as { oneLiner?: unknown }).oneLiner;
  const oneLiner =
    typeof oneLinerRaw === "string" && oneLinerRaw.trim().length > 0
      ? oneLinerRaw.trim().slice(0, 160)
      : undefined;

  return NextResponse.json({
    scores: { openAI: newOpen, anthropic: newAnth, tossUp: newToss },
    ...(oneLiner ? { oneLiner } : {}),
  });
}
