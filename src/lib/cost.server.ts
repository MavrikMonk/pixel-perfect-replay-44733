// Server-only: asks a vision model for a relative cost tier for the makeover.
import { createOpenAI } from "@ai-sdk/openai";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayRunIdFetch } from "./ai-run-id.server";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

const costSchema = z.object({
  tier: z.number().describe("Integer 1 to 5: 1 = budget ($), 5 = luxury ($$$$$)"),
  reason: z.string().describe("One short sentence, max 20 words"),
});

export async function estimateCostWithAi(apiKey: string, styleName: string, imageDataUrl: string) {
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const result = streamText({
    model: provider.responses(MODEL),
    instructions:
      "You are an interior design cost estimator. Given a room makeover image and its style, estimate the relative cost to recreate the look with new furniture and decor (not construction). Use tier 1 for budget/flat-pack, 3 for mid-range high-street, 5 for designer/luxury pieces. Reply with a tier and one plain sentence (max 20 words) naming the key items that drive the cost.",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: `Style: ${styleName}. Estimate the relative cost of this makeover.` },
          { type: "image", image: new URL(imageDataUrl) },
        ],
      },
    ],
    output: Output.object({ schema: costSchema }),
    maxRetries: 0,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  try {
    return await result.output;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error) && error.text) {
      const parsed = costSchema.safeParse(JSON.parse(error.text));
      if (parsed.success) return parsed.data;
    }
    throw error;
  }
}
