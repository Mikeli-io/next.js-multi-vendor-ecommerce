"use client";

import { BrandsError } from "@/components/brands/brands-error";

export default function BrandListError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <BrandsError {...props} title="Couldn't load brands" />;
}
