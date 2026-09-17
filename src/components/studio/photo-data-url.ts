/**
 * Client-side photo downscaling — shared by the create modals and the inline
 * edit panels. Decodes the picked file with createImageBitmap, draws to a
 * ≤ 1024 px canvas, encodes JPEG q0.8, and rejects results above the encoded
 * cap; the server re-validates via MAX_PHOTO_DATA_URL_LENGTH.
 */
export const MAX_PHOTO_BYTES = 300 * 1024; // 300 KB per encoded photo

export async function fileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
  if (dataUrl.length > MAX_PHOTO_BYTES) {
    throw new Error(
      `"${file.name}" is too large after compression — try a smaller image.`,
    );
  }
  return dataUrl;
}
