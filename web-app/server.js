import dotenv from 'dotenv';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageJson = JSON.parse(
  await fs.readFile(new URL('./package.json', import.meta.url))
);

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 9801;
const HOST = '127.0.0.1';

console.log('🚀 正在启动服务器...');
console.log(`📂 工作目录: ${__dirname}`);
console.log(`📂 静态文件目录: ${path.resolve(__dirname, 'dist')}`);

const app = express();
const root = path.resolve(__dirname, 'dist');

// API 路由
app.get('/getAppVersion', (req, res) => {
  const version = packageJson.version;
  res.json({ version });
});

// 静态文件服务 - 提供 dist 目录下的所有文件
// app.use('/', express.static(root));
app.use('/', express.static(root));

// 所有其他路由都返回 dist/index.html
app.use((req, res) => {
  res.sendFile(path.join(root, 'index.html'));
});

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 生产环境服务器运行在 http://${HOST}:${PORT}`);
  console.log(`📂 静态文件目录: ${root}`);
});

// 添加错误处理
server.on('error', (error) => {
  console.error('❌ 服务器启动失败:', error);
  process.exit(1);
});
