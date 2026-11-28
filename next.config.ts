import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image.
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Keep visited pages in the client cache for a minute, so switching
    // between tabs shows the page straight away instead of a skeleton.
    // Saving anything calls revalidatePath, which clears this cache.
    staleTimes: { dynamic: 60 },
  },
  // sharp ships native binaries; keep it out of the server bundle.
  serverExternalPackages: ["sharp"],
  // No Server Action body limit override: files go straight from the browser
  // to Supabase Storage, so forms only carry text and file keys.
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
