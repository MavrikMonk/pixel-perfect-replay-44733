import { describe, expect, it } from "vitest";

import {
  ROOM_STYLES,
  buildMakeoverPrompt,
  buildRefinePrompt,
  costTierLabel,
  getStyle,
  normalizeCostTier,
  sizeForDimensions,
} from "@/lib/makeover";

describe("makeover rules", () => {
  it("offers exactly the six requested styles", () => {
    expect(ROOM_STYLES.map((s) => s.name)).toEqual([
      "Japandi",
      "Scandinavian",
      "Modern Minimalist",
      "Mid-Century Modern",
      "Boho",
      "Industrial",
    ]);
  });

  it("tells the model to keep the listed items unchanged", () => {
    const prompt = buildMakeoverPrompt(getStyle("boho")!, "grey sofa, rug");
    expect(prompt).toContain("Keep these items exactly as they are");
    expect(prompt).toContain("grey sofa, rug");
  });

  it("tells the model to preserve walls, windows, doors, layout and camera angle", () => {
    for (const prompt of [
      buildMakeoverPrompt(getStyle("japandi")!, ""),
      buildRefinePrompt(getStyle("japandi")!, "", "warmer lighting"),
    ]) {
      for (const word of ["walls", "windows", "doors", "room layout", "camera angle"]) {
        expect(prompt).toContain(word);
      }
    }
  });

  it("refine prompt carries the user's requested change", () => {
    expect(buildRefinePrompt(getStyle("industrial")!, "", "remove the plant")).toContain("remove the plant");
  });

  it("clamps cost tiers to $ through $$$$$", () => {
    expect(normalizeCostTier(0)).toBe(1);
    expect(normalizeCostTier(9)).toBe(5);
    expect(normalizeCostTier(3.4)).toBe(3);
    expect(costTierLabel(5)).toBe("$$$$$");
    expect(costTierLabel(1)).toBe("$");
  });

  it("picks the output shape from the photo orientation", () => {
    expect(sizeForDimensions(4032, 3024)).toBe("1536x1024");
    expect(sizeForDimensions(3024, 4032)).toBe("1024x1536");
    expect(sizeForDimensions(1000, 1000)).toBe("1024x1024");
  });
});
