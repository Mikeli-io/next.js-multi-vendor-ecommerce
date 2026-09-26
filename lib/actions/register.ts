"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { signIn } from "@/auth";
import { hashPassword } from "@/lib/auth/password";
import { landingPathFor } from "@/lib/auth/routes";
import { generateUniqueSlug } from "@/lib/auth/slug";
import { prisma } from "@/lib/prisma";
import { toFieldErrors } from "@/lib/validation/field-errors";
import {
  customerRegisterSchema,
  vendorRegisterSchema,
} from "@/lib/validation/auth";
import type { AuthFormState } from "./auth-state";

/**
 * Registration lives here rather than in Auth.js, which only signs people in.
 *
 * Roles are literals written into the `create` calls below. Nothing in this
 * file reads a role from `formData`, so there is no request that produces an
 * ADMIN — posting `role=ADMIN` simply has no effect.
 */

const DUPLICATE_EMAIL_ERROR =
  "An account with this email already exists. Try signing in instead.";

const UNEXPECTED_ERROR =
  "Something went wrong creating your account. Please try again.";

function isUniqueConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function violatedTarget(error: Prisma.PrismaClientKnownRequestError): string {
  const target = error.meta?.target;
  return Array.isArray(target) ? target.join(",") : String(target ?? "");
}

export async function registerCustomer(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const rawName = String(formData.get("name") ?? "");
  const rawEmail = String(formData.get("email") ?? "");
  // Passwords are deliberately absent from `values`: they are never echoed
  // back to the browser on a failed submit.
  const values = { name: rawName, email: rawEmail };

  const parsed = customerRegisterSchema.safeParse({
    name: rawName,
    email: rawEmail,
    password: String(formData.get("password") ?? ""),
    // An unchecked box is absent from the payload, which fails the literal.
    acceptTerms: formData.get("acceptTerms") === "on",
  });

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error), values };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return { fieldErrors: { email: [DUPLICATE_EMAIL_ERROR] }, values };
  }

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        role: "CUSTOMER",
      },
      select: { id: true },
    });
  } catch (error) {
    // Two submissions racing past the check above land here.
    if (isUniqueConstraintError(error)) {
      return { fieldErrors: { email: [DUPLICATE_EMAIL_ERROR] }, values };
    }
    console.error("registerCustomer: failed to create user", error);
    return { formError: UNEXPECTED_ERROR, values };
  }

  await signIn("credentials", { email, password, redirect: false });
  // Outside any try/catch: `redirect` signals by throwing.
  redirect(landingPathFor("CUSTOMER"));
}

export async function registerVendor(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const rawName = String(formData.get("name") ?? "");
  const rawEmail = String(formData.get("email") ?? "");
  const rawStoreName = String(formData.get("storeName") ?? "");
  const values = { name: rawName, email: rawEmail, storeName: rawStoreName };

  const parsed = vendorRegisterSchema.safeParse({
    name: rawName,
    email: rawEmail,
    storeName: rawStoreName,
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error), values };
  }

  const { name, email, storeName, password } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return { fieldErrors: { email: [DUPLICATE_EMAIL_ERROR] }, values };
  }

  const passwordHash = await hashPassword(password);
  const slug = await generateUniqueSlug(storeName);

  try {
    // The store is nested inside the user's `create`, so Prisma writes both
    // rows in one transaction: either the account and the store both exist,
    // or neither does.
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "VENDOR",
        vendor: {
          create: { storeName, slug, status: "PENDING" },
        },
      },
      select: { id: true },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      if (violatedTarget(error).includes("slug")) {
        return {
          fieldErrors: {
            storeName: [
              "That store name was just taken. Please try a different one.",
            ],
          },
          values,
        };
      }
      return { fieldErrors: { email: [DUPLICATE_EMAIL_ERROR] }, values };
    }
    console.error("registerVendor: failed to create user and store", error);
    return { formError: UNEXPECTED_ERROR, values };
  }

  await signIn("credentials", { email, password, redirect: false });
  // A new store is always PENDING, so this lands on the status screen, never
  // on the operational vendor dashboard.
  redirect(landingPathFor("VENDOR", "PENDING"));
}
