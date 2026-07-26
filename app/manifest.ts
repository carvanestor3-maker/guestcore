import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "guestcore — scoring de huéspedes",
    short_name: "guestcore",
    description: "Veraz inmobiliario para alquiler temporario en Argentina",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#171717",
    lang: "es-AR",
    icons: [
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512x512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
