import { cn } from "@/lib/utils";

type Props = {
  openAI: number;
  anthropic: number;
  tossUp: number;
  /** Shown under the bar; omit when the parent renders the same copy (e.g. CardDescription). */
  caption?: string;
  className?: string;
};

/** Anthrop ← toss-up strip → OpenAI; segment widths match normalized lab triple (sums to ~100%). */
export function ScoreSpectrum({
  openAI,
  anthropic,
  tossUp,
  caption,
  className,
}: Props) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex h-4 w-full overflow-hidden rounded-full ring-1 ring-border/60 sm:h-5">
        <div
          className="min-w-[2px] bg-orange-500/45 shadow-inner transition-[flex] duration-500 ease-out"
          style={{ flex: `${anthropic} 1 0%` }}
          title={`Anthropic-coded · ${anthropic.toFixed(1)}%`}
        />
        <div
          className="min-w-[2px] border-x border-border/50 bg-muted/90 transition-[flex] duration-500 ease-out"
          style={{ flex: `${tossUp} 1 0%` }}
          title={`Toss-up · ${tossUp.toFixed(1)}%`}
        />
        <div
          className="min-w-[2px] bg-emerald-500/45 shadow-inner transition-[flex] duration-500 ease-out"
          style={{ flex: `${openAI} 1 0%` }}
          title={`OpenAI-coded · ${openAI.toFixed(1)}%`}
        />
      </div>
      <p
        className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center font-mono text-sm leading-snug tracking-tight sm:text-base"
        aria-label={`Anthropic ${anthropic.toFixed(1)} percent, toss-up ${tossUp.toFixed(1)} percent, OpenAI ${openAI.toFixed(1)} percent`}
      >
        <span className="whitespace-nowrap font-bold text-foreground/90">
          Anthropic <span className="tabular-nums">{anthropic.toFixed(0)}%</span>
        </span>
        <span className="mx-2 font-normal text-border" aria-hidden>
          ·
        </span>
        <span className="whitespace-nowrap font-bold text-foreground/90">
          Toss-up <span className="tabular-nums">{tossUp.toFixed(0)}%</span>
        </span>
        <span className="mx-2 font-normal text-border" aria-hidden>
          ·
        </span>
        <span className="whitespace-nowrap font-bold text-foreground/90">
          OpenAI <span className="tabular-nums">{openAI.toFixed(0)}%</span>
        </span>
      </p>
      {caption ? (
        <p className="text-center text-sm text-muted-foreground sm:text-base">{caption}</p>
      ) : null}
    </div>
  );
}
