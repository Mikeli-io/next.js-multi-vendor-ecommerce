import "server-only";

import { cache } from "react";

import { requireApprovedVendor } from "@/lib/auth/guards";
import { maskEmail } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { documentExt } from "@/lib/uploads/documents";

export type OwnVendorProfile = {
  // User
  firstName: string;
  lastName: string;
  email: string;
  maskedEmail: string;
  phone: string | null;
  // Vendor — store branding
  /** `Vendor.logo` — the round store logo. */
  logo: string | null;
  /** `Vendor.coverImage` — the banner. */
  coverImage: string | null;
  // Vendor — store information and business TIN
  storeName: string;
  address: string | null;
  tinNumber: string | null;
  /** `YYYY-MM-DD`, ready for a date input. */
  tinExpireDate: string | null;
  /** Whether a certificate is stored, and its type. The private key never leaves the server. */
  tinCertificate: { ext: string } | null;
};

/**
 * The signed-in vendor's own profile. There is no id parameter: the row is
 * always the session user's, re-read from the database, so one vendor can
 * never load another's profile.
 */
export const getOwnVendorProfile = cache(async (): Promise<OwnVendorProfile> => {
  const user = await requireApprovedVendor();
  const row = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      vendor: {
        select: {
          logo: true,
          coverImage: true,
          storeName: true,
          address: true,
          tinNumber: true,
          tinExpireDate: true,
          tinCertificate: true,
        },
      },
    },
  });
  const vendor = row.vendor;

  // `User.name` is one field; the form edits it as first + last.
  const [firstName = "", ...rest] = row.name.trim().split(/\s+/);
  return {
    firstName,
    lastName: rest.join(" "),
    email: row.email,
    maskedEmail: maskEmail(row.email),
    phone: row.phone,
    logo: vendor?.logo ?? null,
    coverImage: vendor?.coverImage ?? null,
    storeName: vendor?.storeName ?? user.vendor.storeName,
    address: vendor?.address ?? null,
    tinNumber: vendor?.tinNumber ?? null,
    tinExpireDate: vendor?.tinExpireDate ? vendor.tinExpireDate.toISOString().slice(0, 10) : null,
    tinCertificate: vendor?.tinCertificate ? { ext: documentExt(vendor.tinCertificate) ?? "file" } : null,
  };
});

/** The session vendor's own certificate key, for the private download route. */
export async function getOwnTinCertificate(): Promise<{ key: string; slug: string } | null> {
  const user = await requireApprovedVendor();
  const row = await prisma.vendor.findUnique({ where: { userId: user.id }, select: { tinCertificate: true, slug: true } });
  return row?.tinCertificate ? { key: row.tinCertificate, slug: row.slug } : null;
}
