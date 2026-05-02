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
  CardAction,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScoreSpectrum } from "@/components/score-spectrum";
import type { SlopScoreResult } from "@/lib/scoring/types";

type Props = {
  result: SlopScoreResult;
};

type LabScores = SlopScoreResult["scores"];

type GrokDecideResponse = {
  scores: LabScores;
  recap: string;
};

function isGrokDecideResponse(data: unknown): data is GrokDecideResponse {
  if (typeof data !== "object" || data === null || "error" in data) return false;
  const scores = (data as { scores?: unknown }).scores;
  if (typeof scores !== "object" || scores === null) return false;
  const s = scores as Record<string, unknown>;
  const recap = (data as { recap?: unknown }).recap;
  return (
    typeof s.openAI === "number" &&
    typeof s.anthropic === "number" &&
    typeof s.tossUp === "number" &&
    typeof recap === "string"
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
  const [grokRecap, setGrokRecap] = useState<string | null>(null);
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

  const showRefereeButton = scores.tossUp > 0;
  const displayScores = refereeScores ?? scores;

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
      if (!isGrokDecideResponse(data)) {
        setRefereeError("Unexpected response from Grok.");
        return;
      }
      setRefereeScores(data.scores);
      setGrokRecap(data.recap.trim());
    } catch {
      setRefereeError("Network error. Try again.");
    } finally {
      setRefereeLoading(false);
    }
  }

  return (
    <Card className="border-border/80 shadow-lg shadow-black/20 ring-2 ring-foreground/5">
      <CardHeader className="border-b border-border/60 pb-4">
        <CardTitle className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-lg sm:text-xl">
          {displayName ? (
            <>
              <span>{displayName}</span>
              <span className="font-normal text-muted-foreground">@{handle}</span>
            </>
          ) : (
            <span>@{handle}</span>
          )}
        </CardTitle>
        <CardDescription className="mt-1 max-w-prose text-pretty">
          {vibeHeadline}
        </CardDescription>
        <CardAction className="justify-self-end">
          <Badge
            variant="secondary"
            className="h-auto min-h-0 shrink-0 flex-col items-end justify-center gap-0.5 overflow-visible py-1.5 text-right align-top font-mono text-xs leading-tight whitespace-normal"
          >
            <span className="whitespace-nowrap">{sourceLabel}</span>
            <span className="text-[0.65rem] font-normal leading-snug whitespace-nowrap text-muted-foreground">
              {aiRelevantPct.toFixed(1)}% AI-relevant · {totalPosts} posts
            </span>
          </Badge>
        </CardAction>
        <div className="col-span-2 mt-3 flex w-full flex-col gap-3">
          {refereeScores ? (
            <div className="rounded-lg bg-muted/30 px-2 py-2 opacity-80 ring-1 ring-border/40">
              <p className="mb-1 text-center text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Before · heuristic
              </p>
              <ScoreSpectrum
                openAI={scores.openAI}
                anthropic={scores.anthropic}
                tossUp={scores.tossUp}
                caption={undefined}
              />
            </div>
          ) : null}
          <div className={refereeScores ? "animate-in fade-in duration-500" : ""}>
            {refereeScores ? (
              <p className="mb-1 text-center text-[0.65rem] font-semibold uppercase tracking-wider text-foreground">
                After · Grok
              </p>
            ) : null}
            <ScoreSpectrum
              openAI={displayScores.openAI}
              anthropic={displayScores.anthropic}
              tossUp={displayScores.tossUp}
              caption="Lab split sums to 100% across posts that mention at least one lab. General AI chatter excluded."
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-2">
        {refereeError ? (
          <Alert variant="destructive">
            <AlertTitle>Grok could not decide</AlertTitle>
            <AlertDescription>{refereeError}</AlertDescription>
          </Alert>
        ) : null}
        <p className="text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground sm:text-base">
          Slop alignment score
        </p>
        {refereeScores ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/30 px-2 py-3 opacity-80 ring-1 ring-border/40">
              <p className="mb-2 text-center text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Before · heuristic
              </p>
              <div className="grid grid-cols-3 gap-3 text-center sm:gap-4">
                <ScorePill label="Anthropic-coded" value={scores.anthropic} tone="anthropic" />
                <ScorePill label="Toss-up" value={scores.tossUp} tone="tossUp" />
                <ScorePill label="OpenAI-coded" value={scores.openAI} tone="openai" />
              </div>
            </div>
            <div className="animate-in fade-in duration-500">
              <p className="mb-2 text-center text-[0.65rem] font-semibold uppercase tracking-wider text-foreground">
                After · Grok
              </p>
              <div className="grid grid-cols-3 gap-3 text-center sm:gap-4">
                <ScorePill
                  label="Anthropic-coded"
                  value={refereeScores.anthropic}
                  tone="anthropic"
                />
                <ScorePill label="Toss-up" value={refereeScores.tossUp} tone="tossUp" />
                <ScorePill label="OpenAI-coded" value={refereeScores.openAI} tone="openai" />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 text-center sm:gap-4">
            <ScorePill label="Anthropic-coded" value={scores.anthropic} tone="anthropic" />
            <ScorePill label="Toss-up" value={scores.tossUp} tone="tossUp" />
            <ScorePill label="OpenAI-coded" value={scores.openAI} tone="openai" />
          </div>
        )}
        {tags.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-2">
            {tags.map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="text-xs font-normal underline-offset-2"
              >
                {t}
              </Badge>
            ))}
          </div>
        ) : null}
        {showRefereeButton ? (
          <div className="flex flex-col items-center gap-2 border-t border-border/50 pt-4">
            <Button
              type="button"
              className="min-w-[12rem] animate-in fade-in duration-300 motion-safe:transition-[transform,box-shadow] motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg motion-safe:active:translate-y-px motion-safe:active:shadow-sm gap-2"
              disabled={refereeLoading || refereeScores !== null}
              aria-busy={refereeLoading}
              onClick={letGrokDecide}
            >
              {refereeLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Grok is deciding…
                </>
              ) : refereeScores ? (
                "Grok decided"
              ) : (
                "Let Grok decide"
              )}
            </Button>
            {grokRecap ? (
              <div className="w-full max-w-prose rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-left">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Why the score shifted
                </p>
                <p className="mt-1.5 text-sm leading-snug text-foreground">{grokRecap}</p>
              </div>
            ) : null}
          </div>
        ) : null}
        <div>
          <p className="mb-2 text-center text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Receipts
          </p>
          <ul className="space-y-2">
            {receipts.map((r, i) => (
              <li
                key={`${r.postUrl ?? r.text}-${i}`}
                className={`rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm leading-snug ${
                  r.isTossUpContributor ? "ring-1 ring-amber-500/25" : ""
                }`}
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  {r.isTossUpContributor ? (
                    <Badge
                      variant="outline"
                      className="shrink-0 border-amber-500/50 bg-amber-500/5 text-[0.65rem] font-medium text-amber-950 dark:text-amber-100"
                    >
                      Toss-up post
                    </Badge>
                  ) : null}
                  {r.negativeLabMention ? (
                    <Badge
                      variant="outline"
                      className="shrink-0 border-amber-500/40 bg-amber-500/10 text-[0.65rem] font-medium text-amber-950 dark:text-amber-100"
                    >
                      Negative
                    </Badge>
                  ) : r.positiveLabMention ? (
                    <Badge
                      variant="outline"
                      className="shrink-0 border-emerald-500/40 bg-emerald-500/10 text-[0.65rem] font-medium text-emerald-950 dark:text-emerald-100"
                    >
                      Positive
                    </Badge>
                  ) : null}
                  <span className="text-xs text-muted-foreground">{r.reason}</span>
                  {typeof r.likeCount === "number" ? (
                    <span className="text-xs text-muted-foreground">
                      · {r.likeCount.toLocaleString()} likes
                    </span>
                  ) : null}
                  {r.createdAt ? (
                    <time
                      className="text-[0.65rem] font-mono text-muted-foreground"
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
                  <div className="mt-1 space-y-0.5 text-[0.65rem] leading-tight text-muted-foreground">
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
                    className="mt-2 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
                  >
                    View
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t border-border/60 text-center text-xs text-muted-foreground">
        <p>
          <em>&ldquo;God is on the side of the heaviest cannon.&rdquo;</em>
          <br />
          Napoleon Bonaparte
        </p>
      </CardFooter>
    </Card>
  );
}

function ScorePill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "openai" | "anthropic" | "tossUp";
}) {
  const ring =
    tone === "openai"
      ? "ring-emerald-500/30"
      : tone === "anthropic"
        ? "ring-orange-500/35"
        : "ring-foreground/12";
  return (
    <div
      className={`rounded-xl bg-card/80 px-2 py-3 ring-1 ring-inset transition-colors duration-500 ${ring} sm:px-3`}
    >
      <p className="text-[0.65rem] font-medium uppercase leading-tight tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-xl font-semibold tabular-nums transition-all duration-500 sm:text-2xl">
        {value.toFixed(1)}
      </p>
    </div>
  );
}
