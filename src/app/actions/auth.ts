"use server"

import { createSession, clearSession } from "@/lib/session"
import { redirect } from "next/navigation"

export async function loginAction(userId: string) {
  await createSession(userId)
  redirect("/")
}

export async function logoutAction() {
  await clearSession()
  redirect("/auth")
}
