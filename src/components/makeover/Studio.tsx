import { useCallback, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, Download, RotateCcw, Sparkles, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { estimateCost } from "@/lib/cost.functions";
import { dataUrlToFile, downscaleToDataUrl, prepareForUpload } from "@/lib/image-prep";
import { MAX_KEEP_LENGTH, MAX_REFINE_LENGTH, getStyle, sizeForDimensions, type StyleId } from "@/lib/makeover";
import { friendlyImageError, streamImage } from "@/lib/stream-image";

import { CompareSlider } from "./CompareSlider";
import { CostTier, type CostState } from "./CostTier";
import { LoadingMessages } from "./LoadingMessages";
import { StyleStep } from "./StyleStep";
import { UploadStep, type RoomPhoto } from "./UploadStep";

type Action = { kind: "generate" } | { kind: "refine"; text: string };

function StepHeader({ n, title, hint }: { n: number; title: string; hint?: string | undefined }) {
  return (
    <div className="mb-6 flex items-start gap-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-charcoal font-display text-base text-charcoal-foreground">
        {n}
      </span>
      <div>
        <h2 className="text-2xl sm:text-3xl">{title}</h2>
        {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

export function Studio() {
  const [photo, setPhoto] = useState<RoomPhoto | null>(null);
  const [styleId, setStyleId] = useState<StyleId | null>(null);
  const [keep, setKeep] = useState("");
  const [refineText, setRefineText] = useState("");

  const [busy, setBusy] = useState<Action | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [resultStyle, setResultStyle] = useState<StyleId | null>(null);
  const [error, setError] = useState<{ message: string; action: Action } | null>(null);
  const [cost, setCost] = useState<CostState>({ status: "idle" });

  // The original photo used for "Before" in the latest makeover. Never altered.
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const sizeRef = useRef<string>("auto");
  const resultRef = useRef<HTMLDivElement>(null);

  const estimate = useServerFn(estimateCost);

  const runCost = useCallback(
    async (imageUrl: string, style: StyleId) => {
      setCost({ status: "loading" });
      try {
        const small = await downscaleToDataUrl(imageUrl, 768);
        const res = await estimate({ data: { style, image: small } });
        setCost(res.ok ? { status: "done", tier: res.tier, reason: res.reason } : { status: "error", message: res.error });
      } catch {
        setCost({ status: "error", message: "Couldn't estimate the cost this time." });
      }
    },
    [estimate],
  );

  const run = async (action: Action) => {
    const style = action.kind === "generate" ? styleId : resultStyle;
    if (!style || !getStyle(style)) return;
    if (action.kind === "generate" && !photo) return;
    if (action.kind === "refine" && !result) return;

    setBusy(action);
    setError(null);
    setPreview(null);
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));

    try {
      const form = new FormData();
      if (action.kind === "generate") {
        // A resized copy is uploaded; the original photo stays untouched.
        const prepared = await prepareForUpload(photo!.url);
        sizeRef.current = sizeForDimensions(prepared.width, prepared.height);
        form.append("image", prepared.file);
        setBeforeUrl(photo!.url);
      } else {
        form.append("image", await dataUrlToFile(result!, "makeover.png"));
        form.append("refine", action.text);
      }
      form.append("style", style);
      form.append("keep", keep);
      form.append("size", sizeRef.current);

      let finalImage: string | null = null;
      await streamImage("/api/makeover", form, (src, isFinal) => {
        setPreview(src);
        if (isFinal) finalImage = src;
      });
      if (!finalImage) throw new Error("No image returned");

      setResult(finalImage);
      setResultStyle(style);
      setPreview(null);
      if (action.kind === "refine") setRefineText("");
      void runCost(finalImage, style);
    } catch (err) {
      console.error(err);
      setPreview(null);
      setError({ message: friendlyImageError(err), action });
    } finally {
      setBusy(null);
    }
  };

  const canGenerate = !!photo && !!styleId && !busy;
  const chosenStyle = resultStyle ? getStyle(resultStyle) : null;
  const showResultArea = busy || result || error;

  return (
    <section id="studio" className="mx-auto max-w-6xl scroll-mt-8 px-5 pb-24 sm:px-8">
      <div className="space-y-16 sm:space-y-20">
        <div>
          <StepHeader n={1} title="Upload your room" hint="One clear photo, taken from a corner works best." />
          <div className="max-w-3xl">
            <UploadStep photo={photo} onChange={setPhoto} disabled={!!busy} />
          </div>
        </div>

        <div>
          <StepHeader n={2} title="Pick a style" />
          <StyleStep value={styleId} onChange={setStyleId} disabled={!!busy} />
        </div>

        <div>
          <StepHeader n={3} title="Anything to keep?" hint="Optional. We'll leave these exactly as they are." />
          <div className="max-w-3xl space-y-2">
            <label htmlFor="keep" className="text-sm font-semibold">
              What do you want to keep?
            </label>
            <Textarea
              id="keep"
              value={keep}
              maxLength={MAX_KEEP_LENGTH}
              disabled={!!busy}
              onChange={(e) => setKeep(e.target.value)}
              placeholder="e.g. grey sofa, wooden dining table, rug"
              className="min-h-24 rounded-2xl bg-card px-4 py-3 text-base shadow-soft"
            />
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 rounded-3xl bg-secondary p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="font-display text-2xl">Ready when you are.</p>
            <p className="text-sm text-muted-foreground">
              {!photo ? "Add a photo to begin." : !styleId ? "Now choose a style." : `Restyling in ${getStyle(styleId)?.name}.`}
            </p>
          </div>
          <Button variant="hero" size="xl" disabled={!canGenerate} onClick={() => run({ kind: "generate" })}>
            <Sparkles /> {busy?.kind === "generate" ? "Generating…" : result ? "Generate again" : "Generate makeover"}
          </Button>
        </div>

        {showResultArea && (
          <div ref={resultRef} className="scroll-mt-8">
            <StepHeader n={4} title="Your makeover" hint={chosenStyle && result ? `${chosenStyle.name} · drag the slider to compare` : undefined} />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-5">
                {result && beforeUrl && busy?.kind !== "generate" ? (
                  <CompareSlider before={beforeUrl} after={preview ?? result} afterClassName={cn("transition-[filter] duration-500", preview ? "blur-2xl" : "blur-0")}>
                    {busy && (
                      <div className="absolute inset-0 flex items-center justify-center bg-overlay p-6 backdrop-blur-sm">
                        <LoadingMessages label="Refining" />
                      </div>
                    )}
                  </CompareSlider>
                ) : busy ? (
                  <div className="relative aspect-[3/2] w-full overflow-hidden rounded-3xl bg-charcoal shadow-lift">
                    {beforeUrl && (
                      <img src={preview ?? beforeUrl} alt="" className={cn("absolute inset-0 h-full w-full object-cover transition-[filter] duration-500", preview ? "blur-xl" : "blur-md")} />
                    )}
                    <div className="absolute inset-0 overflow-hidden bg-overlay">
                      <div className="animate-shimmer absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-card/15 to-transparent" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                      <LoadingMessages label="Designing" />
                    </div>
                  </div>
                ) : null}

                {error && (
                  <div role="alert" className="flex flex-col gap-4 rounded-3xl border border-destructive/30 bg-card p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                      <div>
                        <p className="font-semibold">That didn't work</p>
                        <p className="text-sm text-muted-foreground">{error.message}</p>
                      </div>
                    </div>
                    <Button variant="charcoal" onClick={() => run(error.action)} disabled={!!busy}>
                      <RotateCcw /> Try again
                    </Button>
                  </div>
                )}

                {result && (
                  <div className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
                    <label htmlFor="refine" className="text-sm font-semibold">
                      Refine this makeover
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Textarea
                        id="refine"
                        rows={1}
                        value={refineText}
                        maxLength={MAX_REFINE_LENGTH}
                        disabled={!!busy}
                        onChange={(e) => setRefineText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey && refineText.trim() && !busy) {
                            e.preventDefault();
                            run({ kind: "refine", text: refineText.trim() });
                          }
                        }}
                        placeholder="e.g. warmer lighting, remove the plant"
                        className="min-h-12 flex-1 rounded-2xl bg-background px-4 py-3 text-base"
                      />
                      <Button
                        variant="charcoal"
                        size="lg"
                        className="h-12"
                        disabled={!refineText.trim() || !!busy}
                        onClick={() => run({ kind: "refine", text: refineText.trim() })}
                      >
                        <Wand2 /> Refine
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {(result || busy) && (
                <aside className="space-y-4">
                  <CostTier
                    state={busy && !result ? { status: "idle" } : cost}
                    onRetry={() => result && resultStyle && runCost(result, resultStyle)}
                  />
                  {result && (
                    <Button variant="hero" size="xl" className="w-full" asChild>
                      <a href={result} download={`makeover-${resultStyle ?? "room"}.png`}>
                        <Download /> Download makeover
                      </a>
                    </Button>
                  )}
                  <p className="px-1 text-xs leading-relaxed text-muted-foreground">
                    Your original photo is never changed. Refinements build on the latest makeover.
                  </p>
                </aside>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
