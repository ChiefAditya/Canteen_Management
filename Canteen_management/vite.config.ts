import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000, // Frontend dev server port
    proxy: {
      // Proxy API requests to backend server
      "/api": {
        target: "http://localhost:8080", // Backend server port
        changeOrigin: true,
        secure: false,
        logLevel: "debug",
      },
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react()], // Use real backend instead of mock
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));
