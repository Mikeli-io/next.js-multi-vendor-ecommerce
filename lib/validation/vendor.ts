import * as z from "zod";

import { email, newPassword, storeName } from "./auth";
import { optionalDocumentSchema } from "./document";
import { requiredImageSchema } from "./image";
import { phoneSchema } from "./phone";

/** Vendor ids are Prisma cuids; anything else is rejected before the DB. */
export const vendorIdSchema = z.cuid({ error: "This vendor no longer exists." });

export const vendorStatusActionSchema = z.enum(["approve", "reject", "suspend", "reinstate"], {
  error: "Unknown action.",
});

const q = z.string().trim().max(60).catch("");

export const VENDOR_LIST_FILTERS = ["all", "pending", "approved", "suspended", "rejected"] as const;

export const vendorListParamsSchema = z.object({
  q,
  status: z.enum(VENDOR_LIST_FILTERS).catch("all"),
});

export const vendorApprovalParamsSchema = z.object({ q });

export type VendorListParams = z.infer<typeof vendorListParamsSchema>;
export type VendorApprovalParams = z.infer<typeof vendorApprovalParamsSchema>;

// Add New Vendor ------------------------------------------------------------

const personName = (label: string) =>
  z
    .string({ error: `Enter the ${label}.` })
    .trim()
    .min(1, { error: `Enter the ${label}.` })
    .max(40, { error: `${label[0].toUpperCase()}${label.slice(1)} must be 40 characters or fewer.` });

/** `YYYY-MM-DD` from a date input → a UTC-midnight Date; blank → null. */
const optionalDate = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z
    .string({ error: "Enter a valid date." })
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Enter a valid date." })
    .transform((value) => new Date(`${value}T00:00:00Z`))
    .refine((date) => !Number.isNaN(date.getTime()), { error: "Enter a valid date." })
    .nullable(),
);

const todayUtc = () => new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);

const optionalText = (max: number, label: string) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(max, { error: `${label} must be ${max} characters or fewer.` }).nullable(),
  );

// Shared by Add New Vendor and the vendor's own Profile Settings -----------

/** The store's address (`Vendor.address`). */
export const shopAddress = z
  .string({ error: "Enter the shop address." })
  .trim()
  .min(5, { error: "Enter the shop address." })
  .max(100, { error: "Address must be 100 characters or fewer." });

/** `Vendor.tinNumber`: optional; blank → null. */
export const tinNumberSchema = optionalText(30, "TIN").refine(
  (v) => v === null || /^[A-Za-z0-9][A-Za-z0-9 ./-]*$/.test(v),
  { error: "Use letters, numbers, spaces, dots, slashes or dashes." },
);

/** `Vendor.tinExpireDate`: optional `YYYY-MM-DD`; blank → null. Expiry is checked by the caller. */
export const tinExpireDateSchema = optionalDate;

export const TIN_EXPIRED = "The TIN has already expired.";
export const isExpired = (date: Date | null) => date !== null && date < todayUtc();

export const TIN_NUMBER_NEEDED = "Enter the TIN that this date or certificate belongs to.";
/** An expiry date or certificate means nothing without the number itself. */
export const tinNumberPresentIfNeeded = (tinNumber: string | null, expireDate: Date | null, hasCertificate: boolean) =>
  tinNumber !== null || (expireDate === null && !hasCertificate);

/**
 * The Add New Vendor form (AdminAddVendor.dc.html). Required/optional follows
 * the design's asterisks: everything except the Business TIN section is
 * required. Email, password, store name and phone reuse the registration and
 * phone rules, so an admin-created account obeys exactly the same limits as a
 * self-registered one. Role and status are never inputs.
 */
export const adminVendorCreateSchema = z
  .object({
    firstName: personName("first name"),
    lastName: personName("last name"),
    phone: phoneSchema,
    image: requiredImageSchema,

    email,
    password: newPassword,
    confirmPassword: z.string(),

    storeName,
    address: shopAddress,
    logo: requiredImageSchema,
    coverImage: requiredImageSchema,

    tinNumber: tinNumberSchema,
    tinExpireDate: tinExpireDateSchema.refine((date) => !isExpired(date), { error: TIN_EXPIRED }),
    tinCertificate: optionalDocumentSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => tinNumberPresentIfNeeded(data.tinNumber, data.tinExpireDate, Boolean(data.tinCertificate)), {
    error: TIN_NUMBER_NEEDED,
    path: ["tinNumber"],
  });

export type AdminVendorCreateInput = z.infer<typeof adminVendorCreateSchema>;

// Vendor profile (Profile Settings → Basic Information) ----------------------

const ownName = (label: string) =>
  z
    .string({ error: `Enter your ${label}.` })
    .trim()
    .min(1, { error: `Enter your ${label}.` })
    .max(40, { error: `${label[0].toUpperCase()}${label.slice(1)} must be 40 characters or fewer.` });

/**
 * The vendor's own Basic Information (VendorProfile.dc.html). Names map onto
 * the single `User.name`; the phone is the owner's `User.phone` and stays
 * required, as at registration, because it is the store's contact number.
 * Email is the sign-in identity and is not an input. The store logo and cover
 * are changed separately (`storeBrandingSchema`).
 */
export const vendorProfileSchema = z
  .object({
    firstName: ownName("first name"),
    lastName: ownName("last name"),
    phone: phoneSchema,
  })
  .transform(({ firstName, lastName, ...rest }) => ({ name: `${firstName} ${lastName}`, ...rest }));

export type VendorProfileInput = z.input<typeof vendorProfileSchema>;

/** The two store images a vendor manages on their profile. Never `image` (the owner photo). */
export const STORE_IMAGE_FIELDS = ["logo", "coverImage"] as const;
export type StoreImageField = (typeof STORE_IMAGE_FIELDS)[number];

/** Replace a store image with an upload, or remove it (set to null). */
export const storeBrandingSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("replace"), field: z.enum(STORE_IMAGE_FIELDS), file: requiredImageSchema }),
  z.object({ op: z.literal("remove"), field: z.enum(STORE_IMAGE_FIELDS) }),
]);

/**
 * The vendor's own Store Information and Business TIN (Profile Settings).
 * Same field rules as Add New Vendor. Two rules depend on what is already
 * stored, so the action applies them (and the form mirrors them):
 * - "already expired" only for a date that is being changed — an old stored
 *   date must not block saving the store name;
 * - "TIN required" also counts a certificate that is kept from before.
 * `removeTinCertificate` ("1") drops the stored certificate; a new upload
 * replaces it.
 */
export const vendorStoreSchema = z.object({
  storeName,
  address: shopAddress,
  tinNumber: tinNumberSchema,
  tinExpireDate: tinExpireDateSchema,
  tinCertificate: optionalDocumentSchema,
  removeTinCertificate: z.preprocess((v) => v === "1" || v === true, z.boolean()),
});

export type VendorStoreInput = z.input<typeof vendorStoreSchema>;
