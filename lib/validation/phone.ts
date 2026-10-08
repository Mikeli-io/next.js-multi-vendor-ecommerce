import * as z from "zod";

/**
 * Phone rules shared by every form that collects a person's number (vendor
 * registration, customer profile, and later Add New Vendor). Numbers are
 * stored on `User.phone` in E.164 form: a `+`, the country code, then the
 * subscriber number — at most 15 digits in all.
 *
 * The designs show a fixed "+1" prefix chip. That would hard-code one country
 * on a marketplace that isn't limited to one, so the input instead takes the
 * full international number and the country code is part of what is typed.
 */

const E164 = /^\+[1-9]\d{7,14}$/;

/** Strip formatting so "+1 (555) 010-2030" and "+1.555.010.2030" are one number. */
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s().-]/g, "");
}

export const PHONE_PLACEHOLDER = "Ex: +1 555 010 2030";

/** A required phone number, normalized to E.164. */
export const phoneSchema = z
  .string({ error: "Enter a phone number." })
  .trim()
  .min(1, { error: "Enter a phone number." })
  .max(30, { error: "Phone number is too long." })
  .transform(normalizePhone)
  .refine((value) => E164.test(value), {
    error: "Enter the full number with its country code, e.g. +1 555 010 2030.",
  });

/** An optional phone number: blank means "none" and becomes `null`. */
export const optionalPhoneSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  phoneSchema.nullable(),
);
