"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { approvalDecisionSchema, merchandisingFlagSchema } from "@/lib/validation/admin-product";
import { productIdSchema } from "@/lib/validation/product";
import type { FormActionResult } from "./form-result";

/**
 * Admin Product Management mutations: approval decisions and the Featured /
 * Popular flags. Each checks the ADMIN role first, outside any try/catch, and
 * changes only those columns of the vendor's existing product — never its
 * content. Vendors have no path to any of these fields (their product actions
 * never read them).
 */

const UNEXPECTED = "Something went wrong. Please try again.";
const GONE = "This product no longer exists.";

/** Allowed approval moves: PENDING → APPROVED / REJECTED, APPROVED ⇄ REJECTED. */
const FROM = {
  APPROVED: ["PENDING", "REJECTED"],
  REJECTED: ["PENDING", "APPROVED"],
} as const;

function revalidateProduct(id: string) {
  revalidatePath("/admin/products", "layout");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/vendor/products", "layout");
}

export async function setProductApproval(id: string, decision: string): Promise<FormActionResult> {
  await requireAdmin();
  if (!productIdSchema.safeParse(id).success) return { ok: false, formError: GONE };
  const parsed = approvalDecisionSchema.safeParse(decision);
  if (!parsed.success) return { ok: false, formError: "That decision isn't available." };
  const to = parsed.data;

  try {
    const product = await prisma.product.findUnique({ where: { id }, select: { name: true, approvalStatus: true } });
    if (!product) return { ok: false, formError: GONE };
    if (!(FROM[to] as readonly string[]).includes(product.approvalStatus)) {
      return { ok: false, formError: `"${product.name}" is already ${product.approvalStatus.toLowerCase()}.` };
    }

    // One UPDATE (atomic): conditional on the status the admin saw, so two
    // admins can't overwrite each other; rejecting also clears both
    // merchandising flags in the same statement.
    const { count } = await prisma.product.updateMany({
      where: { id, approvalStatus: product.approvalStatus },
      data: to === "REJECTED" ? { approvalStatus: "REJECTED", isFeatured: false, isPopular: false } : { approvalStatus: "APPROVED" },
    });
    if (count === 0) return { ok: false, formError: "This product's status was just changed elsewhere. Reload and try again." };

    revalidateProduct(id);
    return { ok: true, message: `"${product.name}" was ${to === "APPROVED" ? "approved" : "rejected"}.` };
  } catch (error) {
    console.error("setProductApproval failed", error);
    return { ok: false, formError: UNEXPECTED };
  }
}

/** Featured / Popular. Only an APPROVED product can be switched on; switching off always works. */
export async function setProductMerchandising(id: string, flag: string, on: boolean): Promise<FormActionResult> {
  await requireAdmin();
  if (!productIdSchema.safeParse(id).success) return { ok: false, formError: GONE };
  const parsed = merchandisingFlagSchema.safeParse(flag);
  if (!parsed.success || typeof on !== "boolean") return { ok: false, formError: "That setting isn't available." };
  const column = parsed.data === "featured" ? "isFeatured" : "isPopular";
  const label = parsed.data === "featured" ? "Featured" : "Popular";

  try {
    const product = await prisma.product.findUnique({ where: { id }, select: { name: true } });
    if (!product) return { ok: false, formError: GONE };
    const { count } = await prisma.product.updateMany({
      where: on ? { id, approvalStatus: "APPROVED" } : { id },
      data: { [column]: on },
    });
    if (count === 0) return { ok: false, formError: `Only approved products can be marked ${label}.` };

    revalidateProduct(id);
    return { ok: true, message: `"${product.name}" is ${on ? "now" : "no longer"} ${label}.` };
  } catch (error) {
    console.error("setProductMerchandising failed", error);
    return { ok: false, formError: UNEXPECTED };
  }
}
