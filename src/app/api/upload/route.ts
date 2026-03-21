// File uploads are handled directly via the @convex-dev/r2 component.
// Clients use the useUploadFile hook (from @convex-dev/r2/react) which calls
// convex/r2.ts:generateUploadUrl and convex/r2.ts:syncMetadata automatically.
// This route is no longer needed but kept as a placeholder.
export async function POST() {
  return new Response(
    JSON.stringify({ message: "Use the R2 useUploadFile hook instead" }),
    { status: 410, headers: { "Content-Type": "application/json" } }
  );
}
