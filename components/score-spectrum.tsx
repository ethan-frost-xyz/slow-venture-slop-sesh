import { cn } from "@/lib/utils";

type Props = {
  openAI: number;
  anthropic: number;
  className?: string;
};

/** Profile slop alignment on the Anthropic-coded ← → OpenAI-coded axis */
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
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground shadow-md"
          style={{ left: `${position}%` }}
          title="Profile slop alignment on this axis (not affiliation)"
        />
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Not employment or affiliation.
      </p>
    </div>
  );
}
