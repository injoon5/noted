import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const jwtSecretValue = process.env.JWT_SECRET ?? (
  process.env.NODE_ENV === "production"
    ? (() => { throw new Error("JWT_SECRET environment variable is required in production") })()
    : "dev-secret-change-in-prod"
)
const JWT_SECRET = new TextEncoder().encode(jwtSecretValue)

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(JWT_SECRET)

  const cookieStore = await cookies()
  cookieStore.set("noted-session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  })

  return token
}

export async function getSession(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("noted-session")?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { userId: string }
  } catch {
    return null
  }
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete("noted-session")
}
