import { Server } from '@uxndigital/mcp-server';
import cors from 'cors';
import type { RequestHandler } from 'express';
import express from 'express';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { McpManager } from './services/mcp-manager.js';

const app = express();
const PORT = Number(process.env.PORT) || 9800;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 通用加载 repo-cache 下所有 mcp 的 .env 环境变量
const repoCacheDir = path.resolve(__dirname, '../repo-cache');
if (fs.existsSync(repoCacheDir)) {
  const mcpDirs = fs.readdirSync(repoCacheDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  mcpDirs.forEach(mcpName => {
    const envPath = path.join(repoCacheDir, mcpName, '.env');
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      console.log(`✅ 已加载 ${mcpName} 的 .env 环境变量:`, envPath);
    } else {
      console.log(`ℹ️ 未找到 ${mcpName} 的 .env 文件:`, envPath);
    }
  });
} else {
  console.log('ℹ️ 未找到 repo-cache 目录:', repoCacheDir);
}

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

// 在开发环境中：__dirname 是 src/
// 在构建后：__dirname 是 dist/api-server/src/
// 需要找到与 dist 同级的 cache 文件夹
const cache = path.resolve(__dirname, '..', 'cache');

console.log('📁 Cache 目录路径:', cache);
console.log('📁 Cache 目录是否存在:', fs.existsSync(cache));

app.use('/cache', express.static(cache));

// MCP 动态路由处理 - 使用具体的路由模式
app.use('/:mcpName/mcp', (req, res, next) => {
  const mcpName = req.params.mcpName;

  console.log(`MCP 请求: ${req.method} /${mcpName}/mcp`);

  if (mcpName) {
    const endpoint = `/${mcpName}/mcp`;
    const mcpServer = mcpManager.getMcpServer(endpoint);

    if (mcpServer) {
      const serverInstance = new Server(mcpServer as any);

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
app.post('/api/mcp/install', (async (req, res, next) => {
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
  } finally {
    return;
  }
}) as RequestHandler);

// 卸载 MCP - 使用具体的DELETE路由
app.delete('/api/mcp/uninstall/:mcpName', async (req, res, next) => {
  const mcpName = req.params.mcpName;
  console.log(mcpName, 'mcpName');

  const endpoint = `/${mcpName}/mcp`;
  console.log(`🗑️ 卸载 MCP: ${endpoint}`);

  await mcpManager
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
app.get('/api/mcp/list', (_req, res) => {
  const mcpInfo = mcpManager.getAllMcpInfo();

  console.log(`📋 获取 MCP 列表: ${mcpInfo.length} 个 MCP`);

  res.json({ mcps: mcpInfo });
});

// 获取 MCP 的 .env 文件内容
app.get('/api/mcp/env/:mcpName', ((req, res) => {
  const mcpName = req.params.mcpName;
  const envPath = path.join(repoCacheDir, String(mcpName), '.env');
  if (!fs.existsSync(envPath)) {
    return res.json({ env: {} });
  }
  try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envObj = {};
    envContent.split(/\r?\n/).forEach(line => {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1] ?? '';
        let value = match[2] ?? '';
        // 去除包裹的引号
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        (envObj as Record<string, string>)[String(key)] = String(value);
      }
    });
    res.json({ env: envObj });
    return;
  } catch (e) {
    res.status(500).json({ error: '读取 env 文件失败' });
    return;
  }
}) as RequestHandler);

// 保存 MCP 的 .env 文件内容
app.post('/api/mcp/env/:mcpName', ((req, res) => {
  const mcpName = req.params.mcpName;
  const envPath = path.join(repoCacheDir, String(mcpName), '.env');
  const envObj = req.body.env || {};
  try {
    const envContent = Object.entries(envObj)
      .map(([key, value]) => `${key}=${typeof value === 'string' ? value.replace(/\n/g, '\\n') : ''}`)
      .join('\n');
    fs.writeFileSync(envPath, envContent, 'utf-8');
    res.json({ success: true });
    setTimeout(() => process.exit(0), 100);
    return;
  } catch (e) {
    res.status(500).json({ error: '写入 env 文件失败' });
    return;
  }
}) as RequestHandler);

// 健康检查端点
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response
    // _next: express.NextFunction
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
