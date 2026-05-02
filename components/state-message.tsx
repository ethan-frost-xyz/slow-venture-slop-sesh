import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  className?: string;
  children?: ReactNode;
};

export function StateMessage({ title, description, className, children }: Props) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-border/80 bg-muted/30 px-5 py-8 text-center",
        className,
      )}
    >
      <p className="font-medium text-primary">{title}</p>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      ) : null}
      {children}
    </div>
  );
}
