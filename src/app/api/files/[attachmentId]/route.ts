import { auth } from "@/lib/auth";
import { getOwnedAttachment } from "@/lib/data";
import { storage } from "@/lib/storage";

/**
 * Serves photos and receipts. Files are never public: every request checks
 * the session and that the attachment's space belongs to the user.
 * `?size=thumb` serves the small preview when one exists.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/files/[attachmentId]">) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { attachmentId } = await ctx.params;
  const attachment = await getOwnedAttachment(attachmentId, session.user.id);
  if (!attachment) return new Response("Not found", { status: 404 });

  const wantsThumb = new URL(request.url).searchParams.get("size") === "thumb";
  const key = wantsThumb && attachment.thumbKey ? attachment.thumbKey : attachment.storageKey;
  const file = await storage.get(key);
  if (!file) return new Response("Not found", { status: 404 });

  const mime = key.endsWith(".pdf") ? "application/pdf" : "image/webp";
  const download = new URL(request.url).searchParams.get("download") === "1";
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
