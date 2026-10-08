"use server";

import { revalidatePath } from "next/cache";

import { requireApprovedVendor } from "@/lib/auth/guards";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { isUniqueViolation, violatedTarget } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";
import { generateUniqueSlug, slugify } from "@/lib/slug";
import { InvalidDocumentError, removeDocument, saveDocument } from "@/lib/uploads/documents";
import { InvalidImageError, removeImage, saveImage } from "@/lib/uploads/images";
import { changePasswordSchema } from "@/lib/validation/auth";
import { toFieldErrors } from "@/lib/validation/field-errors";
import {
  TIN_EXPIRED,
  TIN_NUMBER_NEEDED,
  isExpired,
  storeBrandingSchema,
  tinNumberPresentIfNeeded,
  vendorProfileSchema,
  vendorStoreSchema,
  type StoreImageField,
} from "@/lib/validation/vendor";
import type { FormActionResult } from "./form-result";

const UNEXPECTED = "Something went wrong. Please try again.";

/**
 * Both actions act on the caller's own account only. Each re-checks the
 * session itself (a Server Action is a public endpoint, callable without the
 * page) and never reads a user or vendor id from the form: the row is always
 * the one `requireApprovedVendor()` resolves from the session and database.
 */

/** Revalidate everywhere a vendor's name, phone or store images appear. */
function revalidateVendor(vendorId: string) {
  revalidatePath("/vendor", "layout");
  revalidatePath("/admin/vendors");
  revalidatePath("/admin/vendor-approval");
  revalidatePath(`/admin/vendors/${vendorId}`);
}

/** Basic Information: the owner's name and phone (both on `User`). */
export async function updateVendorProfile(formData: FormData): Promise<FormActionResult> {
  const user = await requireApprovedVendor();

  const parsed = vendorProfileSchema.safeParse({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  const { name, phone } = parsed.data;

  try {
    await prisma.user.update({ where: { id: user.id }, data: { name, phone }, select: { id: true } });
  } catch (error) {
    console.error("updateVendorProfile failed", error);
    return { ok: false, formError: UNEXPECTED };
  }

  revalidateVendor(user.vendor.id);
  return { ok: true, message: "Your profile has been updated." };
}

const IMAGE_LABEL: Record<StoreImageField, string> = { logo: "Store logo", coverImage: "Cover image" };

/**
 * Replace or remove the store logo (`Vendor.logo`) or cover (`Vendor.coverImage`)
 * of the caller's own store. The field is one of those two literals — the
 * owner photo (`Vendor.image`) can't be reached from here — and the store is
 * the session vendor's, never an id from the request.
 *
 * Files use the shared `lib/uploads/images` store ("vendors" folder, bytes
 * sniffed on save). The update is conditional on the value just read, so a
 * concurrent change can't orphan a file; the old file is deleted only after
 * the row stops pointing at it.
 */
export async function updateStoreBranding(formData: FormData): Promise<FormActionResult> {
  const user = await requireApprovedVendor();

  const parsed = storeBrandingSchema.safeParse({
    op: formData.get("op"),
    field: formData.get("field"),
    file: formData.get("file"),
  });
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "That change isn't valid.";
    return { ok: false, formError: message, fieldErrors: { file: [message] } };
  }
  const { field, op } = parsed.data;
  const label = IMAGE_LABEL[field];

  let saved: string | null = null;
  try {
    const store = await prisma.vendor.findUnique({
      where: { userId: user.id },
      select: { id: true, logo: true, coverImage: true },
    });
    if (!store) return { ok: false, formError: UNEXPECTED };
    const current = store[field];
    if (op === "remove" && !current) return { ok: true, message: `${label} removed.` };

    if (parsed.data.op === "replace") saved = await saveImage("vendors", parsed.data.file);

    const { count } = await prisma.vendor.updateMany({
      where: { id: store.id, userId: user.id, [field]: current },
      data: { [field]: saved },
    });
    if (count === 0) {
      await removeImage("vendors", saved);
      return { ok: false, formError: `Your ${label.toLowerCase()} was just changed elsewhere. Reload and try again.` };
    }

    await removeImage("vendors", current);
    revalidateVendor(store.id);
    return { ok: true, message: op === "replace" ? `${label} updated.` : `${label} removed.` };
  } catch (error) {
    await removeImage("vendors", saved);
    if (error instanceof InvalidImageError) return { ok: false, formError: error.message, fieldErrors: { file: [error.message] } };
    console.error("updateStoreBranding failed", error);
    return { ok: false, formError: UNEXPECTED };
  }
}

const DUPLICATE_STORE = "A store with this name already exists.";

/**
 * Store Information and Business TIN of the caller's own store: name,
 * address, TIN number, expiry date and the TIN certificate.
 *
 * - Same field rules as Add New Vendor (shared schemas), plus the two that
 *   depend on stored values (see `vendorStoreSchema`).
 * - The store is always the session vendor's; no id is read from the form.
 * - The certificate goes to *private* storage via `saveDocument` (bytes
 *   sniffed); the old one is deleted only once the row no longer points at
 *   it. The write is conditional on the certificate key just read, so a
 *   concurrent change can't orphan a file.
 * - A name change refreshes the slug, as brand renames do, and is refused if
 *   another store already uses the name (as in Add New Vendor).
 */
export async function updateVendorStore(formData: FormData): Promise<FormActionResult> {
  const user = await requireApprovedVendor();

  const parsed = vendorStoreSchema.safeParse({
    storeName: String(formData.get("storeName") ?? ""),
    address: String(formData.get("address") ?? ""),
    tinNumber: String(formData.get("tinNumber") ?? ""),
    tinExpireDate: String(formData.get("tinExpireDate") ?? ""),
    tinCertificate: formData.get("tinCertificate"),
    removeTinCertificate: formData.get("removeTinCertificate"),
  });
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  const data = parsed.data;

  const store = await prisma.vendor.findUnique({
    where: { userId: user.id },
    select: { id: true, storeName: true, slug: true, tinExpireDate: true, tinCertificate: true },
  });
  if (!store) return { ok: false, formError: UNEXPECTED };

  // Rules that depend on what is stored.
  const dateChanged = (data.tinExpireDate?.getTime() ?? null) !== (store.tinExpireDate?.getTime() ?? null);
  const keepsCertificate = Boolean(store.tinCertificate) && !data.removeTinCertificate;
  const fieldErrors: Record<string, string[]> = {};
  if (dateChanged && isExpired(data.tinExpireDate)) fieldErrors.tinExpireDate = [TIN_EXPIRED];
  if (!tinNumberPresentIfNeeded(data.tinNumber, data.tinExpireDate, Boolean(data.tinCertificate) || keepsCertificate)) {
    fieldErrors.tinNumber = [TIN_NUMBER_NEEDED];
  }
  const nameTaken = await prisma.vendor.findFirst({
    where: { storeName: data.storeName, NOT: { id: store.id } },
    select: { id: true },
  });
  if (nameTaken) fieldErrors.storeName = [DUPLICATE_STORE];
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };

  let savedCertificate: string | null = null;
  try {
    if (data.tinCertificate) savedCertificate = await saveDocument("vendor-documents", data.tinCertificate);

    const slug =
      slugify(data.storeName) === slugify(store.storeName)
        ? store.slug
        : await generateUniqueSlug(
            data.storeName,
            async (candidate) =>
              Boolean(await prisma.vendor.findFirst({ where: { slug: candidate, NOT: { id: store.id } }, select: { id: true } })),
            "store",
          );

    const certificateChange = savedCertificate
      ? { tinCertificate: savedCertificate }
      : data.removeTinCertificate
        ? { tinCertificate: null }
        : {};

    const { count } = await prisma.vendor.updateMany({
      where: { id: store.id, userId: user.id, tinCertificate: store.tinCertificate },
      data: {
        storeName: data.storeName,
        slug,
        address: data.address,
        tinNumber: data.tinNumber,
        tinExpireDate: data.tinExpireDate,
        ...certificateChange,
      },
    });
    if (count === 0) {
      await removeDocument("vendor-documents", savedCertificate);
      return { ok: false, formError: "Your store details were just changed elsewhere. Reload and try again." };
    }
  } catch (error) {
    await removeDocument("vendor-documents", savedCertificate);
    if (error instanceof InvalidDocumentError) return { ok: false, fieldErrors: { tinCertificate: [error.message] } };
    if (isUniqueViolation(error)) {
      return violatedTarget(error).includes("slug")
        ? { ok: false, formError: "Another store was just saved with a similar name. Please try again." }
        : { ok: false, fieldErrors: { storeName: [DUPLICATE_STORE] } };
    }
    console.error("updateVendorStore failed", error);
    return { ok: false, formError: UNEXPECTED };
  }

  // The row no longer points at the old certificate; now it is safe to delete.
  if (savedCertificate || data.removeTinCertificate) await removeDocument("vendor-documents", store.tinCertificate);

  revalidateVendor(store.id);
  return { ok: true, message: "Your store information has been updated." };
}

/**
 * Change the signed-in vendor's password. The current password must match the
 * stored bcrypt hash; the new one is hashed with the same `hashPassword` used
 * at registration. Sign-in checks the hash on every attempt, so from here on
 * only the new password authenticates.
 */
export async function changeVendorPassword(formData: FormData): Promise<FormActionResult> {
  const user = await requireApprovedVendor();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  const { currentPassword, newPassword } = parsed.data;

  try {
    const row = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
    if (!row) return { ok: false, formError: UNEXPECTED };

    if (!(await verifyPassword(currentPassword, row.passwordHash))) {
      return { ok: false, fieldErrors: { currentPassword: ["Your current password is incorrect."] } };
    }

    // Conditional on the hash just verified: a concurrent change makes this a no-op.
    const { count } = await prisma.user.updateMany({
      where: { id: user.id, passwordHash: row.passwordHash },
      data: { passwordHash: await hashPassword(newPassword) },
    });
    if (count === 0) return { ok: false, formError: "Your password was just changed elsewhere. Reload and try again." };
  } catch (error) {
    console.error("changeVendorPassword failed", error);
    return { ok: false, formError: UNEXPECTED };
  }

  return { ok: true, message: "Your password has been changed." };
}
