import type { NextRequest } from "next/server";

import { documentResponse, readDocument } from "@/lib/uploads/documents";
import { vendorIdSchema } from "@/lib/validation/vendor";
import { getVendorTinCertificate } from "@/lib/vendors/queries";

/**
 * Serves a vendor's TIN certificate to admins only. The file lives in private
 * storage (lib/uploads/documents.ts), so this route — and its ADMIN check
 * inside `getVendorTinCertificate` — is one of only two ways to read it; the
 * other is the vendor's own route, /vendor/profile/tin-certificate.
 */
export async function GET(_request: NextRequest, ctx: RouteContext<"/admin/vendors/[id]/tin-certificate">) {
  const { id } = await ctx.params;
  if (!vendorIdSchema.safeParse(id).success) return new Response("Not found", { status: 404 });

  const certificate = await getVendorTinCertificate(id);
  const file = certificate && (await readDocument("vendor-documents", certificate.key));
  if (!certificate || !file) return new Response("Not found", { status: 404 });

  return documentResponse(file, `tin-certificate-${certificate.slug}`);
}
