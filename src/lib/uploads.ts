/** Upload rules shared by the purchase form (browser) and the server. */

export const MAX_FILES = 10;

/** Matches the Supabase bucket's file size limit (9 MB). */
export const MAX_UPLOAD_BYTES = 9 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/avif": "avif",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

const TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  avif: "image/avif",
  gif: "image/gif",
  pdf: "application/pdf",
};

/** The file's media type if we accept it. Falls back to the extension (Windows often reports HEIC as ""). */
export function uploadType(file: { type: string; name: string }): string | null {
  if (file.type in EXT_BY_TYPE) return file.type;
  if (file.type) return null;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return TYPE_BY_EXT[ext] ?? null;
}

export function extForType(type: string): string | null {
  return EXT_BY_TYPE[type] ?? null;
}

export type UploadKind = "photo" | "receipt";

/** What the form asks the server for before uploading. */
export type UploadRequest = { kind: UploadKind; type: string; size: number };

/** What the form submits after uploading, one per file. */
export type UploadedFile = { kind: UploadKind; key: string; name: string; type: string };

export const UPLOAD_TYPE_ERROR = "Use a JPG, PNG, WebP or HEIC image, or a PDF for receipts.";
export const UPLOAD_SIZE_ERROR = "Files must be 9 MB or smaller.";
