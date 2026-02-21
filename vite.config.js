import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      watch: {
        usePolling: true,
      },
      proxy: {
        "/api/bland-call": {
          target: "https://api.bland.ai",
          changeOrigin: true,
          rewrite: () => "/v1/calls",
          headers: {
            Authorization: `Bearer ${env.BLAND_API_KEY}`,
            Origin: "https://api.bland.ai",
          },
        },
      },
    },
  };
});
