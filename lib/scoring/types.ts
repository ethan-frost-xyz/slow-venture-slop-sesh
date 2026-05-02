import type { Post, PostsFetchMeta } from "@/lib/providers/types";

/** Raw OpenAI vs Anthropic point totals before normalization to a 0–100 pair summing to 100 */
export type RawLabScores = {
  openAI: number;
  anthropic: number;
};

export type ScoreReceipt = {
  text: string;
  /** Short pointer to the signal type for transparency */
  reason: string;
  /** ISO 8601 post time when this receipt maps to a real post */
  createdAt?: string;
  /** Public post URL (e.g. x.com/status/…) when applicable */
  postUrl?: string;
  /** Like/favorite count when the ingest layer provided it */
  likeCount?: number;
};

export type SlopScoreResult = {
  handle: string;
  /** Public display name when the ingest layer provided it */
  displayName?: string;
  scores: {
    openAI: number;
    anthropic: number;
  };
  receipts: ScoreReceipt[];
  tags: string[];
  /** Fun, non-defamatory headline for the card */
  vibeHeadline: string;
  /** Posts analyzed count */
  postsAnalyzed: number;
  /** Total tweets considered for scoring volume */
  totalPosts: number;
  meta: PostsFetchMeta;
};

export type ScoringInput = {
  handle: string;
  displayName?: string;
  posts: Post[];
  meta: PostsFetchMeta;
};
