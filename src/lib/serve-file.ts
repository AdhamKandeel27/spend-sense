import "server-only";
import type { Attachment } from "@/db/schema";
import { storage } from "@/lib/storage";

/**
 * Streams an attachment the caller has already authorised.
 * `?size=thumb` serves the small preview when one exists; `?download=1` saves it.
 */
export async function serveAttachment(request: Request, attachment: Attachment) {
  const params = new URL(request.url).searchParams;
  const wantsThumb = params.get("size") === "thumb";
  const key = wantsThumb && attachment.thumbKey ? attachment.thumbKey : attachment.storageKey;
  const file = await storage.get(key);
  if (!file) return new Response("Not found", { status: 404 });

  const mime = key.endsWith(".pdf") ? "application/pdf" : "image/webp";
  const download = params.get("download") === "1";
  const filename = (attachment.originalName ?? `${attachment.kind}.${key.split(".").pop()}`).replace(/["\\\r\n]/g, "");

  return new Response(file.body, {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(file.size),
      // Keys are immutable (a replaced file gets a new id), so cache hard — but only in this browser.
      "Cache-Control": "private, max-age=31536000, immutable",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
