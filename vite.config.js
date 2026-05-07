import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Change base when your GitHub repository name is different.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/thai-stock-dashboard/",
});
