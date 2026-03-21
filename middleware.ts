import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const jwtSecretValue = process.env.JWT_SECRET ?? (
  process.env.NODE_ENV === "production"
    ? (() => { throw new Error("JWT_SECRET environment variable is required in production") })()
    : "dev-secret-change-in-prod"
)
const JWT_SECRET = new TextEncoder().encode(jwtSecretValue)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths that don't require auth
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/share") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get("noted-session")?.value

  if (!token) {
    return NextResponse.redirect(new URL("/auth", request.url))
  }

  try {
    await jwtVerify(token, JWT_SECRET)
    return NextResponse.next()
  } catch {
    const response = NextResponse.redirect(new URL("/auth", request.url))
    response.cookies.delete("noted-session")
    return response
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
