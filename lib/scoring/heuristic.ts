import type {
  ScoringInput,
  ScoreReceipt,
  SlopScoreResult,
} from "@/lib/scoring/types";

const OPENAI_TERMS = [
  "openai",
  "chatgpt",
  "gpt-4",
  "gpt-5",
  "o1",
  "o3",
  "dall-e",
  "dalle",
  "sora",
  "sam altman",
];
const ANTHROPIC_TERMS = [
  "anthropic",
  "claude",
  "opus",
  "sonnet",
  "haiku",
  "constitutional ai",
  "claude code",
];

const BOOSTER_PHRASES = [
  "game over",
  "game changer",
  "best model",
  "unfair",
  "monster",
  "mind blowing",
  "mind-blowing",
  "insane",
  "cooked",
  "simply not serious",
  "launch day",
  "let's go",
  "lets go",
  "wow",
  "shipping",
];

const NEGATIVE_PHRASES = [
  "mid",
  "overhyped",
  "over-hyped",
  "not impressed",
  "meh",
  "scam",
  "vibes are off",
];

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function normalizeText(s: string): string {
  return s.toLowerCase();
}

/** More weight to newer posts (half-life ~5 days). */
function recencyWeight(createdAt: string, now: number): number {
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return 0.5;
  const days = (now - t) / (86400000);
  return Math.exp(-days / 5);
}

function scoreTerms(textNorm: string, terms: string[]): number {
  let s = 0;
  for (const term of terms) {
    if (textNorm.includes(term)) s += 1;
  }
  return s;
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function scoreSlopVibes(input: ScoringInput): SlopScoreResult {
  const { handle, posts, meta } = input;
  const now = Date.now();

  if (posts.length === 0) {
    return {
      handle,
      scores: { openAI: 34, anthropic: 33, neutral: 33 },
      confidence: 0.05,
      receipts: [
        {
          reason: "no_posts",
          text: "No public posts to compare — scores are a flat shrug.",
        },
      ],
      tags: [],
      vibeHeadline: "Schrodinger’s shitposter",
      postsAnalyzed: 0,
      meta,
    };
  }

  let openAIPoints = 0;
  let anthropicPoints = 0;
  let neutralPoints = 0;
  const receipts: ScoreReceipt[] = [];
  const tagSet = new Set<string>();

  for (const p of posts) {
    const w = recencyWeight(p.createdAt, now);
    const textNorm = normalizeText(p.text);
    const oHits = scoreTerms(textNorm, OPENAI_TERMS);
    const aHits = scoreTerms(textNorm, ANTHROPIC_TERMS);

    let booster = 0;
    for (const ph of BOOSTER_PHRASES) {
      if (textNorm.includes(ph)) booster += 1;
    }

    let neg = 0;
    for (const ph of NEGATIVE_PHRASES) {
      if (textNorm.includes(ph)) neg += 1;
    }

    if (textNorm.includes("benchmark")) tagSet.add("benchmark glazing");
    if (textNorm.includes("launch") && booster > 0) {
      tagSet.add("launch-day activation");
    }
    if (
      booster >= 2 &&
      (textNorm.includes("drop") ||
        textNorm.includes("shipping") ||
        textNorm.includes("announcement"))
    ) {
      tagSet.add("marketing-copy tone");
    }
    if (
      oHits + aHits < 1 &&
      (textNorm.includes("side project") ||
        textNorm.includes("indie") ||
        textNorm.includes("locally"))
    ) {
      tagSet.add("indie poster");
    }

    const openChunk =
      w * (oHits * 8 + booster * 3 + (oHits > aHits ? 4 : 0) - neg * 2);
    const anthropicChunk =
      w * (aHits * 8 + booster * 3 + (aHits > oHits ? 4 : 0) - neg * 2);
    const neutralChunk =
      w *
      (6 -
        Math.min(oHits + aHits, 4) * 1.2 +
        (oHits === 0 && aHits === 0 ? 5 : 0));

    openAIPoints += Math.max(0, openChunk);
    anthropicPoints += Math.max(0, anthropicChunk);
    neutralPoints += Math.max(0, neutralChunk);

    if (receipts.length < 6 && (oHits > 0 || aHits > 0 || booster > 0)) {
      const bits: string[] = [];
      if (oHits) bits.push("OpenAI/GPT cues");
      if (aHits) bits.push("Anthropic/Claude cues");
      if (booster) bits.push("booster phrasing");
      receipts.push({
        reason: bits.join(" · ") || "tone",
        text: truncate(p.text, 140),
      });
    }
  }

  let o = openAIPoints;
  let a = anthropicPoints;
  let n = neutralPoints;
  const sum = o + a + n;
  if (sum < 1) {
    o = 1;
    a = 1;
    n = 1;
  } else {
    o = (o / sum) * 100;
    a = (a / sum) * 100;
    n = (n / sum) * 100;
  }

  const round2 = (x: number) => Math.round(x * 100) / 100;
  o = round2(o);
  a = round2(a);
  n = round2(100 - o - a);
  n = round2(clamp(n, 0, 100));

  const dominantDelta = Math.abs(o - a);
  let vibeHeadline = "Chaos neutral reply guy";
  if (o > a + 8 && o > n) vibeHeadline = "OpenAI-coded posting reflex";
  else if (a > o + 8 && a > n) vibeHeadline = "Anthropic-coded posting reflex";
  else if (n >= o && n >= a) vibeHeadline = "Independent / lab-agnostic poster";

  const evidenceStrength =
    posts.reduce((acc, p) => acc + recencyWeight(p.createdAt, now), 0) /
    posts.length;
  const rawConf =
    clamp(evidenceStrength, 0.2, 1) *
    clamp(0.35 + dominantDelta / 100 + posts.length * 0.04, 0, 1);
  const confidence = round2(clamp(rawConf, 0.05, 0.98));

  const topReceipts = receipts.slice(0, 5);
  while (topReceipts.length < 3) {
    topReceipts.push({
      reason: "base_rate",
      text: "Mostly vibes and generic tech talk — lab signals are subtle.",
    });
  }

  return {
    handle,
    scores: { openAI: o, anthropic: a, neutral: n },
    confidence,
    receipts: topReceipts.slice(0, 5),
    tags: Array.from(tagSet).slice(0, 5),
    vibeHeadline,
    postsAnalyzed: posts.length,
    meta,
  };
}
