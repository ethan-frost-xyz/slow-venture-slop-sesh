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

/** Vendor-neutral model names only — OpenAI/Anthropic terms live in *_DIRECT_TERMS. */
const MODEL_NAMES_AI = ["gemini", "llama", "grok"];

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

/** OpenAI-scoped terms for directed sentiment and AI relevance (exclusive vs broad bucket). */
const OPENAI_DIRECT_TERMS = [
  "openai",
  "chatgpt",
  "gpt-",
  "gpt ",
  "gpt3",
  "gpt4",
  "gpt5",
  "gpt-4o",
  "gpt4o",
  "gpt-4.1",
  "gpt-5",
  "gpt-5.1",
  "gpt-5.2",
  "gpt-5.3",
  "gpt-5.4",
  "gpt-5.5",
  "gpt-5-nano",
  "gpt-5-pro",
  "gpt-5.5-pro",
  "gpt-5.4-mini",
  "gpt-5-mini",
  "o1",
  "o3",
  "o4",
  "o1-pro",
  "o3-mini",
  "o4-mini",
  "o3 mini",
  "o4 mini",
  "o3-deep-research",
  "o4-mini-deep-research",
  "o3 deep research",
  "o4-mini deep research",
  "sora",
  "sora 2",
  "sora 3",
  "sora-2",
  "sora 2 pro",
  "sora-2-pro",
  "dall-e",
  "dalle",
  "codex",
  "codex-1",
  "codex cli",
  "openai codex",
  "@codex",
  "gpt-5-codex",
  "gpt-5.4-codex",
  "gpt-5-codex-mini",
  "gpt-5.1-codex",
  "codex-mini-latest",
  "chatgpt pro",
  "chatgpt plus",
  "chatgpt business",
  "chatgpt enterprise",
  "operator",
  "deep research",
  "canvas",
  "realtime api",
  "gpt-realtime",
  "gpt-audio",
  "assistants api",
  "responses api",
  "openai projects",
  "sam altman",
];

/** Anthropic-scoped terms for directed sentiment and AI relevance (exclusive vs broad bucket). */
const ANTHROPIC_DIRECT_TERMS = [
  "anthropic",
  "anthropic api",
  "claude api",
  "claude",
  "claude.ai",
  "opus",
  "sonnet",
  "haiku",
  "opusplan",
  "opus[1m]",
  "sonnet[1m]",
  "constitutional ai",
  "claude code",
  "ultrareview",
  "claude cowork",
  "claude projects",
  "extended thinking",
  "prompt caching",
  "artifacts",
  "claude artifacts",
  "claude desktop",
  "claude opus",
  "claude sonnet",
  "claude haiku",
  "claude-opus-4-7",
  "claude-sonnet-4-6",
  "claude-haiku-4-5",
  "claude-opus-4-6",
  "claude-sonnet-4-5",
  "claude-opus-4-5",
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

/** Substrings from OPENAI_DIRECT_TERMS (and regex fallbacks) that appear in normalized text */
function flaggedOpenAIDirectPhrases(textNorm: string): string[] {
  const found = new Set<string>();
  for (const term of OPENAI_DIRECT_TERMS) {
    if (textNorm.includes(term)) found.add(term);
  }
  if (/\bgpt\b/.test(textNorm)) found.add("gpt");
  if (/\bo1\b/.test(textNorm)) found.add("o1");
  if (/\bo3\b/.test(textNorm)) found.add("o3");
  if (/\bo4\b/.test(textNorm)) found.add("o4");
  return [...found].sort((a, b) => b.length - a.length || a.localeCompare(b));
}

function mentionsOpenAIDirect(textNorm: string): boolean {
  return flaggedOpenAIDirectPhrases(textNorm).length > 0;
}

/** Substrings from ANTHROPIC_DIRECT_TERMS that appear in normalized text */
function flaggedAnthropicDirectPhrases(textNorm: string): string[] {
  const found = new Set<string>();
  for (const term of ANTHROPIC_DIRECT_TERMS) {
    if (textNorm.includes(term)) found.add(term);
  }
  return [...found].sort((a, b) => b.length - a.length || a.localeCompare(b));
}

function mentionsAnthropicDirect(textNorm: string): boolean {
  return flaggedAnthropicDirectPhrases(textNorm).length > 0;
}

function hasAiAnchor(textNorm: string): boolean {
  if (LAB_NAMES_AI.some((x) => textNorm.includes(x))) return true;
  if (MODEL_NAMES_AI.some((x) => textNorm.includes(x))) return true;
  if (BROAD_AI_CONCEPTS.some((x) => textNorm.includes(x))) return true;
  if (mentionsOpenAIDirect(textNorm)) return true;
  if (mentionsAnthropicDirect(textNorm)) return true;
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

export function scoreSlopVibes(input: ScoringInput): SlopScoreResult {
  const { handle, displayName, posts, meta } = input;
  const now = Date.now();
  const totalPosts = posts.length;

  if (posts.length === 0) {
    return {
      handle,
      ...(displayName ? { displayName } : {}),
      scores: { openAI: 33.33, anthropic: 33.33, tossUp: 33.34 },
      receipts: [
        {
          reason: "no_posts",
          text: "No public posts to compare — scores are a flat shrug.",
        },
      ],
      tags: [],
      vibeHeadline: "Schrodinger's shitposter",
      postsAnalyzed: totalPosts,
      totalPosts,
      aiRelevantPct: 0,
      meta,
    };
  }

  let openAIPoints = 0;
  let anthropicPoints = 0;
  let tossUpPoints = 0;
  let aiRelevantPostCount = 0;
  const receipts: ScoreReceipt[] = [];
  const tagSet = new Set<string>();

  const CROSS_WEIGHT = 0.6;
  const BASE_POS = 10;
  const BOOST_UNIT = 3;
  const ONLY_ONE_LAB_MULT = 1.35;

  for (const p of posts) {
    const w = recencyWeight(p.createdAt, now);
    const textNorm = normalizeText(p.text);

    if (!isAiRelevantTweet(textNorm)) {
      continue;
    }

    aiRelevantPostCount += 1;

    const flaggedOpenAIDirect = flaggedOpenAIDirectPhrases(textNorm);
    const flaggedAnthropicDirect = flaggedAnthropicDirectPhrases(textNorm);
    const openM = flaggedOpenAIDirect.length > 0;
    const anthM = flaggedAnthropicDirect.length > 0;
    const { openaiVer, anthropicVer } = extractVersionSignals(textNorm);
    const openMFinal = openM || openaiVer;
    const anthMFinal = anthM || anthropicVer;
    const neg = hasStrongNegative(textNorm);
    const boostN = hasBooster(textNorm);

    let dOpen = 0;
    let dAnth = 0;

    if (textNorm.includes("benchmark")) tagSet.add("benchmark glazing");

    const onlyOpen = openMFinal && !anthMFinal;
    const onlyAnth = anthMFinal && !openMFinal;

    if (openMFinal || anthMFinal) {
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
    }

    const postOpen = Math.max(0, dOpen);
    const postAnth = Math.max(0, dAnth);
    const postMass = postOpen + postAnth;

    if (openMFinal && anthMFinal) {
      tossUpPoints += postMass;
    } else if (openMFinal) {
      openAIPoints += postMass;
    } else if (anthMFinal) {
      anthropicPoints += postMass;
    }

    if (receipts.length < 25) {
      const bits: string[] = [];
      if (openMFinal) bits.push("OpenAI/GPT signal");
      if (anthMFinal) bits.push("Anthropic/Claude signal");
      if (openaiVer || anthropicVer) bits.push("version signal");
      if (neg && (openMFinal || anthMFinal))
        bits.push("negative → cross-lab boost");
      if (boostN > 0) bits.push("booster phrasing");
      if (hasHypeSignal(textNorm) && !openM && !anthM) bits.push("hype only");
      if (bits.length === 0) bits.push("general AI");

      const flaggedOpenAI = [
        ...flaggedOpenAIDirect,
        ...(openaiVer ? ["(OpenAI-style version cue in text)"] : []),
      ];
      const flaggedAnthropic = [
        ...flaggedAnthropicDirect,
        ...(anthropicVer ? ["(Anthropic-style version cue in text)"] : []),
      ];

      receipts.push({
        reason: bits.join(" · "),
        ...(flaggedOpenAI.length > 0 ? { flaggedOpenAI } : {}),
        ...(flaggedAnthropic.length > 0 ? { flaggedAnthropic } : {}),
        text: truncate(p.text, 140),
        createdAt: p.createdAt,
        postUrl: publicPostUrl(handle, p.id),
        ...(typeof p.likeCount === "number" ? { likeCount: p.likeCount } : {}),
      });
    }
  }

  const labSum = openAIPoints + anthropicPoints + tossUpPoints;

  const round2 = (x: number) => Math.round(x * 100) / 100;

  let o: number;
  let a: number;
  let t: number;

  if (labSum < 1e-6) {
    // No lab-flagged weighted mass (e.g. only general AI). Equal thirds so UI still parses.
    o = 33.33;
    a = 33.33;
    t = 33.34;
  } else {
    o = round2((openAIPoints / labSum) * 100);
    a = round2((anthropicPoints / labSum) * 100);
    t = round2(100 - o - a);
  }

  const aiRelevantPct =
    totalPosts > 0 ? Math.round((1000 * aiRelevantPostCount) / totalPosts) / 10 : 0;

  let vibeHeadline = "Chaos neutral reply guy";

  if (aiRelevantPostCount === 0 && totalPosts >= 3) {
    vibeHeadline = "Terminally offline (AI-wise)";
  } else if (labSum < 1e-6 && aiRelevantPostCount > 0) {
    vibeHeadline = "AI timeline, no lab fingerprints";
  } else if (t >= o && t >= a && t >= 38) {
    vibeHeadline = "Both-sides AI maximalist";
  } else {
    const delta = o - a;
    if (delta > 40) vibeHeadline = "Signed, sealed, Sam-pilled";
    else if (delta > 20) vibeHeadline = "OpenAI-coded posting reflex";
    else if (delta > 8) vibeHeadline = "Mild GPT energy";
    else if (delta < -40) vibeHeadline = "Constitutional AI enjoyer";
    else if (delta < -20) vibeHeadline = "Anthropic-coded posting reflex";
    else if (delta < -8) vibeHeadline = "Subtle Claude bias";
    else vibeHeadline = "Both-sides AI maximalist";
  }

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
    ...(displayName ? { displayName } : {}),
    scores: { openAI: o, anthropic: a, tossUp: t },
    receipts: orderedReceipts.slice(0, 20),
    tags: Array.from(tagSet).slice(0, 5),
    vibeHeadline,
    postsAnalyzed: totalPosts,
    totalPosts,
    aiRelevantPct,
    meta,
  };
}
