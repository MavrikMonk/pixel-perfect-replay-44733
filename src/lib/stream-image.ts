import { createParser } from "eventsource-parser";
import { flushSync } from "react-dom";

type ImagePayload = { type?: string; b64_json?: string; error?: { message?: string } };

export class ImageRequestError extends Error {
  status: number | undefined;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

async function readError(res: Response): Promise<ImageRequestError> {
  const text = await res.text().catch(() => "");
  let message: string | undefined;
  try {
    const json = JSON.parse(text) as { error?: { message?: string } | string; message?: string };
    message = typeof json.error === "string" ? json.error : (json.error?.message ?? json.message);
  } catch {
    message = undefined;
  }
  return new ImageRequestError(message || `Request failed (${res.status})`, res.status);
}

export async function streamImage(
  endpoint: string,
  input: FormData,
  onFrame: (dataUrl: string, isFinal: boolean) => void,
  signal?: AbortSignal,
): Promise<void> {
  const send = (stream: boolean) => {
    signal?.throwIfAborted();
    const form = new FormData();
    input.forEach((value, name) => form.append(name, value));
    form.set("stream", String(stream));
    if (!stream) form.delete("partial_images");
    return fetch(endpoint, { method: "POST", body: form, signal: signal ?? null });
  };
  const res = await send(true);
  if (!res.ok || !res.body) throw await readError(res);

  let sawCompleted = false;
  let sawAnyEvent = false;
  let streamError: string | undefined;
  const parser = createParser({
    onEvent(event) {
      let payload: ImagePayload | undefined;
      try {
        payload = JSON.parse(event.data) as ImagePayload;
      } catch {
        payload = undefined;
      }
      if (event.event === "error" || payload?.type === "error") {
        sawAnyEvent = true;
        streamError = payload?.error?.message ?? "Image generation failed";
        return;
      }
      const type = event.event || payload?.type;
      if (
        type !== "image_generation.partial_image" &&
        type !== "image_generation.completed" &&
        type !== "image_edit.partial_image" &&
        type !== "image_edit.completed"
      )
        return;
      sawAnyEvent = true;
      if (!payload?.b64_json) {
        streamError = "Image event contained no image";
        return;
      }
      const b64 = payload.b64_json;
      const isFinal = type === "image_generation.completed" || type === "image_edit.completed";
      // React batches callbacks from coalesced SSE events unless each frame is committed here.
      flushSync(() => onFrame(`data:image/png;base64,${b64}`, isFinal));
      if (isFinal) sawCompleted = true;
    },
  });
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  try {
    while (true) {
      let chunk: ReadableStreamReadResult<string>;
      try {
        chunk = await reader.read();
      } catch (error) {
        if (signal?.aborted || sawAnyEvent || (error instanceof Error && error.name === "AbortError"))
          throw error;
        break;
      }
      if (chunk.done) break;
      parser.feed(chunk.value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  signal?.throwIfAborted();
  if (streamError) throw new ImageRequestError(streamError);
  if (!sawAnyEvent) {
    const replay = await send(false);
    if (!replay.ok) throw await readError(replay);
    const json = (await replay.json()) as { data?: { b64_json?: string }[] };
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new ImageRequestError("The AI didn't return an image.");
    onFrame(`data:image/png;base64,${b64}`, true);
    return;
  }
  if (!sawCompleted) throw new ImageRequestError("The makeover stopped before it finished.");
}

export function friendlyImageError(error: unknown): string {
  if (error instanceof ImageRequestError) {
    if (error.status === 402)
      return "The AI credits for this site have run out. Please try again later.";
    if (error.status === 429) return "Lots of makeovers happening right now. Wait a moment and try again.";
    if (error.status === 403) return error.message || "This request isn't allowed right now.";
    if (error.status && error.status >= 500)
      return "The AI service had a hiccup. Please try again.";
    if (/content_policy|moderation|safety/i.test(error.message))
      return "The AI declined this photo or request. Try a different photo or wording.";
    return error.message;
  }
  if (error instanceof TypeError) return "Connection lost. Check your internet and try again.";
  return "Something went wrong creating your makeover. Please try again.";
}
