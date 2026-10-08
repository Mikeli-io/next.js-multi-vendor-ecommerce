import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // The default 1 MB Server Action body limit would reject uploads before
      // validation. The largest form is Add New Vendor: three images of up to
      // 2 MB (lib/validation/image.ts) plus a 1 MB TIN certificate
      // (lib/validation/document.ts) — 7 MB, plus form overhead.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
