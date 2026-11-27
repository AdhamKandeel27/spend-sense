import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Spend Sense",
    short_name: "Spend Sense",
    description: "A visual record of everything you buy, grouped into the projects of your life.",
    start_url: "/spaces",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f2f2ee",
    theme_color: "#1f5a50",
    categories: ["finance", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [{ name: "Spaces", url: "/spaces", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] }],
  };
}
