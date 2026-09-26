import type { ZodError } from "zod";

/**
 * Flatten Zod issues into `{ inputName: [messages] }`, keyed by the first path
 * segment so the keys line up with the form's `name` attributes.
 */
export function toFieldErrors(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}
