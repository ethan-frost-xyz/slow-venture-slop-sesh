/**
 * Grok (via OpenRouter): redistributes toss-up % into Open vs Anthropic.
 * Env: OPENROUTER_API_KEY (required). Optional: OPENROUTER_REFEREE_MODEL (default x-ai/grok-4.1-fast, reasoning effort low).
 */
import type { ScoreReceipt } from "@/lib/scoring/types";
import { NextResponse } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const DEFAULT_REFEREE_MODEL = "x-ai/grok-4.1-fast";
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
      { error: "Grok tie-breaker is not configured (missing OPENROUTER_API_KEY)." },
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
          "Nothing to decide: need toss-up mass and at least one toss-up receipt. Re-score if receipts lack flags.",
      },
      { status: 400 },
    );
  }

  const lines = tossUpReceipts.map((r, i) => `${i + 1}. ${r.text.replace(/\s+/g, " ").trim()}`);

  const userPrompt = `These posts mention both OpenAI-ish and Anthropic-ish lab signals (ambiguous). Decide how to split the toss-up bucket.

Current lab split (percent, sums to ~100): OpenAI-coded ${o.toFixed(1)}%, Anthropic-coded ${a.toFixed(1)}%, toss-up ${t.toFixed(1)}%.

Posts:
${lines.join("\n")}

Reply with ONLY valid JSON, no other text:
{"anthropicShareOfTossUp": <number 0-1>, "recap": "<required: 2-5 sentences. Unhinged, vivid, still truthful about the split: which lab's vibe won the toss-up and roughly how Open vs Anthropic scores move. You are weirdly invested in cannons (siege pieces, naval batteries, metaphorical broadsides of posting—commit). Plain language, no markdown>"}

anthropicShareOfTossUp = fraction of the ${t.toFixed(1)}% toss-up that moves to Anthropic-coded; the rest goes to OpenAI-coded. New toss-up = 0.`;

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
          : { "X-Title": "Slop · Grok Cook" }),
      },
      body: JSON.stringify({
        model,
        temperature: 0.55,
        max_tokens: 4096,
        reasoning: { effort: "low" },
        messages: [
          {
            role: "system",
            content:
              "You are Grok judging ambiguous X posts for OpenAI-coded vs Anthropic-coded vibe. Output only the JSON object requested. The recap must justify anthropicShareOfTossUp with deranged energy: dramatic metaphors, feigned or real obsession with cannons (historical artillery, ship-of-the-line broadsides, or bringing the big guns of lab posting), and a clear read on which lab's aesthetic carried the toss-up—only cite what is plausible from the posts you were given.",
          },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[referee] OpenRouter error", res.status, errText.slice(0, 500));
      let userMsg = "Grok request failed. Try again.";
      if (res.status === 404 && /No endpoints found|not found/i.test(errText)) {
        userMsg = `OpenRouter has no route for model "${model}". Set OPENROUTER_REFEREE_MODEL to a current id (e.g. x-ai/grok-4.1-fast).`;
      }
      return NextResponse.json({ error: userMsg }, { status: 502 });
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
    return NextResponse.json({ error: "Network error calling Grok." }, { status: 502 });
  }

  let parsed: unknown;
  try {
    parsed = parseAssistantJson(assistantText);
  } catch {
    return NextResponse.json({ error: "Could not parse Grok output." }, { status: 502 });
  }

  if (typeof parsed !== "object" || parsed === null || !("anthropicShareOfTossUp" in parsed)) {
    return NextResponse.json({ error: "Grok JSON missing anthropicShareOfTossUp." }, { status: 502 });
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

  const recapRaw = (parsed as { recap?: unknown }).recap;
  let recap =
    typeof recapRaw === "string" && recapRaw.trim().length > 0
      ? recapRaw.trim().slice(0, 800)
      : "";
  if (!recap) {
    recap = `Grok traversed the parapet, squinted through the embrasure, and still refuses to write a normal sentence—so here are numbers instead: about ${(share * 100).toFixed(0)}% of the ${t.toFixed(1)}% toss-up went Anthropic-coded, ${((1 - share) * 100).toFixed(0)}% OpenAI-coded (${o.toFixed(1)}% → ${newOpen.toFixed(1)}% Open, ${a.toFixed(1)}% → ${newAnth.toFixed(1)}% Anthropic). The 32-pounder of vibes has spoken; the mixed-signal posts are the powder charge.`;
  }

  return NextResponse.json({
    scores: { openAI: newOpen, anthropic: newAnth, tossUp: newToss },
    recap,
  });
}
