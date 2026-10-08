import { documentResponse, readDocument } from "@/lib/uploads/documents";
import { getOwnTinCertificate } from "@/lib/vendors/profile";

/**
 * The signed-in vendor's own TIN certificate. There is no id in the URL: the
 * file is always the session vendor's (`getOwnTinCertificate` runs the vendor
 * guard), so one vendor can never fetch another's document. Route handlers
 * sit outside the profile layout, hence the guard inside the loader.
 */
export async function GET() {
  const certificate = await getOwnTinCertificate();
  const file = certificate && (await readDocument("vendor-documents", certificate.key));
  if (!certificate || !file) return new Response("Not found", { status: 404 });

  return documentResponse(file, `tin-certificate-${certificate.slug}`);
}
