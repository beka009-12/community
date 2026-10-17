import "server-only";
import { revalidatePath, updateTag } from "next/cache";
import { PUBLIC_TAGS } from "@/src/server/api/client";

// Admin views render per request; the public site reads the tagged cache.
// Updating all three tags is cheap and never misses a dependent page.
export function refreshAfterAdminChange(): void {
  for (const tag of PUBLIC_TAGS) updateTag(tag);
  revalidatePath("/admin", "layout");
}
