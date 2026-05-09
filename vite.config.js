/* eslint-disable no-undef */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
      port: Number(process.env.VITE_PORT) || 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2018",
    minify: "esbuild",
    sourcemap: true,
    cssCodeSplit: true,
  },
  esbuild: {
    drop: ["console", "debugger"],
  },
});
