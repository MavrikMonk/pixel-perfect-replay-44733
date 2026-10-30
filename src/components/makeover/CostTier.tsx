import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { normalizeCostTier } from "@/lib/makeover";

export type CostState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; tier: number; reason: string }
  | { status: "error"; message: string };

const TIER_NAMES = ["", "Budget", "Affordable", "Mid-range", "Premium", "Luxury"];

export function CostTier({ state, onRetry }: { state: CostState; onRetry: () => void }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <p className="eyebrow">Estimated cost</p>
      {state.status === "loading" && (
        <div className="mt-4 flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Pricing up the look…
        </div>
      )}
      {state.status === "done" && (
        <>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-display text-4xl tracking-wide" aria-label={`${normalizeCostTier(state.tier)} out of 5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={cn(n <= state.tier ? "text-primary" : "text-border")}>
                  $
                </span>
              ))}
            </span>
            <span className="text-sm font-semibold">{TIER_NAMES[normalizeCostTier(state.tier)]}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{state.reason}</p>
          <p className="mt-3 text-xs text-muted-foreground/80">A rough guide to furniture & decor, not a quote.</p>
        </>
      )}
      {state.status === "error" && (
        <div className="mt-3 space-y-2 text-sm">
          <p className="text-muted-foreground">{state.message}</p>
          <button type="button" onClick={onRetry} className="font-semibold text-primary underline underline-offset-4">
            Try again
          </button>
        </div>
      )}
      {state.status === "idle" && <p className="mt-3 text-sm text-muted-foreground">Appears with your makeover.</p>}
    </div>
  );
}
