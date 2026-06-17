import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const backendTarget = "http://localhost:8787";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/resume": { target: backendTarget, changeOrigin: true },
      "/health": { target: backendTarget, changeOrigin: true },
      "/translate": { target: backendTarget, changeOrigin: true },
      "/overrides": { target: backendTarget, changeOrigin: true },
      "/docx": { target: backendTarget, changeOrigin: true },
    },
  },
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "src/**/*.test.{ts,tsx}"],
  },
});
