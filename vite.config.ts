import tailwindcss from "@tailwindcss/vite";
import inertia from "@inertiajs/vite";
import laravel from "laravel-vite-plugin";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
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
