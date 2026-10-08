"use client";

import { ProductError } from "@/components/products/product-error";

export default function ProductErrorPage(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <ProductError {...props} heading="Product List" title="Couldn't load products" body="Something went wrong while loading your product list. Please try again." />;
}
