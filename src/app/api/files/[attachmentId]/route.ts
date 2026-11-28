import { auth } from "@/lib/auth";
import { getOwnedAttachment } from "@/lib/data";
import { serveAttachment } from "@/lib/serve-file";

/**
 * Serves photos and receipts. Files are never public: every request checks
 * the session and that the attachment's space belongs to the user.
 * (Viewers with a share link use /api/share/[token]/files instead.)
 */
export async function GET(request: Request, ctx: RouteContext<"/api/files/[attachmentId]">) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { attachmentId } = await ctx.params;
  const attachment = await getOwnedAttachment(attachmentId, session.user.id);
  if (!attachment) return new Response("Not found", { status: 404 });

  return serveAttachment(request, attachment);
}
