import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScoreSpectrum } from "@/components/score-spectrum";
import type { SlopScoreResult } from "@/lib/scoring/types";

type Props = {
  result: SlopScoreResult;
};

export function ResultCard({ result }: Props) {
  const { scores, confidence, receipts, tags, vibeHeadline, postsAnalyzed, meta } =
    result;

  const sourceLabel =
    meta.source === "live"
      ? "Live posts"
      : meta.source === "mock"
        ? "Demo fixture"
        : "Fallback sample";

  return (
    <Card className="border-border/80 shadow-lg shadow-black/20 ring-2 ring-foreground/5">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg sm:text-xl">
              @{result.handle}
            </CardTitle>
            <CardDescription className="mt-1 max-w-prose">
              {vibeHeadline} · posting-style similarity only
            </CardDescription>
          </div>
          <Badge variant="secondary" className="shrink-0 font-mono text-xs">
            {sourceLabel}
          </Badge>
        </div>
        <ScoreSpectrum openAI={scores.openAI} anthropic={scores.anthropic} />
      </CardHeader>
      <CardContent className="space-y-5 pt-2">
        <div className="grid grid-cols-3 gap-3 text-center sm:gap-4">
          <ScorePill label="OpenAI-coded" value={scores.openAI} tone="openai" />
          <ScorePill label="Anthropic-coded" value={scores.anthropic} tone="anthropic" />
          <ScorePill label="Neutral / indie" value={scores.neutral} tone="neutral" />
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-center">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Confidence
          </p>
          <p className="font-mono text-2xl font-semibold tabular-nums">
            {(confidence * 100).toFixed(0)}
            <span className="text-base font-normal text-muted-foreground">
              /100
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            How loud & recent the style signals were ({postsAnalyzed} posts)
          </p>
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
                key={`${r.text}-${i}`}
                className="rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm leading-snug"
              >
                <span className="text-xs text-muted-foreground">{r.reason}</span>
                <span className="mx-1 text-muted-foreground">·</span>
                <span className="italic">&ldquo;{r.text}&rdquo;</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t border-border/60 text-center text-xs text-muted-foreground">
        <p>
          Parody index. Not evidence of who pays you, who employs you, or who you
          stan IRL—just how your public posts rhyme with &ldquo;lab launch
          thread&rdquo; culture.
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
  tone: "openai" | "anthropic" | "neutral";
}) {
  const ring =
    tone === "openai"
      ? "ring-emerald-500/30"
      : tone === "anthropic"
        ? "ring-orange-500/35"
        : "ring-foreground/10";
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
