import { createFileRoute } from "@tanstack/react-router";

import { editImage, imageSettings } from "@/lib/image-gateway.server";
import {
  ACCEPTED_TYPES,
  MAX_KEEP_LENGTH,
  MAX_REFINE_LENGTH,
  OUTPUT_SIZES,
  buildMakeoverPrompt,
  buildRefinePrompt,
  getStyle,
} from "@/lib/makeover";

const MAX_BYTES = 15 * 1024 * 1024;

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/makeover")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return jsonError(500, "The AI service isn't configured yet.");

        let incoming: FormData;
        try {
          incoming = await request.formData();
        } catch {
          return jsonError(400, "We couldn't read that upload. Please try again.");
        }

        const image = incoming.get("image");
        const style = getStyle(String(incoming.get("style") ?? ""));
        const keep = String(incoming.get("keep") ?? "").slice(0, MAX_KEEP_LENGTH);
        const refine = String(incoming.get("refine") ?? "").slice(0, MAX_REFINE_LENGTH);
        const sizeValue = String(incoming.get("size") ?? "");
        const size = (OUTPUT_SIZES as readonly string[]).includes(sizeValue) ? sizeValue : "auto";
        const stream = incoming.get("stream") === "false" ? "false" : "true";

        if (!(image instanceof File) || image.size === 0) {
          return jsonError(400, "Please add a room photo first.");
        }
        if (!ACCEPTED_TYPES.includes(image.type)) {
          return jsonError(400, "Please use a JPG, PNG or WEBP photo.");
        }
        if (image.size > MAX_BYTES) return jsonError(400, "That photo is too large (max 15 MB).");
        if (!style) return jsonError(400, "Please pick a style.");

        const prompt = refine.trim()
          ? buildRefinePrompt(style, keep, refine)
          : buildMakeoverPrompt(style, keep);

        const form = new FormData();
        form.append("image", image, image.name || "room.jpg");
        form.append("prompt", prompt);
        form.append("size", size);
        form.append("quality", "medium");
        form.append("stream", stream);

        const upstream = await editImage({ ...imageSettings, apiKey }, form);
        return new Response(upstream.body, {
          status: upstream.status,
          headers: {
            "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});
