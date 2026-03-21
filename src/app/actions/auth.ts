"use server";

import { redirect } from "next/navigation";

export async function logoutAction() {
  // Better Auth handles sign-out via the client-side authClient.signOut()
  // This server action just redirects after client-side sign-out
  redirect("/auth");
}
