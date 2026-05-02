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
  "killed",
  "heat",
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
    "chopped",
    "shit",
    "cheeks",
    "cooked",
    "compute constrained",
    "rate limited",
    "overhyped",
    "lawsuit",
    "issue",
    "hallucinate",
    "hallucination",
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
/** Matching uses {@link normalizeForLabTerms} so gpt-5 / gpt 5 / gpt 5 align; list uses hyphen forms where natural. */
const OPENAI_DIRECT_TERMS = [
  "openai",
  "chatgpt",
  "chatgpt pro",
  "chatgpt plus",
  "chatgpt business",
  "chatgpt enterprise",
  "sama",
  "sam altman",
  "gpt-",
  "gpt ",
  "gpt3",
  "gpt4",
  "gpt5",
  "gpt-3",
  "gpt-4",
  "gpt-5",
  "gpt-4.1",
  "gpt-4o",
  "gpt4o",
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
  "sora-2",
  "sora-3",
  "sora-2-pro",
  "sora 2 pro",
  "image 2",
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
  "operator",
  "deep research",
  "canvas",
  "realtime api",
  "gpt-realtime",
  "gpt-audio",
  "openai projects",
];

/** Anthropic-scoped terms for directed sentiment and AI relevance (exclusive vs broad bucket). */
/** Same hyphen/space folding as OpenAI; opus-4 / opus 4 share one normalized key for receipts. */
const ANTHROPIC_DIRECT_TERMS = [
  "anthropic",
  "anthropic api",
  "claude api",
  "claude",
  "claude.ai",
  "dario",
  "dario amodei",
  "opus",
  "sonnet",
  "haiku",
  "mythos",
  "opusplan",
  "opus[1m]",
  "sonnet[1m]",
  "opus-4",
  "opus-3",
  "opus 4",
  "opus 3",
  "sonnet-4",
  "sonnet-3",
  "sonnet 4",
  "sonnet 3",
  "haiku-4",
  "haiku-3",
  "haiku 4",
  "claude-4",
  "claude-3",
  "claude-opus-4-7",
  "claude-sonnet-4-6",
  "claude-haiku-4-5",
  "claude-opus-4-6",
  "claude-sonnet-4-5",
  "claude-opus-4-5",
  "claude-4.5",
  "claude-4.6",
  "claude-4.7",
  "claude-3.5",
  "claude-3.7",
  "claude code",
  "cowork",
  "claude projects",
  "prompt caching",
  "claude artifacts",
  "claude desktop",
  "claude opus",
  "claude sonnet",
  "claude haiku",
];

/**
 * Lowercase, treat hyphens/underscores as spaces, collapse whitespace — lab-term substring
 * matching so gpt-5 / gpt 5 / gpt 5 and opus-4 / opus 4 behave the same.
 */
function normalizeForLabTerms(s: string): string {
  return s.toLowerCase().replace(/[\-_]+/g, " ").replace(/\s+/g, " ");
}

/** Longest stored term wins per normalized key (clearer receipts). */
function labTermMatches(textNorm: string, terms: readonly string[]): string[] {
  const textLab = normalizeForLabTerms(textNorm);
  const byNorm = new Map<string, string>();
  for (const term of terms) {
    const tn = normalizeForLabTerms(term);
    if (!tn || !textLab.includes(tn)) continue;
    const prev = byNorm.get(tn);
    if (!prev || term.length > prev.length) byNorm.set(tn, term);
  }
  return [...byNorm.values()].sort((a, b) => b.length - a.length || a.localeCompare(b));
}

/** Substrings from OPENAI_DIRECT_TERMS (and regex fallbacks) that appear in normalized text */
function flaggedOpenAIDirectPhrases(textNorm: string): string[] {
  const found = new Set(labTermMatches(textNorm, OPENAI_DIRECT_TERMS));
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
  return labTermMatches(textNorm, ANTHROPIC_DIRECT_TERMS);
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
  const lab = normalizeForLabTerms(textNorm);
  // OpenAI: 5.x decimals, gpt/model/version + 5 (hyphens already folded to spaces in lab)
  const openaiVerPattern =
    /\b5\.\d\b|\bgpt\s*5\b|\bmodel\s*5\b|\bversion\s*5\b/;

  // Anthropic: 4.x / 3.x decimals, claude/model/version + 3 or 4
  const anthropicVerPattern =
    /\b4\.\d\b|\b3\.\d\b|\bclaude\s*[34]\b|\bmodel\s*[34]\b|\bversion\s*[34]\b/;

  return {
    openaiVer: openaiVerPattern.test(lab),
    anthropicVer: anthropicVerPattern.test(lab),
  };
}

function hasBooster(textNorm: string): number {
  let n = 0;
  for (const ph of BOOSTER_PHRASES) {
    if (textNorm.includes(ph)) n += 1;
  }
  return Math.min(n, 3);
}

/** Drop http(s) links so path/query tokens (e.g. …/o44… on t.co) cannot match lab terms. */
function stripHttpUrls(s: string): string {
  return s.replace(/https?:\/\/[^\s]+/gi, " ");
}

function normalizeText(s: string): string {
  return stripHttpUrls(s).toLowerCase();
}

/** More weight to newer posts (half-life ~5 days). */
function recencyWeight(createdAt: string, now: number): number {
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return 0.5;
  const days = (now - t) / 86400000;
  return Math.exp(-days / 100);
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** Newest first; receipts without `createdAt` sort last. */
function sortReceiptsByCreatedAtDesc(receipts: ScoreReceipt[]): ScoreReceipt[] {
  return [...receipts].sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : NaN;
    const tb = b.createdAt ? Date.parse(b.createdAt) : NaN;
    const validA = !Number.isNaN(ta);
    const validB = !Number.isNaN(tb);
    if (validA && validB) return tb - ta;
    if (validA && !validB) return -1;
    if (!validA && validB) return 1;
    return 0;
  });
}

const RECEIPTS_SHOWN = 20;

/** Keep ambiguous (toss-up) receipts so /api/referee always receives them when toss-up mass > 0. */
function sliceReceiptsPrioritizingTossUp(
  receipts: ScoreReceipt[],
  limit: number,
): ScoreReceipt[] {
  const sorted = sortReceiptsByCreatedAtDesc(receipts);
  const tossUps = sorted.filter((r) => r.isTossUpContributor === true);
  const others = sorted.filter((r) => r.isTossUpContributor !== true);
  if (tossUps.length >= limit) {
    return tossUps.slice(0, limit);
  }
  return [...tossUps, ...others.slice(0, limit - tossUps.length)];
}

function publicPostUrl(handle: string, postId: string): string {
  const h = encodeURIComponent(handle);
  const id = encodeURIComponent(postId);
  return `https://x.com/${h}/status/${id}`;
}

/** Width in percentage points (Open − Anthropic) for each headline tier away from parity. */
const VIBE_DELTA_BAND = 12;

/**
 * Vibe headline from lab split percentages — same rules as the tail of {@link scoreSlopVibes}
 * (for UI after Grok reallocates toss-up into Open vs Anthropic).
 *
 * Tiers use symmetric bands of {@link VIBE_DELTA_BAND} points from parity: neutral within ±band,
 * then four outward steps (mild → … → extreme) on each side — equal width in Δ space.
 */
export function vibeHeadlineFromLabPercents(o: number, a: number, t: number): string {
  if (t >= o && t >= a && t >= 38) {
    return "Both-sides AI maximalist";
  }
  const delta = o - a;
  const b = VIBE_DELTA_BAND;
  if (delta > 4 * b) return "Says ‘we’ when OpenAI ships something";
  if (delta > 3 * b) return "Gets misty when they ship a context window bump";
  if (delta > 2 * b) return "Thought Sora was something special";
  if (delta > b) return "Believes Codex is better but never tried CC";
  if (delta < -4 * b) return "Would skip a wedding for an Opus priority window";
  if (delta < -3 * b) return "Rate limit kink";
  if (delta < -2 * b) return "Started vibecoding in late 2025 early 2026";
  if (delta < -b) return "Negative on Data Centers when at Bushwick houseparties";
  return "Reads code their own code";
}

export function scoreSlopVibes(input: ScoringInput): SlopScoreResult {
  const { handle, displayName, posts, meta } = input;
  const now = Date.now();
  const totalPosts = posts.length;

  if (posts.length === 0) {
    return {
      handle,
      ...(displayName ? { displayName } : {}),
      scores: { openAI: 50, anthropic: 50, tossUp: 0 },
      receipts: [
        {
          reason: "no_posts",
          text: "No public posts to compare — scores are a flat shrug.",
        },
      ],
      tags: [],
      vibeHeadline: "Touches grass or bard user",
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

    const onlyOpen = openMFinal && !anthMFinal;
    const onlyAnth = anthMFinal && !openMFinal;

    if (openMFinal || anthMFinal) {
      const onlyOneLabStrong =
        (onlyOpen || onlyAnth) && hasHypeSignal(textNorm) && boostN > 0;

      if (openMFinal) {
        if (neg) {
          // Credit the other lab like a quiet positive for that lab (same w/BASE/lean as non-neg branch).
          dAnth +=
            w * BASE_POS * 0.85 * (!anthMFinal ? 1.1 : 0.95);
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
          dOpen +=
            w * BASE_POS * 0.85 * (!openMFinal ? 1.1 : 0.95);
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

    // Bucket by where points landed (negative cross-lab credits the other lab).
    const EPS = 1e-9;
    const isTossUpContributor = postOpen > EPS && postAnth > EPS;
    if (isTossUpContributor) {
      tossUpPoints += postMass;
    } else if (postOpen > EPS) {
      openAIPoints += postMass;
    } else if (postAnth > EPS) {
      anthropicPoints += postMass;
    }

    if (receipts.length < 25) {
      const bits: string[] = [];
      if (openMFinal) bits.push("OpenAI/GPT signal");
      if (anthMFinal) bits.push("Anthropic/Claude signal");
      if (openaiVer || anthropicVer) bits.push("version signal");
      if (neg && (openMFinal || anthMFinal))
        bits.push("negative → other lab");
      if (boostN > 0 && (openMFinal || anthMFinal))
        bits.push("booster phrasing");
      if (hasHypeSignal(textNorm) && !openM && !anthM) bits.push("hype only");

      const flaggedOpenAI = [
        ...flaggedOpenAIDirect,
        ...(openaiVer ? ["OpenAI-style version cue in text"] : []),
      ];
      const flaggedAnthropic = [
        ...flaggedAnthropicDirect,
        ...(anthropicVer ? ["Anthropic-style version cue in text"] : []),
      ];

      // AI-relevant but no concrete receipt line (lab/version/hype-only/neg hooks; boosters listed only with lab flags).
      if (bits.length === 0) continue;

      receipts.push({
        reason: bits.join(" · "),
        ...(flaggedOpenAI.length > 0 ? { flaggedOpenAI } : {}),
        ...(flaggedAnthropic.length > 0 ? { flaggedAnthropic } : {}),
        ...(isTossUpContributor ? { isTossUpContributor: true } : {}),
        ...(neg && (openMFinal || anthMFinal)
          ? { negativeLabMention: true }
          : (openMFinal || anthMFinal) && !neg
            ? { positiveLabMention: true }
            : {}),
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
    // No lab-flagged weighted mass: keep Open-vs-Anth ambiguous (prior two-way shrug), zero toss-up.
    o = 50;
    a = 50;
    t = 0;
  } else {
    o = round2((openAIPoints / labSum) * 100);
    a = round2((anthropicPoints / labSum) * 100);
    t = round2(100 - o - a);
  }

  const aiRelevantPct =
    totalPosts > 0 ? Math.round((1000 * aiRelevantPostCount) / totalPosts) / 10 : 0;

  let vibeHeadline: string;
  if (aiRelevantPostCount === 0 && totalPosts >= 3) {
    vibeHeadline = "Terminally offline — AI-wise";
  } else if (labSum < 1e-6 && aiRelevantPostCount > 0) {
    vibeHeadline = "AI timeline, no lab fingerprints";
  } else {
    vibeHeadline = vibeHeadlineFromLabPercents(o, a, t);
  }

  const sortedReceipts = sortReceiptsByCreatedAtDesc(receipts);

  return {
    handle,
    ...(displayName ? { displayName } : {}),
    scores: { openAI: o, anthropic: a, tossUp: t },
    receipts: sliceReceiptsPrioritizingTossUp(sortedReceipts, RECEIPTS_SHOWN),
    tags: Array.from(tagSet).slice(0, 5),
    vibeHeadline,
    postsAnalyzed: totalPosts,
    totalPosts,
    aiRelevantPct,
    meta,
  };
}
