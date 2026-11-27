import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image.
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  // sharp ships native binaries; keep it out of the server bundle.
  serverExternalPackages: ["sharp"],
  experimental: {
    serverActions: {
      // Photos and receipts are uploaded through Server Actions.
      // Images are downscaled in the browser first; PDFs can be larger.
      bodySizeLimit: "25mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
