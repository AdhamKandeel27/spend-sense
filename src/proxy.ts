import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Optimistic routing only: sends visitors without a session cookie to
 * sign-in. Real authorization happens in the data layer (requireUser).
 *
 * It never sends anyone *away* from the sign-in pages: a cookie can be
 * stale (expired, or from another database), and bouncing on it would loop
 * with requireUser's redirect to /sign-in. The auth layout checks the real
 * session and redirects signed-in users instead.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(getSessionCookie(request));
  const isAuthPage = pathname === "/sign-in" || pathname === "/sign-up";

  if (pathname === "/") {
    return NextResponse.redirect(new URL(hasSession ? "/spaces" : "/sign-in", request.url));
  }
  if (!hasSession && !isAuthPage) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Everything except API routes, Next internals and static files.
  matcher: ["/((?!api|_next|favicon.ico|manifest.webmanifest|icons|sw.js|.*\\.(?:png|svg|ico|webp|txt)$).*)"],
};
