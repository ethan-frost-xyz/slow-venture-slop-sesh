import { Badge } from "@/components/ui/badge";
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

  const sourceLabel =
    meta.source === "live"
      ? "Live posts"
      : meta.source === "mock"
        ? "Sample posts"
        : meta.source === "cache"
          ? "Cached posts"
          : "Fallback sample";

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
          {vibeHeadline} · slop alignment (posting-style similarity only)
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
        <div className="col-span-2 mt-3 w-full">
          <ScoreSpectrum
            openAI={scores.openAI}
            anthropic={scores.anthropic}
            tossUp={scores.tossUp}
            caption="Lab split sums to 100% across posts that mention at least one lab (general AI chatter excluded)."
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-2">
        <p className="text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground sm:text-base">
          Slop alignment score (breakdown)
        </p>
        <div className="grid grid-cols-3 gap-3 text-center sm:gap-4">
          <ScorePill label="Anthropic-coded" value={scores.anthropic} tone="anthropic" />
          <ScorePill label="Toss-up" value={scores.tossUp} tone="tossUp" />
          <ScorePill label="OpenAI-coded" value={scores.openAI} tone="openai" />
        </div>
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
        <div>
          <p className="mb-2 text-center text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Receipts (why we think that)
          </p>
          <ul className="space-y-2">
            {receipts.map((r, i) => (
              <li
                key={`${r.postUrl ?? r.text}-${i}`}
                className="rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm leading-snug"
              >
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
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
                          Flagged (OpenAI):
                        </span>{" "}
                        {r.flaggedOpenAI?.join(" · ") ?? ""}
                      </p>
                    ) : null}
                    {(r.flaggedAnthropic?.length ?? 0) > 0 ? (
                      <p>
                        <span className="font-semibold text-orange-600/90 dark:text-orange-400/90">
                          Flagged (Anthropic):
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
          Parody index. Not evidence of who pays them, who employs them, or who
          they stan IRL—just how this profile&rsquo;s public posts rhyme with
          &ldquo;lab launch thread&rdquo; culture.
        </p>
        {meta.detail ? (
          <p className="font-mono text-[0.65rem] opacity-80">{meta.detail}</p>
        ) : null}
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
      className={`rounded-xl bg-card/80 px-2 py-3 ring-1 ring-inset ${ring} sm:px-3`}
    >
      <p className="text-[0.65rem] font-medium uppercase leading-tight tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-xl font-semibold tabular-nums sm:text-2xl">
        {value.toFixed(1)}
      </p>
    </div>
  );
}
