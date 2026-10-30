import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getStyle, normalizeCostTier } from "./makeover";

const inputSchema = z.object({
  style: z.string().min(1).max(40),
  image: z
    .string()
    .startsWith("data:image/")
    .max(4_000_000),
});

export type CostEstimate =
  | { ok: true; tier: number; reason: string }
  | { ok: false; error: string };

export const estimateCost = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<CostEstimate> => {
    const style = getStyle(data.style);
    if (!style) return { ok: false, error: "Unknown style." };
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false, error: "The AI service isn't configured yet." };

    const { estimateCostWithAi } = await import("./cost.server");
    try {
      const result = await estimateCostWithAi(apiKey, style.name, data.image);
      return { ok: true, tier: normalizeCostTier(result.tier), reason: result.reason.trim() };
    } catch (error) {
      console.error("cost estimate failed", error);
      const status =
        error && typeof error === "object" && "statusCode" in error
          ? Number((error as { statusCode?: number }).statusCode)
          : undefined;
      if (status === 402) return { ok: false, error: "AI credits have run out." };
      if (status === 429) return { ok: false, error: "Busy right now, try again shortly." };
      return { ok: false, error: "Couldn't estimate the cost this time." };
    }
  });
