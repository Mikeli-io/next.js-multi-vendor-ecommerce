/** Strip a display name down to a safe, URL-usable slug: "New Balance" → "new-balance". */
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
 * collision. `isTaken` is supplied by the caller so each table checks its own
 * rows (and an update can exclude the row being renamed).
 *
 * The table's unique index remains the real guarantee: two simultaneous writes
 * can both pass this check, and the loser gets a P2002 the caller must handle.
 */
export async function generateUniqueSlug(
  source: string,
  isTaken: (candidate: string) => Promise<boolean>,
  fallback = "item",
): Promise<string> {
  const base = slugify(source) || fallback;

  for (let attempt = 0; attempt < 25; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    if (!(await isTaken(candidate))) return candidate;
  }

  // Fall back to something collision-resistant rather than failing the write.
  return `${base}-${Date.now().toString(36)}`;
}
