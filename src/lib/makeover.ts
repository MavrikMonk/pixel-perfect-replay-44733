// Shared, browser-safe makeover rules: style catalogue, prompt wording and cost-tier helpers.

export type StyleId =
  | "japandi"
  | "scandinavian"
  | "modern-minimalist"
  | "mid-century-modern"
  | "boho"
  | "industrial";

export type RoomStyle = {
  id: StyleId;
  name: string;
  description: string;
  keywords: string;
  /** Detailed brief handed to the image model. */
  brief: string;
};

export const ROOM_STYLES: RoomStyle[] = [
  {
    id: "japandi",
    name: "Japandi",
    description: "Calm Japanese restraint meets Scandi warmth. Low oak, linen, paper light.",
    keywords: "Oak · Linen · Stillness",
    brief:
      "Japandi: low-profile light oak and ash furniture, natural linen and cotton textiles, paper lantern lighting, handmade ceramics, a muted palette of warm whites, sand, clay and charcoal, uncluttered surfaces, a few sculptural branches.",
  },
  {
    id: "scandinavian",
    name: "Scandinavian",
    description: "Bright, cosy and practical. Pale woods, soft textiles and plenty of light.",
    keywords: "Birch · Wool · Daylight",
    brief:
      "Scandinavian: pale birch and beech furniture, soft white and light grey palette, cosy wool throws and sheepskin, simple pendant lights, green plants, functional clean-lined pieces, a hygge feel.",
  },
  {
    id: "modern-minimalist",
    name: "Modern Minimalist",
    description: "Only what matters. Clean lines, quiet colours and hidden storage.",
    keywords: "Clean · Quiet · Open",
    brief:
      "Modern Minimalist: clean geometric furniture, a monochrome palette of white, stone and black, flat-front surfaces, hidden storage, very few accessories, sleek integrated lighting, lots of open space.",
  },
  {
    id: "mid-century-modern",
    name: "Mid-Century Modern",
    description: "1950s optimism. Walnut, tapered legs and confident pops of colour.",
    keywords: "Walnut · Curves · Mustard",
    brief:
      "Mid-Century Modern: walnut and teak furniture with tapered legs, organic curves, accent colours of mustard, olive and burnt orange, a sputnik or globe light, graphic textiles, iconic 1950s-60s silhouettes.",
  },
  {
    id: "boho",
    name: "Boho",
    description: "Relaxed and collected. Rattan, layered rugs, plants and earthy pattern.",
    keywords: "Rattan · Pattern · Plants",
    brief:
      "Boho: rattan and cane furniture, layered patterned rugs, macramé and woven wall hangings, abundant trailing plants, terracotta, rust and ochre tones, floor cushions, a relaxed collected feel.",
  },
  {
    id: "industrial",
    name: "Industrial",
    description: "Loft attitude. Raw metal, worn leather, reclaimed wood and moody light.",
    keywords: "Steel · Leather · Brick",
    brief:
      "Industrial: black steel and iron frames, reclaimed wood, worn cognac leather, exposed Edison-bulb fixtures, concrete and charcoal tones, metal shelving, a warehouse-loft mood.",
  },
];

export function getStyle(id: string): RoomStyle | undefined {
  return ROOM_STYLES.find((style) => style.id === id);
}

const PRESERVE =
  "Preserve the room's architecture exactly: the same walls, windows, doors, ceiling, floor plan, room layout, proportions, perspective and camera angle. Do not move, add or remove any windows or doors.";

export function buildMakeoverPrompt(style: RoomStyle, keepItems: string): string {
  const keep = keepItems.trim();
  return [
    `Restyle this room photo as a ${style.name} interior. Style direction: ${style.brief}`,
    keep
      ? `Keep these items exactly as they are, unchanged in shape, colour, material and position: ${keep}.`
      : "Replace furniture and decor as needed to achieve the style.",
    PRESERVE,
    "Result must look like a real, photorealistic interior photograph of the same room, with natural, believable lighting.",
  ].join("\n\n");
}

export function buildRefinePrompt(style: RoomStyle, keepItems: string, refinement: string): string {
  const keep = keepItems.trim();
  return [
    `Make this change to the ${style.name} room in the photo: ${refinement.trim()}.`,
    "Change only what is needed for that request and keep everything else in the image the same.",
    keep ? `Keep these items unchanged: ${keep}.` : "",
    PRESERVE,
    "Keep it photorealistic.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export const MAX_KEEP_LENGTH = 300;
export const MAX_REFINE_LENGTH = 300;

/** Allowed output sizes, chosen from the uploaded photo's orientation. */
export const OUTPUT_SIZES = ["1536x1024", "1024x1536", "1024x1024"] as const;
export type OutputSize = (typeof OUTPUT_SIZES)[number];

export function sizeForDimensions(width: number, height: number): OutputSize {
  const ratio = width / height;
  if (ratio > 1.15) return "1536x1024";
  if (ratio < 0.87) return "1024x1536";
  return "1024x1024";
}

/** Clamp any model-produced tier into the 1–5 range ($ to $$$$$). */
export function normalizeCostTier(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 3;
  return Math.min(5, Math.max(1, Math.round(n)));
}

export function costTierLabel(tier: number): string {
  return "$".repeat(normalizeCostTier(tier));
}

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
