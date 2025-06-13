import { Server } from '@uxndigital/mcp-server';
import cors from 'cors';
import express from 'express';

import { McpManager } from './services/mcp-manager.js';

const app = express();
const PORT = Number(process.env.PORT) || 9800;

// 中间件
app.use(cors());
app.use(express.json());

// 创建 MCP 管理器实例
const mcpManager = new McpManager();

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

// MCP 动态路由处理 - 使用具体的路由模式
app.use('/:mcpName/mcp', (req, res, next) => {
  const mcpName = req.params.mcpName;

  console.log(`MCP 请求: ${req.method} /${mcpName}/mcp`);

  if (mcpName) {
    const endpoint = `/${mcpName}/mcp`;
    const mcpServer = mcpManager.getMcpServer(endpoint);

    if (mcpServer) {
      const serverInstance = new Server(mcpServer);

      if (req.method === 'POST') {
        serverInstance.handlePostRequest(req as any, res as any).catch(next);
        return;
      } else if (req.method === 'GET') {
        serverInstance.handleGetRequest(req as any, res as any).catch(next);
        return;
      }
      return;
    }
  }
  next();
});

// MCP 管理 API
app.post('/api/mcp/install', async (req, res: any, next) => {
  try {
    const { githubUrl } = req.body;
    if (!githubUrl) {
      return res.status(400).json({ error: 'GitHub URL is required' });
    }

    console.log(`🔧 安装 MCP: ${githubUrl}`);

    const endpoint = await mcpManager.installMcp(githubUrl);
    res.json({ endpoint });
  } catch (error) {
    next(error);
  }
});

// 卸载 MCP - 使用具体的DELETE路由
app.delete('/api/mcp/uninstall/:mcpName', (req, res, next) => {
  const mcpName = req.params.mcpName;
  console.log(mcpName, 'mcpName');

  const endpoint = `/${mcpName}/mcp`;
  console.log(`🗑️ 卸载 MCP: ${endpoint}`);

  mcpManager
    .uninstallMcp(endpoint)
    .then(() => res.json({ success: true }))
    .catch(next);
});

// 更新 MCP - 使用具体的PUT路由
app.put('/api/mcp/update/:mcpName', (req, res, next) => {
  const mcpName = req.params.mcpName;
  console.log(mcpName, 'mcpName');

  const endpoint = `/${mcpName}/mcp`;
  console.log(`🔄 更新 MCP: ${endpoint}`);

  mcpManager
    .updateMcp(endpoint)
    .then((updatedMetadata) =>
      res.json({ success: true, metadata: updatedMetadata })
    )
    .catch(next);
});

// 获取所有 MCP 端点列表
app.get('/api/mcp/list', (req, res) => {
  const mcpInfo = mcpManager.getAllMcpInfo();

  console.log(`📋 获取 MCP 列表: ${mcpInfo.length} 个 MCP`);

  res.json({ mcps: mcpInfo });
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use(
  (
    error: Error,
    req: express.Request,
    res: express.Response
    // _next: express.NextFunction
  ) => {
    console.error('❌ MCP API Error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
);

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
});

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

startServer().catch((error) => {
  console.error('❌ 启动服务器失败:', error);
  process.exit(1);
});
