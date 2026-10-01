import tailwindcss from "@tailwindcss/vite";
import inertia from "@inertiajs/vite";
import laravel from "laravel-vite-plugin";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "resources/js"),
    },
  },
  plugins: [
    laravel({
      input: ["resources/css/app.css", "resources/js/app.tsx"],
      ssr: "resources/js/ssr.tsx",
      refresh: true,
    }),
    inertia(),
    tailwindcss(),
    react(),
  ],
});
