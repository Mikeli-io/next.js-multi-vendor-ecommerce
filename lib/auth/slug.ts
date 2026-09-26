import { prisma } from "@/lib/prisma";

/** Strip a store name down to a safe, URL-usable slug. */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    // Drop combining marks so "Café" becomes "cafe" rather than "caf".
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
}

/**
 * A slug that is free at the time of checking, suffixing `-2`, `-3`, ... on
 * collision. The unique index on `Vendor.slug` remains the real guarantee:
 * two simultaneous registrations can both pass this check, and the loser gets
 * a P2002 that the caller retries.
 */
export async function generateUniqueSlug(storeName: string): Promise<string> {
  const base = slugify(storeName) || "store";

  for (let attempt = 0; attempt < 25; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const taken = await prisma.vendor.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }

  // Fall back to something collision-resistant rather than failing the signup.
  return `${base}-${Date.now().toString(36)}`;
}
