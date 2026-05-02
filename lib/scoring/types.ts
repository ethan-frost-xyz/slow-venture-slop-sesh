import type { Post, PostsFetchMeta } from "@/lib/providers/types";

/** 0–100 triple that sums to ~100 after normalization in response */
export type RawLabScores = {
  openAI: number;
  anthropic: number;
  neutral: number;
};

export type ScoreReceipt = {
  text: string;
  /** Short pointer to the signal type for transparency */
  reason: string;
  /** ISO 8601 post time when this receipt maps to a real post */
  createdAt?: string;
  /** Public post URL (e.g. x.com/status/…) when applicable */
  postUrl?: string;
};

export type SlopScoreResult = {
  handle: string;
  scores: {
    openAI: number;
    anthropic: number;
    neutral: number;
  };
  /** 0–1 how much evidence we had (volume + match strength) */
  confidence: number;
  receipts: ScoreReceipt[];
  tags: string[];
  /** Fun, non-defamatory headline for the card */
  vibeHeadline: string;
  /** Posts analyzed count */
  postsAnalyzed: number;
  /** Total tweets considered for scoring volume */
  totalPosts: number;
  /** Count of tweets classified as AI-relevant */
  aiPosts: number;
  /** Share of tweets that were AI-relevant (0–100, one decimal) */
  aiPct: number;
  meta: PostsFetchMeta;
};

export type ScoringInput = {
  handle: string;
  posts: Post[];
  meta: PostsFetchMeta;
};
