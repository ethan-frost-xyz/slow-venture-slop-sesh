import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
};

export function HandleForm({ value, onChange, onSubmit, disabled }: Props) {
  return (
    <form
      className="flex w-full flex-col gap-3 sm:flex-row sm:items-center"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          @
        </span>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/^@+/, ""))}
          placeholder="username"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          className="pl-7 font-mono"
          aria-label="X username"
        />
      </div>
      <Button type="submit" disabled={disabled} className="shrink-0 sm:h-8">
        Run the index
      </Button>
    </form>
  );
}
