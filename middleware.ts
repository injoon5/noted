import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "@convex-dev/better-auth/utils";

const CONVEX_SITE_URL = process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? "";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require auth
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/share") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  // Check Better Auth session token via Convex site URL
  const mutableHeaders = new Headers(request.headers);
  mutableHeaders.delete("content-length");
  mutableHeaders.delete("transfer-encoding");
  mutableHeaders.set("accept-encoding", "identity");

  try {
    const { token } = await getToken(CONVEX_SITE_URL, mutableHeaders);
    if (!token) {
      return NextResponse.redirect(new URL("/auth", request.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/auth", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
