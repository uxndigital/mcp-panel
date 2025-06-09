import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { mcpApiServerPlugin } from "./vite-plugins/index.js";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // MCP API 服务器插件
    mcpApiServerPlugin({
      baseUrl: "/api",
      enableLogging: true,
    }),
  ],
  server: {
    port: 9904,
    host: true,
  },
});
