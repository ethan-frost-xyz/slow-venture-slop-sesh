import type {
  ScoringInput,
  ScoreReceipt,
  SlopScoreResult,
} from "@/lib/scoring/types";

/** Broad lab / vendor names for AI relevance */
const LAB_NAMES_AI = [
  "openai",
  "anthropic",
  "google deepmind",
  "meta ai",
  "mistral",
  "xai",
  "grok",
];

const MODEL_NAMES_AI = [
  "gpt",
  "chatgpt",
  "claude",
  "opus",
  "sonnet",
  "haiku",
  "gemini",
  "llama",
  "grok",
  "o1",
  "o3",
  "o4",
  "sora",
  "dall-e",
  "dalle",
];

const BROAD_AI_CONCEPTS = [
  "llm",
  "large language model",
  "ai model",
  "foundation model",
  "base model",
  "fine-tune",
  "fine-tuning",
  "rlhf",
  "context window",
  "tokens",
  "inference",
  "benchmark",
  "evals",
  "eval",
  "leaderboard",
  "agent",
  "agentic",
  "ai agent",
  "multimodal",
  "reasoning model",
  "the model",
  "this model",
  "best model",
  "new model",
  "vibe coding",
  "cursor",
  "copilot",
  "claude code",
  "codex",
  "ai lab",
  "frontier model",
  "frontier lab",
  "model release",
  "model drop",
  "agi",
  "artificial intelligence",
];

/** Hype/doom — AI-relevant only when paired with another AI anchor (lab/model/concept). */
const HYPE_DOOM_SIGNALS = [
  "cooked",
  "game over",
  "game changer",
  "unfair",
  "insane",
  "mind-blowing",
  "mind blowing",
  "shocked",
  "wow",
  "shipped",
  "shipping",
  "changed everything",
  "not serious",
  "wild",
  "unreal",
  "scary good",
  "miles ahead",
  "broken",
  "next level",
];

/** Sentiment boosters (+ toward mentioned lab when not negated). */
const BOOSTER_PHRASES = [
  "insane",
  "cooked",
  "unfair",
  "wow",
  "shipped",
  "game over",
  "best",
  "changed everything",
  "mind-blowing",
  "mind blowing",
  "unreal",
  "miles ahead",
  "next level",
];

/** Negative sentiment — tweet-level; pair with lab mention to route cross-signal. */
function hasStrongNegative(textNorm: string): boolean {
  if (textNorm.includes("cooked in the bad way")) return true;
  const negs = [
    "mid",
    "meh",
    "overhyped",
    "over-hyped",
    "fumbled",
    "not impressed",
    "scam",
    "struggling",
    "behind",
    "losing",
    "slow",
    "bloated",
    "embarrassing",
    "disappointing",
    "cope",
    "copium",
  ];
  if (negs.some((n) => textNorm.includes(n))) return true;
  if (/\bpr\b/.test(textNorm) && !textNorm.includes("openpre")) return true;
  if (textNorm.includes("marketing")) return true;
  return false;
}

/** OpenAI-scoped terms for directed sentiment. */
const OPENAI_DIRECT_TERMS = [
  "openai",
  "chatgpt",
  "gpt-",
  "gpt ",
  "gpt3",
  "gpt4",
  "gpt5",
  "o1",
  "o3",
  "o4",
  "sora",
  "dall-e",
  "dalle",
  "codex",
  "openai codex",
  "o3-mini",
  "o4-mini",
  "o3 mini",
  "o4 mini",
  "chatgpt pro",
  "chatgpt plus",
  "operator",
  "deep research",
  "canvas",
  "gpt-4o",
  "gpt4o",
  "realtime api",
  "assistants api",
  "sora 2",
  "sora 3",
  "openai projects",
  "sam altman",
];

/** Anthropic-scoped terms for directed sentiment. */
const ANTHROPIC_DIRECT_TERMS = [
  "anthropic",
  "claude",
  "opus",
  "sonnet",
  "haiku",
  "constitutional ai",
  "claude code",
  "claude.ai",
  "claude cowork",
  "claude projects",
  "computer use",
  "extended thinking",
  "prompt caching",
  "artifacts",
  "claude artifacts",
  "claude desktop",
  "claude opus",
  "claude sonnet",
  "claude haiku",
  "opus 4",
  "sonnet 4",
  "haiku 4",
  "sonnet 3",
  "opus 3",
  "claude 4",
  "claude 3",
  "claude 4.5",
  "claude 4.6",
  "claude 4.7",
  "claude 3.5",
  "claude 3.7",
];

function mentionsOpenAIDirect(textNorm: string): boolean {
  if (OPENAI_DIRECT_TERMS.some((t) => textNorm.includes(t))) return true;
  if (/\bgpt\b/.test(textNorm)) return true;
  if (/\bo1\b/.test(textNorm) || /\bo3\b/.test(textNorm) || /\bo4\b/.test(textNorm))
    return true;
  return false;
}

function mentionsAnthropicDirect(textNorm: string): boolean {
  return ANTHROPIC_DIRECT_TERMS.some((t) => textNorm.includes(t));
}

function extractVersionSignals(textNorm: string): {
  openaiVer: boolean;
  anthropicVer: boolean;
} {
  // OpenAI version patterns: 5.x, 5, o-series already covered by OPENAI_DIRECT_TERMS
  // Matches: "5.5", "5.4", "5.3", "5.2", "5.1", "5.0", "gpt 5", "model 5"
  // Also standalone "o3", "o4", "o1" already in OPENAI_DIRECT_TERMS
  const openaiVerPattern = /\b5\.\d\b|\bgpt[\s\-]?5\b|\bmodel 5\b|\bversion 5\b/;

  // Anthropic version patterns: 4.x (Claude 4 series), 3.x (Claude 3 series)
  // Matches: "4.5", "4.6", "4.7", "4.8", "4.9", "3.5", "3.6", "3.7", "claude 4", "claude 3"
  // Be careful not to catch generic numbers — require context (preceded/followed by model-adjacent words)
  // OR standalone decimal like "4.5" / "4.7" in an AI-relevant tweet context
  const anthropicVerPattern =
    /\b4\.\d\b|\b3\.\d\b|\bclaude[\s\-]?[34]\b|\bmodel [34]\b|\bversion [34]\b/;

  return {
    openaiVer: openaiVerPattern.test(textNorm),
    anthropicVer: anthropicVerPattern.test(textNorm),
  };
}

function hasBooster(textNorm: string): number {
  let n = 0;
  for (const ph of BOOSTER_PHRASES) {
    if (textNorm.includes(ph)) n += 1;
  }
  return Math.min(n, 3);
}

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
  const days = (now - t) / 86400000;
  return Math.exp(-days / 5);
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function publicPostUrl(handle: string, postId: string): string {
  const h = encodeURIComponent(handle);
  const id = encodeURIComponent(postId);
  return `https://x.com/${h}/status/${id}`;
}

function hasAiAnchor(textNorm: string): boolean {
  if (LAB_NAMES_AI.some((x) => textNorm.includes(x))) return true;
  if (MODEL_NAMES_AI.some((x) => textNorm.includes(x))) return true;
  if (BROAD_AI_CONCEPTS.some((x) => textNorm.includes(x))) return true;
  return false;
}

function hasHypeSignal(textNorm: string): boolean {
  return HYPE_DOOM_SIGNALS.some((x) => textNorm.includes(x));
}

function isAiRelevantTweet(textNorm: string): boolean {
  if (hasAiAnchor(textNorm)) return true;
  /** Hype/doom counts as AI-relevant when paired with a generic "AI" mention. */
  if (hasHypeSignal(textNorm) && /\bai\b/.test(textNorm)) return true;
  return false;
}

/** Confidence ceiling from AI-post volume only. */
function confidenceCapFromAiPosts(aiPosts: number): number {
  if (aiPosts < 3) return 0.25;
  if (aiPosts <= 9) return 0.55;
  if (aiPosts <= 19) return 0.75;
  return 0.95;
}

export function scoreSlopVibes(input: ScoringInput): SlopScoreResult {
  const { handle, posts, meta } = input;
  const now = Date.now();
  const totalPosts = posts.length;

  const emptyFields = {
    totalPosts,
    aiPosts: 0,
    aiPct: 0,
    postsAnalyzed: totalPosts,
  };

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
      vibeHeadline: "Schrodinger's shitposter",
      ...emptyFields,
      meta,
    };
  }

  let openAIPoints = 0;
  let anthropicPoints = 0;
  let neutralPoints = 0;
  const receipts: ScoreReceipt[] = [];
  const tagSet = new Set<string>();

  let aiPosts = 0;
  /** Per-AI-post lean for headline: which lab got more raw points from that post. */
  let leanOpenCount = 0;
  let leanAnthCount = 0;

  const CROSS_WEIGHT = 0.6;
  const BASE_POS = 10;
  const BOOST_UNIT = 3;
  const NEUTRAL_AI = 5;
  const ONLY_ONE_LAB_MULT = 1.35;

  for (const p of posts) {
    const w = recencyWeight(p.createdAt, now);
    const textNorm = normalizeText(p.text);

    if (!isAiRelevantTweet(textNorm)) {
      continue;
    }

    aiPosts += 1;

    const openM = mentionsOpenAIDirect(textNorm);
    const anthM = mentionsAnthropicDirect(textNorm);
    const { openaiVer, anthropicVer } = extractVersionSignals(textNorm);
    const openMFinal = openM || openaiVer;
    const anthMFinal = anthM || anthropicVer;
    const neg = hasStrongNegative(textNorm);
    const boostN = hasBooster(textNorm);

    let dOpen = 0;
    let dAnth = 0;
    let dNeut = 0;

    if (textNorm.includes("benchmark")) tagSet.add("benchmark glazing");

    const onlyOpen = openMFinal && !anthMFinal;
    const onlyAnth = anthMFinal && !openMFinal;
    const bothLabs = openMFinal && anthMFinal;

    if (!openMFinal && !anthMFinal) {
      dNeut += NEUTRAL_AI * w;
    } else {
      const onlyOneLabStrong =
        (onlyOpen || onlyAnth) && hasHypeSignal(textNorm) && boostN > 0;

      if (openMFinal) {
        if (neg) {
          dAnth += CROSS_WEIGHT * BASE_POS * w;
          dOpen += 0;
        } else if (boostN > 0) {
          dOpen +=
            w *
            BASE_POS *
            (1 + boostN * (BOOST_UNIT / BASE_POS)) *
            (onlyOneLabStrong && onlyOpen ? ONLY_ONE_LAB_MULT : 1);
        } else {
          dOpen += w * BASE_POS * 0.85 * (onlyOpen ? 1.1 : 0.95);
        }
      }

      if (anthMFinal) {
        if (neg) {
          dOpen += CROSS_WEIGHT * BASE_POS * w;
          dAnth += 0;
        } else if (boostN > 0) {
          dAnth +=
            w *
            BASE_POS *
            (1 + boostN * (BOOST_UNIT / BASE_POS)) *
            (onlyOneLabStrong && onlyAnth ? ONLY_ONE_LAB_MULT : 1);
        } else {
          dAnth += w * BASE_POS * 0.85 * (onlyAnth ? 1.1 : 0.95);
        }
      }

      if (bothLabs && !neg) {
        dNeut += w * NEUTRAL_AI * 0.5;
      }

      const postOpen = Math.max(0, dOpen);
      const postAnth = Math.max(0, dAnth);
      const postNeut = Math.max(0, dNeut);
      const eps = 0.01;
      if (postOpen > postAnth + eps && postOpen > postNeut + eps) leanOpenCount += 1;
      else if (postAnth > postOpen + eps && postAnth > postNeut + eps) leanAnthCount += 1;
    }

    openAIPoints += Math.max(0, dOpen);
    anthropicPoints += Math.max(0, dAnth);
    neutralPoints += Math.max(0, dNeut);

    if (receipts.length < 25) {
      const bits: string[] = [];
      if (openMFinal) bits.push("OpenAI/GPT signal");
      if (anthMFinal) bits.push("Anthropic/Claude signal");
      if (openaiVer || anthropicVer) bits.push("version signal");
      if (neg && (openMFinal || anthMFinal))
        bits.push("negative → cross-lab boost");
      if (boostN > 0) bits.push("booster phrasing");
      if (p.likeCount != null && p.likeCount >= 100) {
        bits.push(`${p.likeCount.toLocaleString()} likes`);
      }
      if (hasHypeSignal(textNorm) && !openM && !anthM) bits.push("hype only");
      if (bits.length === 0) bits.push("general AI");
      receipts.push({
        reason: bits.join(" · "),
        text: truncate(p.text, 140),
        createdAt: p.createdAt,
        postUrl: publicPostUrl(handle, p.id),
      });
    }
  }

  const aiPct =
    totalPosts > 0 ? Math.round(((1000 * aiPosts) / totalPosts)) / 10 : 0;

  let o = openAIPoints;
  let a = anthropicPoints;
  let n = neutralPoints;
  const sum = o + a + n;

  if (aiPosts === 0 || sum < 1e-6) {
    o = 34;
    a = 33;
    n = 33;
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

  const shareOpen = aiPosts > 0 ? leanOpenCount / aiPosts : 0;
  const shareAnth = aiPosts > 0 ? leanAnthCount / aiPosts : 0;

  let vibeHeadline = "Chaos neutral reply guy";

  if (aiPct < 5 && totalPosts >= 3) {
    vibeHeadline = "Terminally offline (AI-wise)";
  } else if (aiPosts > 0) {
    const highEngagement = aiPosts >= 10;
    const balanced = dominantDelta < 12;

    if (shareOpen > 0.6 && o > a) {
      vibeHeadline = "Signed, sealed, Sam-pilled";
    } else if (shareOpen >= 0.4 && shareOpen <= 0.6 && o >= a) {
      vibeHeadline = "OpenAI-coded posting reflex";
    } else if (shareAnth > 0.6 && a > o) {
      vibeHeadline = "Constitutional AI enjoyer";
    } else if (shareAnth >= 0.4 && shareAnth <= 0.6 && a >= o) {
      vibeHeadline = "Anthropic-coded posting reflex";
    } else if (highEngagement && balanced) {
      vibeHeadline = "Both-sides AI maximalist";
    } else if (aiPct >= 40 && balanced) {
      vibeHeadline = "Chronically online, diplomatically neutral";
    } else if (o > a + 8 && o > n) {
      vibeHeadline = "Signed, sealed, Sam-pilled";
    } else if (a > o + 8 && a > n) {
      vibeHeadline = "Constitutional AI enjoyer";
    }
  }

  const cap = confidenceCapFromAiPosts(aiPosts);
  const evidenceStrength =
    aiPosts > 0
      ? posts
          .filter((p) => isAiRelevantTweet(normalizeText(p.text)))
          .reduce((acc, p) => acc + recencyWeight(p.createdAt, now), 0) / aiPosts
      : 0;
  const rawConf =
    clamp(evidenceStrength, 0.15, 1) *
    clamp(0.25 + dominantDelta / 120 + aiPosts * 0.035, 0, 1);
  const confidence = round2(clamp(Math.min(rawConf, cap), 0.05, cap));

  const anthropicOnlyReceipts = receipts.filter(
    (r) =>
      r.reason.includes("Anthropic/Claude signal") &&
      !r.reason.includes("OpenAI/GPT signal"),
  );
  const bothLabReceipts = receipts.filter(
    (r) =>
      r.reason.includes("Anthropic/Claude signal") &&
      r.reason.includes("OpenAI/GPT signal"),
  );
  const openaiOnlyReceipts = receipts.filter(
    (r) =>
      r.reason.includes("OpenAI/GPT signal") &&
      !r.reason.includes("Anthropic/Claude signal"),
  );
  const neutralReceipts = receipts.filter(
    (r) =>
      !r.reason.includes("OpenAI/GPT signal") &&
      !r.reason.includes("Anthropic/Claude signal"),
  );
  const orderedReceipts = [
    ...anthropicOnlyReceipts,
    ...bothLabReceipts,
    ...openaiOnlyReceipts,
    ...neutralReceipts,
  ];

  return {
    handle,
    scores: { openAI: o, anthropic: a, neutral: n },
    confidence,
    receipts: orderedReceipts.slice(0, 15),
    tags: Array.from(tagSet).slice(0, 5),
    vibeHeadline,
    postsAnalyzed: totalPosts,
    totalPosts,
    aiPosts,
    aiPct,
    meta,
  };
}
