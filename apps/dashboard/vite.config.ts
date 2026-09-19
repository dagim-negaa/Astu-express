import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "https://astu-express-api.astu-express-api.workers.dev",
        changeOrigin: true,
        secure: false,
      },
      "/storage": {
        target: process.env.VITE_API_URL || "https://astu-express-api.astu-express-api.workers.dev",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/storage/, "/api/assets/storage"),
      },
      "/r2": {
        target: process.env.VITE_API_URL || "https://astu-express-api.astu-express-api.workers.dev",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/r2/, "/api/assets/r2"),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/@tanstack/")) {
            return "vendor-tanstack";
          }
          if (id.includes("node_modules/lucide-react/")) {
            return "vendor-icons";
          }
          if (id.includes("node_modules/zod/")) {
            return "vendor-zod";
          }
        },
      },
    },
  },
});