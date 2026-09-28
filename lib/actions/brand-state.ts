import type { BrandStatusValue } from "@/lib/validation/brand";

/** What every brand Server Action returns to the client. */
export type BrandActionResult =
  | { ok: true; message: string; status?: BrandStatusValue }
  | {
      ok: false;
      /** Message for the whole form / action. */
      formError?: string;
      /** Per-field messages, keyed by input name. */
      fieldErrors?: Record<string, string[]>;
    };
