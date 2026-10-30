// Browser-only helpers. They always produce NEW files/URLs and never alter the user's original photo.

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't read that image."));
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't prepare image."))), type, quality);
  });
}

function drawScaled(img: HTMLImageElement, maxEdge: number) {
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.round(img.naturalWidth * scale);
  const height = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't prepare image.");
  ctx.drawImage(img, 0, 0, width, height);
  return { canvas, width, height };
}

/** Make a resized JPEG copy suitable for upload. The source is only read. */
export async function prepareForUpload(srcUrl: string, maxEdge = 2048) {
  const img = await loadImage(srcUrl);
  const { canvas } = drawScaled(img, maxEdge);
  const blob = await canvasToBlob(canvas, "image/jpeg", 0.92);
  return {
    file: new File([blob], "room.jpg", { type: "image/jpeg" }),
    width: img.naturalWidth,
    height: img.naturalHeight,
  };
}

export async function dataUrlToFile(dataUrl: string, name: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], name, { type: blob.type || "image/png" });
}

export async function downscaleToDataUrl(srcUrl: string, maxEdge = 768): Promise<string> {
  const img = await loadImage(srcUrl);
  const { canvas } = drawScaled(img, maxEdge);
  return canvas.toDataURL("image/jpeg", 0.85);
}
