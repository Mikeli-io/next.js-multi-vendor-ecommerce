import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Brand images may be up to 2 MB (lib/validation/brand.ts). The default
      // 1 MB Server Action body limit would reject them before validation, so
      // allow the image plus form overhead.
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
