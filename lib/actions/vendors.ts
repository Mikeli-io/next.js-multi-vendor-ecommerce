"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/guards";
import { hashPassword } from "@/lib/auth/password";
import { isUniqueViolation, violatedTarget } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/slug";
import { InvalidDocumentError, removeDocument, saveDocument } from "@/lib/uploads/documents";
import { InvalidImageError, removeImage, saveImage } from "@/lib/uploads/images";
import { toFieldErrors } from "@/lib/validation/field-errors";
import { adminVendorCreateSchema, vendorIdSchema, vendorStatusActionSchema } from "@/lib/validation/vendor";
import { VENDOR_TRANSITIONS } from "@/lib/vendors/status";
import type { FormActionResult } from "./form-result";

/**
 * Change a store's status — approve, reject, suspend or reinstate.
 *
 * ADMIN-only (checked first, outside any try/catch). The action and id are
 * validated, the change must be listed in VENDOR_TRANSITIONS, and the update
 * is conditional on the status the admin saw, so two admins acting at once
 * cannot overwrite each other's decision. Nothing is ever deleted.
 *
 * The vendor's own access follows immediately: the vendor guard reads this
 * status from the database on every request, not from the session token.
 */
export async function changeVendorStatus(id: string, action: string): Promise<FormActionResult> {
  await requireAdmin();

  const parsedId = vendorIdSchema.safeParse(id);
  const parsedAction = vendorStatusActionSchema.safeParse(action);
  if (!parsedId.success) return { ok: false, formError: "This vendor no longer exists." };
  if (!parsedAction.success) return { ok: false, formError: "That action isn't available." };

  const transition = VENDOR_TRANSITIONS[parsedAction.data];

  try {
    const vendor = await prisma.vendor.findUnique({ where: { id }, select: { storeName: true, status: true } });
    if (!vendor) return { ok: false, formError: "This vendor no longer exists." };

    if (!transition.from.includes(vendor.status)) {
      return {
        ok: false,
        formError: `"${vendor.storeName}" is ${vendor.status.toLowerCase()}, so it can't be ${transition.done}.`,
      };
    }

    // Conditional on the status read above: a concurrent change makes this a no-op.
    const { count } = await prisma.vendor.updateMany({
      where: { id, status: vendor.status },
      data: { status: transition.to },
    });
    if (count === 0) {
      return { ok: false, formError: "This vendor's status was just changed by someone else. Refresh and try again." };
    }

    revalidatePath("/admin/vendor-approval");
    revalidatePath("/admin/vendors");
    revalidatePath(`/admin/vendors/${id}`);
    return { ok: true, message: `"${vendor.storeName}" was ${transition.done}.` };
  } catch (error) {
    console.error("changeVendorStatus failed", error);
    return { ok: false, formError: "Something went wrong. Please try again." };
  }
}

export type CreateVendorResult =
  | { ok: true; message: string; vendorId: string }
  | Extract<FormActionResult, { ok: false }>;

const DUPLICATE_EMAIL = "An account with this email already exists.";
const DUPLICATE_STORE = "A store with this name already exists.";

const TEXT_FIELDS = ["firstName", "lastName", "phone", "email", "password", "confirmPassword", "storeName", "address", "tinNumber", "tinExpireDate"] as const;
const FILE_FIELDS = ["image", "logo", "coverImage", "tinCertificate"] as const;

/**
 * Add New Vendor: create a VENDOR account and its store in one step.
 *
 * - ADMIN-only, checked first and outside any try/catch.
 * - Validated with the same schema the form uses; role and status are
 *   literals here, never read from the form.
 * - The store is APPROVED at once: the approval queue exists for an admin to
 *   vet *self-registered* sellers, and here the admin is that reviewer.
 * - User and Vendor are one nested `create` — a single transaction, so there
 *   is never an account without its store or vice versa. Files are stored
 *   first and removed again if the write fails, so nothing is left orphaned.
 */
export async function createVendor(formData: FormData): Promise<CreateVendorResult> {
  await requireAdmin();

  const raw: Record<string, unknown> = {};
  for (const key of TEXT_FIELDS) raw[key] = String(formData.get(key) ?? "");
  for (const key of FILE_FIELDS) raw[key] = formData.get(key);

  const parsed = adminVendorCreateSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  const data = parsed.data;

  // Friendly pre-checks; the unique index on email remains the real guarantee.
  // Store names are not unique in the schema (self-registration de-duplicates
  // only the slug), but an admin creating a second identically named store is
  // almost certainly a mistake, so it is refused here.
  const [emailTaken, storeTaken] = await Promise.all([
    prisma.user.findUnique({ where: { email: data.email }, select: { id: true } }),
    prisma.vendor.findFirst({ where: { storeName: data.storeName }, select: { id: true } }),
  ]);
  if (emailTaken || storeTaken) {
    return {
      ok: false,
      fieldErrors: {
        ...(emailTaken ? { email: [DUPLICATE_EMAIL] } : {}),
        ...(storeTaken ? { storeName: [DUPLICATE_STORE] } : {}),
      },
    };
  }

  const savedImages: string[] = [];
  let savedCertificate: string | null = null;
  const storeImage = async (field: "image" | "logo" | "coverImage", file: File) => {
    try {
      const saved = await saveImage("vendors", file);
      savedImages.push(saved);
      return saved;
    } catch (error) {
      if (error instanceof InvalidImageError) throw new FieldFileError(field, error.message);
      throw error;
    }
  };

  try {
    const image = await storeImage("image", data.image);
    const logo = await storeImage("logo", data.logo);
    const coverImage = await storeImage("coverImage", data.coverImage);
    if (data.tinCertificate) {
      try {
        savedCertificate = await saveDocument("vendor-documents", data.tinCertificate);
      } catch (error) {
        if (error instanceof InvalidDocumentError) throw new FieldFileError("tinCertificate", error.message);
        throw error;
      }
    }

    const slug = await generateUniqueSlug(
      data.storeName,
      async (candidate) => Boolean(await prisma.vendor.findUnique({ where: { slug: candidate }, select: { id: true } })),
      "store",
    );

    const user = await prisma.user.create({
      data: {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phone: data.phone,
        passwordHash: await hashPassword(data.password),
        role: "VENDOR",
        vendor: {
          create: {
            storeName: data.storeName,
            slug,
            status: "APPROVED",
            image,
            logo,
            coverImage,
            address: data.address,
            tinNumber: data.tinNumber,
            tinExpireDate: data.tinExpireDate,
            tinCertificate: savedCertificate,
          },
        },
      },
      select: { vendor: { select: { id: true } } },
    });

    revalidatePath("/admin/vendors");
    revalidatePath("/admin/dashboard");
    return { ok: true, message: `"${data.storeName}" was created.`, vendorId: user.vendor!.id };
  } catch (error) {
    // Nothing references files stored for a write that failed.
    await Promise.all([
      ...savedImages.map((saved) => removeImage("vendors", saved)),
      removeDocument("vendor-documents", savedCertificate),
    ]);
    if (error instanceof FieldFileError) return { ok: false, fieldErrors: { [error.field]: [error.message] } };
    if (isUniqueViolation(error)) {
      return violatedTarget(error).includes("slug")
        ? { ok: false, formError: "Another store was just saved with a similar name. Please try again." }
        : { ok: false, fieldErrors: { email: [DUPLICATE_EMAIL] } };
    }
    console.error("createVendor failed", error);
    return { ok: false, formError: "Something went wrong creating the vendor. Please try again." };
  }
}

/** A stored file was rejected after sniffing its bytes; carries the form field. */
class FieldFileError extends Error {
  constructor(
    readonly field: string,
    message: string,
  ) {
    super(message);
  }
}
