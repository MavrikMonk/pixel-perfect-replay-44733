import { useRef, useState } from "react";
import { ImagePlus, Upload, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { ACCEPTED_TYPES } from "@/lib/makeover";
import sampleLiving from "@/assets/sample-living.jpg";
import sampleBedroom from "@/assets/sample-bedroom.jpg";
import sampleDining from "@/assets/sample-dining.jpg";

export type RoomPhoto = { url: string; name: string; sampleId?: string };

export const SAMPLES = [
  { id: "living", label: "Living room", src: sampleLiving },
  { id: "bedroom", label: "Bedroom", src: sampleBedroom },
  { id: "dining", label: "Dining nook", src: sampleDining },
];

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

type Props = {
  photo: RoomPhoto | null;
  onChange: (photo: RoomPhoto | null) => void;
  disabled?: boolean;
};

export function UploadStep({ photo, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please choose a JPG, PNG or WEBP photo.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("That photo is over 25 MB. Please choose a smaller one.");
      return;
    }
    setError(null);
    onChange({ url: URL.createObjectURL(file), name: file.name });
  };

  return (
    <div className="space-y-5">
      {photo ? (
        <div className="relative overflow-hidden rounded-3xl bg-muted shadow-soft">
          <img src={photo.url} alt="Your room" className="aspect-[3/2] w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-overlay to-transparent p-4">
            <span className="truncate text-sm font-medium text-overlay-foreground">{photo.name}</span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(null)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-soft transition hover:bg-secondary disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" /> Change photo
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            accept(e.dataTransfer.files[0]);
          }}
          className={cn(
            "flex aspect-[3/2] w-full flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed bg-card px-6 text-center transition",
            dragging ? "border-primary bg-clay-soft/40" : "border-input hover:border-primary/60 hover:bg-muted",
          )}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-foreground">
            <Upload className="h-6 w-6" />
          </span>
          <span className="font-display text-2xl">Drop a photo of your room</span>
          <span className="text-sm text-muted-foreground">
            or <span className="font-semibold text-primary underline underline-offset-4">browse files</span> · JPG, PNG or WEBP
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          accept(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <div>
        <p className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
          <ImagePlus className="h-4 w-4" /> No photo handy? Try a sample room:
        </p>
        <div className="grid grid-cols-3 gap-3">
          {SAMPLES.map((sample) => {
            const active = photo?.sampleId === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setError(null);
                  onChange({ url: sample.src, name: `Sample · ${sample.label}`, sampleId: sample.id });
                }}
                className={cn(
                  "group overflow-hidden rounded-2xl border-2 bg-card text-left transition disabled:opacity-50",
                  active ? "border-primary shadow-soft" : "border-transparent hover:border-border",
                )}
              >
                <img
                  src={sample.src}
                  alt={sample.label}
                  width={1536}
                  height={1024}
                  loading="lazy"
                  className="aspect-[3/2] w-full object-cover transition group-hover:scale-[1.03]"
                />
                <span className="block px-2.5 py-2 text-xs font-medium sm:text-sm">{sample.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
