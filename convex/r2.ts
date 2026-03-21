import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";

export const r2 = new R2(components.r2);

// Exports generateUploadUrl and syncMetadata for use with useUploadFile hook
export const { generateUploadUrl, syncMetadata } = r2.clientApi<DataModel>({
  checkUpload: async (_ctx, _bucket) => {
    // Auth check could go here; middleware already guards all routes
  },
});
