import { Button } from "@/components/ui/button";
import { DEMO_ACCOUNTS } from "@/lib/mock-data";

type Props = {
  onPick: (handle: string) => void;
  disabled?: boolean;
};

export function ExamplesRow({ onPick, disabled }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Demo profiles (always work offline)
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {DEMO_ACCOUNTS.map((d) => (
          <Button
            key={d.handle}
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onPick(d.handle)}
            className="font-mono text-xs"
          >
            @{d.handle}
          </Button>
        ))}
      </div>
    </div>
  );
}
