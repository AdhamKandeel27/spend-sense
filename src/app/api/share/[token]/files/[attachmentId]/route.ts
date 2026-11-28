import { getSharedPhoto } from "@/lib/data";
import { serveAttachment } from "@/lib/serve-file";

/**
 * Photos for someone holding a view-only share link. Only photos of
 * purchases in that link's space are served; receipts never are.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/share/[token]/files/[attachmentId]">) {
  const { token, attachmentId } = await ctx.params;
  const attachment = await getSharedPhoto(token, attachmentId);
  if (!attachment) return new Response("Not found", { status: 404 });
  return serveAttachment(request, attachment);
}
