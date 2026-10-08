import * as z from "zod";

import { optionalPhoneSchema, phoneSchema } from "./phone";

/**
 * Note what is absent: none of these schemas accept a `role`. Role is decided
 * by the server action that runs, never by anything the browser sends.
 */

/** Lowercase and trim so `Ada@Example.com ` and `ada@example.com` are one account. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Shared with Add New Vendor (lib/validation/vendor.ts). */
export const email = z
  .email({ error: "Enter a valid email address." })
  .max(191, { error: "Email is too long." })
  .transform(normalizeEmail);

const name = z
  .string()
  .trim()
  .min(2, { error: "Name must be at least 2 characters." })
  .max(80, { error: "Name must be 80 characters or fewer." });

export const newPassword = z
  .string()
  .min(8, { error: "Password must be at least 8 characters." })
  .max(72, { error: "Password must be 72 characters or fewer." })
  .regex(/[a-zA-Z]/, { error: "Password must contain a letter." })
  .regex(/[0-9]/, { error: "Password must contain a number." });

export const storeName = z
  .string()
  .trim()
  .min(2, { error: "Store name must be at least 2 characters." })
  .max(60, { error: "Store name must be 60 characters or fewer." })
  .regex(/[a-z0-9]/i, {
    error: "Store name must contain at least one letter or number.",
  });

export const loginSchema = z.object({
  email,
  // Never constrained on login: rules apply to the password being set, and
  // echoing them here would describe the stored password to an attacker.
  password: z.string().min(1, { error: "Enter your password." }),
});

// Mirrors `designs/.../register.dc.html`: name, email, password and the terms
// checkbox. The design has no confirm-password field on the customer form.
export const customerRegisterSchema = z.object({
  name,
  email,
  password: newPassword,
  acceptTerms: z.literal(true, {
    error: "Please accept the Terms and Privacy Policy to continue.",
  }),
});

// Mirrors `designs/.../VendorRegister.dc.html`: a required phone, and password
// paired with a confirm-password field.
export const vendorRegisterSchema = z
  .object({
    name,
    email,
    phone: phoneSchema,
    storeName,
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type CustomerRegisterInput = z.infer<typeof customerRegisterSchema>;
export type VendorRegisterInput = z.infer<typeof vendorRegisterSchema>;

// Customer profile ---------------------------------------------------------

/**
 * The profile form edits the display name, split into first and last as in
 * the design, and the optional phone number (blank clears it). Email is the
 * sign-in identity and is not editable here.
 */
export const profileSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, { error: "Enter your first name." })
      .max(40, { error: "First name must be 40 characters or fewer." }),
    lastName: z
      .string()
      .trim()
      .max(40, { error: "Last name must be 40 characters or fewer." }),
    phone: optionalPhoneSchema,
  })
  .transform(({ firstName, lastName, phone }) => ({
    name: [firstName, lastName].filter(Boolean).join(" "),
    phone,
  }))
  // Same floor as registration, so an edit can never produce a name signup rejects.
  .refine(({ name }) => name.length >= 2, {
    error: "Name must be at least 2 characters.",
    path: ["firstName"],
  });

// Change password ------------------------------------------------------------

/**
 * Changing a password while signed in. The current password is required even
 * though the session already proves who the user is: it stops anyone holding
 * an unlocked session (a shared computer, a stolen cookie) from taking over
 * the account. The new password obeys the same rules as registration.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { error: "Enter your current password." }),
    newPassword,
    confirmPassword: z.string().min(1, { error: "Confirm your new password." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    error: "Choose a password different from your current one.",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
