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
      <div className="flex justify-between text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground">
        <span>Anthropic-coded</span>
        <span className="px-2 text-primary">Toss-up</span>
        <span>OpenAI-coded</span>
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-full ring-1 ring-border/60">
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
      {caption ? (
        <p className="text-center text-xs text-muted-foreground">{caption}</p>
      ) : null}
    </div>
  );
}
