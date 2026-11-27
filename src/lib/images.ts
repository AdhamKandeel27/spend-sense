import "server-only";
import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/heic",
  "image/heif",
]);

export type ProcessedFile = {
  main: { body: Buffer; ext: "webp" | "pdf"; mimeType: string };
  thumb: { body: Buffer; ext: "webp" } | null;
  width: number | null;
  height: number | null;
};

export class UploadError extends Error {}

/**
 * Normalises an upload for storage:
 * - images are auto-rotated from EXIF, stripped of metadata (GPS!), resized
 *   and re-encoded as WebP, with a small square-friendly thumbnail;
 * - PDFs (invoices) are stored as-is.
 */
export async function processUpload(
  file: File,
  kind: "photo" | "receipt",
): Promise<ProcessedFile> {
  if (file.size === 0) throw new UploadError("The file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("Files must be 20 MB or smaller.");

  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.type === "application/pdf") {
    if (kind !== "receipt") throw new UploadError("Photos must be images. PDFs can be added as receipts.");
    if (buffer.subarray(0, 5).toString() !== "%PDF-") throw new UploadError("That PDF looks damaged.");
    return { main: { body: buffer, ext: "pdf", mimeType: "application/pdf" }, thumb: null, width: null, height: null };
  }

  if (file.type && !IMAGE_TYPES.has(file.type)) {
    throw new UploadError("Use a JPG, PNG, WebP or HEIC image, or a PDF for receipts.");
  }

  // Receipts keep more pixels so small print stays legible.
  const maxEdge = kind === "receipt" ? 2400 : 1800;

  try {
    const base = sharp(buffer, { failOn: "error" }).rotate();
    const main = await base
      .clone()
      .resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true })
      .webp({ quality: kind === "receipt" ? 85 : 80 })
      .toBuffer({ resolveWithObject: true });
    const thumb = await base
      .clone()
      .resize({ width: 480, height: 480, fit: "cover", position: "attention" })
      .webp({ quality: 72 })
      .toBuffer();

    return {
      main: { body: main.data, ext: "webp", mimeType: "image/webp" },
      thumb: { body: thumb, ext: "webp" },
      width: main.info.width,
      height: main.info.height,
    };
  } catch {
    throw new UploadError(
      "This image couldn't be read. If it's an iPhone HEIC photo, share it as JPG (Most Compatible) and try again.",
    );
  }
}
