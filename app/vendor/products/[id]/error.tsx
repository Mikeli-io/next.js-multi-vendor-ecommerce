"use client";

import { ProductError } from "@/components/products/product-error";

export default function ProductErrorPage(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <ProductError {...props} heading="Product" title="Couldn't load this product" body="Something went wrong while loading this product. Please try again." />;
}
