import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves from /<repo>/; keep relative so it works anywhere.
  base: "./",
});
