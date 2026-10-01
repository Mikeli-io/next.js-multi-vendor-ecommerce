/** The result shape every admin form Server Action returns. */
export type FormActionResult =
  | { ok: true; message: string }
  | { ok: false; formError?: string; fieldErrors?: Record<string, string[]> };
