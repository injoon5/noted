import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth-server";

// This route proxies Convex storage upload URL generation.
// The actual upload goes directly to Convex storage.
export async function POST(request: NextRequest) {
  // Satisfy the unused variable lint rule while keeping the parameter typed
  void request;

  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Client should call Convex mutation directly for file uploads.
  // This route is a placeholder for future R2 integration.
  return NextResponse.json({ message: "Use Convex storage directly" });
}
