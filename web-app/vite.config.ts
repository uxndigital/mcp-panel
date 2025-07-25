import react from '@vitejs/plugin-react-swc';
import wyw from '@wyw-in-js/vite';
import path from 'path';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // wyw({ exclude: /\.(ts|tsx)$/ })
    wyw({
      include: ['**/*.{js,jsx,ts,tsx}'],
      exclude: ['**/node_modules/**'],
      babelOptions: {
        presets: ['@babel/preset-typescript'],
      },
    }),
    tsconfigPaths({
      projects: ['./tsconfig.json'],
    }),
  ],
  server: {
    port: 9801,
    host: '127.0.0.1',
    proxy: {
      // 代理所有 /api 请求到 API 服务器
      '/api': {
        target: 'http://localhost:9800',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      // 代理所有 /:name/mcp 请求到 API 服务器
      '/*/mcp': {
        target: 'http://localhost:9800',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
  preview: {
    port: 9801,
    host: '127.0.0.1',
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
