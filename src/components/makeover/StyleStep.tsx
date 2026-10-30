import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { ROOM_STYLES, type StyleId } from "@/lib/makeover";

type Props = {
  value: StyleId | null;
  onChange: (id: StyleId) => void;
  disabled?: boolean;
};

export function StyleStep({ value, onChange, disabled }: Props) {
  return (
    <div role="radiogroup" aria-label="Choose a style" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ROOM_STYLES.map((style, i) => {
        const active = value === style.id;
        return (
          <button
            key={style.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(style.id)}
            className={cn(
              "relative flex flex-col gap-2 rounded-2xl border bg-card p-5 text-left transition disabled:opacity-50",
              active
                ? "border-primary shadow-soft ring-2 ring-primary/25"
                : "border-border hover:border-primary/50 hover:bg-muted",
            )}
          >
            <span className="flex items-center justify-between">
              <span className="eyebrow">{String(i + 1).padStart(2, "0")}</span>
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border transition",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-input",
                )}
              >
                {active && <Check className="h-3.5 w-3.5" />}
              </span>
            </span>
            <span className="font-display text-xl">{style.name}</span>
            <span className="text-sm leading-relaxed text-muted-foreground">{style.description}</span>
            <span className="mt-1 text-xs font-medium text-primary">{style.keywords}</span>
          </button>
        );
      })}
    </div>
  );
}
