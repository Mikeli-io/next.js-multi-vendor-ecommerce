import * as z from "zod";

/**
 * Note what is absent: none of these schemas accept a `role`. Role is decided
 * by the server action that runs, never by anything the browser sends.
 */

/** Lowercase and trim so `Ada@Example.com ` and `ada@example.com` are one account. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const email = z
  .email({ error: "Enter a valid email address." })
  .max(191, { error: "Email is too long." })
  .transform(normalizeEmail);

const name = z
  .string()
  .trim()
  .min(2, { error: "Name must be at least 2 characters." })
  .max(80, { error: "Name must be 80 characters or fewer." });

const newPassword = z
  .string()
  .min(8, { error: "Password must be at least 8 characters." })
  .max(72, { error: "Password must be 72 characters or fewer." })
  .regex(/[a-zA-Z]/, { error: "Password must contain a letter." })
  .regex(/[0-9]/, { error: "Password must contain a number." });

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

// Mirrors `designs/.../VendorRegister.dc.html`, which pairs password with a
// confirm-password field.
export const vendorRegisterSchema = z
  .object({
    name,
    email,
    storeName: z
      .string()
      .trim()
      .min(2, { error: "Store name must be at least 2 characters." })
      .max(60, { error: "Store name must be 60 characters or fewer." })
      .regex(/[a-z0-9]/i, {
        error: "Store name must contain at least one letter or number.",
      }),
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
 * The profile form edits the display name only, split into first and last as
 * in the design. Email is the sign-in identity and is not editable here.
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
  })
  .transform(({ firstName, lastName }) => ({
    name: [firstName, lastName].filter(Boolean).join(" "),
  }))
  // Same floor as registration, so an edit can never produce a name signup rejects.
  .refine(({ name }) => name.length >= 2, {
    error: "Name must be at least 2 characters.",
    path: ["firstName"],
  });
