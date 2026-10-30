import { useState } from "react";
import { MoveHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  before: string;
  after: string;
  beforeAlt?: string;
  afterAlt?: string;
  afterClassName?: string;
  className?: string;
  priority?: boolean;
  children?: React.ReactNode;
};

export function CompareSlider({
  before,
  after,
  beforeAlt = "Original room",
  afterAlt = "Room makeover",
  afterClassName,
  className,
  priority,
  children,
}: Props) {
  const [pos, setPos] = useState(50);

  return (
    <div
      className={cn(
        "relative w-full select-none overflow-hidden rounded-3xl bg-muted shadow-lift",
        "aspect-[3/2]",
        className,
      )}
    >
      <img
        src={after}
        alt={afterAlt}
        className={cn("absolute inset-0 h-full w-full object-cover", afterClassName)}
        loading={priority ? "eager" : "lazy"}
        draggable={false}
      />
      <img
        src={before}
        alt={beforeAlt}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        loading={priority ? "eager" : "lazy"}
        draggable={false}
      />

      <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-overlay px-3 py-1 text-xs font-semibold tracking-wide text-overlay-foreground backdrop-blur">
        Before
      </span>
      <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-overlay px-3 py-1 text-xs font-semibold tracking-wide text-overlay-foreground backdrop-blur">
        After
      </span>

      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-card shadow-soft"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-card text-foreground shadow-lift">
          <MoveHorizontal className="h-5 w-5" />
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={0.5}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Drag to compare before and after"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
      {children}
    </div>
  );
}
