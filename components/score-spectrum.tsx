import { cn } from "@/lib/utils";

type Props = {
  openAI: number;
  anthropic: number;
  className?: string;
};

/** Horizontal “lab vibe” axis: Anthropic-coded ← → OpenAI-coded */
export function ScoreSpectrum({ openAI, anthropic, className }: Props) {
  const delta = openAI - anthropic;
  const position = Math.min(100, Math.max(0, 50 + delta / 2));

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground">
        <span>Anthropic-coded</span>
        <span>OpenAI-coded</span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-muted ring-1 ring-border/60">
        <div
          className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-violet-500/40 to-transparent"
          aria-hidden
        />
        <div
          className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-emerald-500/35 to-transparent"
          aria-hidden
        />
        <div
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground shadow-md"
          style={{ left: `${position}%` }}
          title="Posting-style lean (not affiliation)"
        />
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Pointer = similarity of tone to common lab-hype shapes · not employment
      </p>
    </div>
  );
}
