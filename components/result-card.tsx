"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScoreSpectrum } from "@/components/score-spectrum";
import {
  overallSlopHero,
  type OverallSlopHero,
  vibeHeadlineFromLabPercents,
} from "@/lib/scoring/heuristic";
import type { SlopScoreResult } from "@/lib/scoring/types";

type Props = {
  result: SlopScoreResult;
};

type LabScores = SlopScoreResult["scores"];

type RefereeScoresResponse = {
  scores: LabScores;
};

function isRefereeScoresResponse(data: unknown): data is RefereeScoresResponse {
  if (typeof data !== "object" || data === null || "error" in data) return false;
  const scores = (data as { scores?: unknown }).scores;
  if (typeof scores !== "object" || scores === null) return false;
  const s = scores as Record<string, unknown>;
  return (
    typeof s.openAI === "number" &&
    typeof s.anthropic === "number" &&
    typeof s.tossUp === "number"
  );
}

export function ResultCard({ result }: Props) {
  const {
    scores,
    receipts,
    tags,
    vibeHeadline,
    meta,
    displayName,
    handle,
    aiRelevantPct,
    totalPosts,
  } = result;

  const [refereeScores, setRefereeScores] = useState<LabScores | null>(null);
  const [refereeError, setRefereeError] = useState<string | null>(null);
  const [refereeLoading, setRefereeLoading] = useState(false);

  const sourceLabel =
    meta.source === "live"
      ? "Live posts"
      : meta.source === "mock"
        ? "Sample posts"
        : meta.source === "cache"
          ? "Cached posts"
          : "Fallback sample";

  const displayHeadline =
    refereeScores !== null
      ? vibeHeadlineFromLabPercents(
          refereeScores.openAI,
          refereeScores.anthropic,
          refereeScores.tossUp,
        )
      : vibeHeadline;

  const showRefereeButton =
    scores.tossUp > 0 && receipts.some((r) => r.isTossUpContributor === true);
  const displayScores = refereeScores ?? scores;

  const displayHero = overallSlopHero(
    displayScores.openAI,
    displayScores.anthropic,
    displayScores.tossUp,
  );

  async function letGrokDecide() {
    setRefereeError(null);
    setRefereeLoading(true);
    try {
      const res = await fetch("/api/referee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores, receipts }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Request failed. Try again.";
        setRefereeError(msg);
        return;
      }
      if (!isRefereeScoresResponse(data)) {
        setRefereeError("Unexpected response from referee.");
        return;
      }
      setRefereeScores(data.scores);
    } catch {
      setRefereeError("Network error. Try again.");
    } finally {
      setRefereeLoading(false);
    }
  }

  return (
    <Card className="relative border-border/80 shadow-lg shadow-black/20 ring-2 ring-foreground/5">
      <Badge
        variant="secondary"
        className="absolute top-2 right-2 z-10 h-auto min-h-0 max-w-[calc(100%-1rem)] flex-col items-end justify-center gap-1 py-2 text-right font-mono text-sm font-medium leading-tight whitespace-normal sm:max-w-[min(100%-1rem,12rem)]"
      >
        <span className="whitespace-nowrap">{sourceLabel}</span>
        <span className="text-xs font-normal leading-snug whitespace-nowrap text-muted-foreground">
          {aiRelevantPct.toFixed(1)}% AI-relevant · {totalPosts} posts
        </span>
      </Badge>
      <CardHeader className="flex flex-col gap-3 border-b border-border/60 pb-4 pt-1 sm:gap-4">
        <div className="min-w-0 pr-36 sm:pr-44">
          <CardTitle className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xl font-semibold tracking-tight sm:text-2xl">
            {displayName ? (
              <>
                <span>{displayName}</span>
                <span className="font-normal text-muted-foreground">@{handle}</span>
              </>
            ) : (
              <span>@{handle}</span>
            )}
          </CardTitle>
        </div>
        <div className="mt-2 w-full space-y-3 text-center sm:mt-3 sm:space-y-4">
          <p className="text-xl font-bold uppercase tracking-wide text-primary sm:text-2xl">
            Slop alignment score
          </p>
          <OverallScoreHero hero={displayHero} />
        </div>
        <div className="flex w-full flex-col gap-3">
          {refereeScores ? (
            <div className="rounded-lg bg-muted/30 px-2 py-2 opacity-80 ring-1 ring-border/40">
              <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
                Before · heuristic
              </p>
              <ScoreSpectrum
                openAI={scores.openAI}
                anthropic={scores.anthropic}
                tossUp={scores.tossUp}
              />
            </div>
          ) : null}
          <div className={refereeScores ? "animate-in fade-in duration-500" : ""}>
            {refereeScores ? (
              <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-primary sm:text-sm">
                After · Grok
              </p>
            ) : null}
            <ScoreSpectrum
              openAI={displayScores.openAI}
              anthropic={displayScores.anthropic}
              tossUp={displayScores.tossUp}
            />
          </div>
        </div>
        <CardDescription className="mx-auto w-full max-w-prose text-pretty text-center text-lg font-medium italic leading-snug text-foreground/90 sm:text-xl">
          {displayHeadline}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-2">
        {refereeError ? (
          <Alert variant="destructive">
            <AlertTitle>Grok could not cook</AlertTitle>
            <AlertDescription>{refereeError}</AlertDescription>
          </Alert>
        ) : null}
        {showRefereeButton ? (
          <div className="flex flex-col items-center gap-2 border-t border-border/50 pt-4">
            {!refereeScores ? (
              <Button
                type="button"
                size="lg"
                className="min-w-[12rem] animate-in fade-in duration-300 text-base motion-safe:transition-[transform,box-shadow] motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg motion-safe:active:translate-y-px motion-safe:active:shadow-sm gap-2"
                disabled={refereeLoading}
                aria-busy={refereeLoading}
                onClick={letGrokDecide}
              >
                {refereeLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Grok is cooking…
                  </>
                ) : (
                  "Let Grok Cook"
                )}
              </Button>
            ) : null}
          </div>
        ) : null}
        {tags.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-2">
            {tags.map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="text-sm font-normal underline-offset-2"
              >
                {t}
              </Badge>
            ))}
          </div>
        ) : null}
        <div>
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-primary sm:text-sm">
            Receipts
          </p>
          <ul className="space-y-2">
            {receipts.map((r, i) => (
              <li
                key={`${r.postUrl ?? r.text}-${i}`}
                className={`rounded-lg border border-border/50 bg-background/50 px-3 py-3 text-base leading-snug ${
                  r.isTossUpContributor ? "ring-1 ring-amber-500/25" : ""
                }`}
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  {r.isTossUpContributor ? (
                    <Badge
                      variant="outline"
                      className="shrink-0 border-amber-500/50 bg-amber-500/5 text-xs font-medium text-amber-950 dark:text-amber-100"
                    >
                      Toss-up post
                    </Badge>
                  ) : null}
                  {r.negativeLabMention ? (
                    <Badge
                      variant="outline"
                      className="shrink-0 border-amber-500/40 bg-amber-500/10 text-xs font-medium text-amber-950 dark:text-amber-100"
                    >
                      Negative
                    </Badge>
                  ) : r.positiveLabMention ? (
                    <Badge
                      variant="outline"
                      className="shrink-0 border-emerald-500/40 bg-emerald-500/10 text-xs font-medium text-emerald-950 dark:text-emerald-100"
                    >
                      Positive
                    </Badge>
                  ) : null}
                  <span className="text-sm text-muted-foreground">{r.reason}</span>
                  {typeof r.likeCount === "number" ? (
                    <span className="text-sm text-muted-foreground">
                      · {r.likeCount.toLocaleString()} likes
                    </span>
                  ) : null}
                  {r.createdAt ? (
                    <time
                      className="text-xs font-mono text-muted-foreground sm:text-sm"
                      dateTime={r.createdAt}
                    >
                      {new Date(r.createdAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </time>
                  ) : null}
                </div>
                {(r.flaggedOpenAI?.length ?? 0) > 0 ||
                (r.flaggedAnthropic?.length ?? 0) > 0 ? (
                  <div className="mt-1 space-y-0.5 text-sm leading-snug text-muted-foreground">
                    {(r.flaggedOpenAI?.length ?? 0) > 0 ? (
                      <p>
                        <span className="font-semibold text-emerald-600/90 dark:text-emerald-400/90">
                          OpenAI flags:
                        </span>{" "}
                        {r.flaggedOpenAI?.join(" · ") ?? ""}
                      </p>
                    ) : null}
                    {(r.flaggedAnthropic?.length ?? 0) > 0 ? (
                      <p>
                        <span className="font-semibold text-orange-600/90 dark:text-orange-400/90">
                          Anthropic flags:
                        </span>{" "}
                        {r.flaggedAnthropic?.join(" · ") ?? ""}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <p className="mt-1 italic">&ldquo;{r.text}&rdquo;</p>
                {r.postUrl ? (
                  <a
                    href={r.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-base font-medium text-primary underline-offset-2 hover:underline"
                  >
                    View
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t border-border/60 text-center text-sm text-muted-foreground sm:text-base">
        <p>
          <em className="text-primary">
            &ldquo;God is on the side of the heaviest cannon.&rdquo;
          </em>
          <br />
          <span className="text-primary/90">Napoleon Bonaparte</span>
        </p>
      </CardFooter>
    </Card>
  );
}

function OverallScoreHero({ hero }: { hero: OverallSlopHero }) {
  if (hero.kind === "dualOpenAnth") {
    return (
      <div className="space-y-2">
        <p className="font-mono text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
          <span className="text-emerald-600 dark:text-emerald-400/95">
            {hero.openAI.toFixed(1)}%
          </span>
          <span className="mx-2 font-normal text-muted-foreground">·</span>
          <span className="text-orange-600 dark:text-orange-400/95">
            {hero.anthropic.toFixed(1)}%
          </span>
        </p>
        <p className="text-base text-muted-foreground sm:text-lg">
          Even OpenAI- vs Anthropic-coded lab mass
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p className="font-mono text-5xl font-bold tracking-tight tabular-nums text-foreground sm:text-6xl">
        {hero.pct.toFixed(1)}
        <span className="text-3xl font-semibold text-primary sm:text-4xl">%</span>
      </p>
      <p className="text-base text-muted-foreground sm:text-lg">
        of {hero.ofLabel}
      </p>
    </div>
  );
}
