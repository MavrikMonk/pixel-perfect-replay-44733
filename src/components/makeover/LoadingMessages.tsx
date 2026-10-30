import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const MESSAGES = [
  "Measuring the light in your room…",
  "Moving the old furniture out (virtually)…",
  "Choosing fabrics and finishes…",
  "Arranging the new pieces…",
  "Hanging the curtains just right…",
  "Fluffing the cushions…",
  "Adjusting the lamps for a warmer glow…",
  "Adding the final touches…",
];

export function LoadingMessages({ label }: { label?: string }) {
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % MESSAGES.length), 3200);
    const tick = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      clearInterval(id);
      clearInterval(tick);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 text-center" role="status" aria-live="polite">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card text-primary shadow-soft">
        <Sparkles className="h-5 w-5 animate-pulse" />
      </div>
      {label && <p className="eyebrow text-overlay-foreground">{label}</p>}
      <p key={index} className="animate-message-in font-display text-xl text-overlay-foreground sm:text-2xl">
        {MESSAGES[index]}
      </p>
      <p className="text-sm text-overlay-foreground/80">
        Usually 10–30 seconds · {seconds}s
      </p>
    </div>
  );
}
