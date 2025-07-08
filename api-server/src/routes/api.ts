import express, { type RequestHandler, type Router } from 'express';

import { mcpManager } from '@/services/mcp-manager.js';

const router: Router = express.Router();

// MCP 管理 API
router.post('/mcp/install', (async (req, res, next) => {
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
router.delete('/mcp/uninstall/:mcpName', async (req, res, next) => {
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
router.put('/mcp/update/:mcpName', (req, res, next) => {
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
router.get('/mcp/list', (_req, res) => {
  const mcpInfo = mcpManager.getAllMcpInfo();

  console.log(`📋 获取 MCP 列表: ${mcpInfo.length} 个 MCP`);

  res.json({ mcps: mcpInfo });
});

export default router;
