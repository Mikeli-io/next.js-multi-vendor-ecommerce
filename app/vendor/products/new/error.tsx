"use client";

import { ProductError } from "@/components/products/product-error";

export default function ProductErrorPage(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <ProductError {...props} heading="Add New Product" title="Something went wrong" body="We couldn't load the product form. Please try again." />;
}
