import react from '@vitejs/plugin-react';
import wyw from '@wyw-in-js/vite';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), wyw()],
  server: {
    port: 9801,
    host: true,
    proxy: {
      // 代理所有 /api 请求到 API 服务器
<<<<<<< HEAD
      '/api': {
        target: 'http://localhost:9800',
=======
      "/api": {
        target: "http://localhost:9800",
>>>>>>> 615ae73 (feat(leo): use mcp-server)
        changeOrigin: true,
        rewrite: (path) => path,
      },
      // 代理所有 /:name/mcp 请求到 API 服务器
<<<<<<< HEAD
      '/*/mcp': {
        target: 'http://localhost:9800',
=======
      "/*/mcp": {
        target: "http://localhost:90800",
>>>>>>> 615ae73 (feat(leo): use mcp-server)
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
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
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
