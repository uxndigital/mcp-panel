import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 9905,
    host: true,
    proxy: {
      // 代理所有 /api 请求到 API 服务器
      '/api': {
        target: 'http://localhost:9906',
        changeOrigin: true,
        rewrite: (path) => path
      },
      // 代理所有 /:name/mcp 请求到 API 服务器
      '/*/mcp': {
        target: 'http://localhost:9906',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  },
  // 明确指定构建配置
  build: {
    outDir: 'dist',
  },
  // 确保正确解析 TypeScript 项目引用
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
      },
    },
  },
}); 