import { redirect } from "next/navigation";

/** /admin/products → the review queue. */
export default function AdminProductsIndex() {
  redirect("/admin/products/pending");
}
