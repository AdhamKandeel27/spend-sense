import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Optimistic routing only: sends visitors without a session cookie to
 * sign-in. Real authorization happens in the data layer (requireUser).
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
  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL("/spaces", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Everything except API routes, Next internals and static files.
  matcher: ["/((?!api|_next|favicon.ico|manifest.webmanifest|icons|sw.js|.*\\.(?:png|svg|ico|webp|txt)$).*)"],
};
