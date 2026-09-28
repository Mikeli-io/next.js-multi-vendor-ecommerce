"use client";

import { BrandsError } from "@/components/brands/brands-error";

export default function BrandDetailsError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <BrandsError {...props} title="Couldn't load this brand" />;
}
