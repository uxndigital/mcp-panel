import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';

import apiRouter from './routes/api.js';
import mcpRouter from './routes/mcp.js';
import { mcpManager } from './services/mcp-manager.js';

const app = express();
const PORT = Number(process.env.PORT) || 9800;

// 在开发环境中：__dirname 是 src/
// 在构建后：__dirname 是 dist/api-server/src/
// 需要找到与 dist 同级的 cache 文件夹
const cache = path.resolve(process.cwd(), 'cache');

console.log('📁 Cache 目录路径:', cache);
console.log('📁 Cache 目录是否存在:', fs.existsSync(cache));

app.use('/cache', express.static(cache));

// 中间件
app.use(cors());
app.use('/api', express.json(), apiRouter);
app.use('/:mcpName', mcpRouter);

// 健康检查端点
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('❌ MCP API Error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
);

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// 初始化 MCP 管理器
async function initializeServer() {
  try {
    await mcpManager.initialize();
    console.log('✅ MCP 管理器初始化成功');
  } catch (error) {
    console.error('❌ 初始化 MCP 管理器失败:', error);
    process.exit(1);
  }
}

// 启动服务器
async function startServer() {
  await initializeServer();

  app.listen(PORT, '127.0.0.1', () => {
    console.log(`✅ MCP API Server 已启动: http://localhost:${PORT}`);
    console.log(`📋 端点列表: http://localhost:${PORT}/api/mcp/list`);
    console.log(`💚 健康检查: http://localhost:${PORT}/health`);
  });
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🛑 正在关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 正在关闭服务器...');
  process.exit(0);
});

// 添加捕获 promise 未处理的错误
process.on('unhandledRejection', (error) => {
  console.error('❌ 未处理的 promise 错误:', error);
});

startServer().catch((error) => {
  console.error('❌ 启动服务器失败:', error);
  process.exit(1);
});
