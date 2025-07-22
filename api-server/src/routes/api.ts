import dotenv from 'dotenv';
import express, { type RequestHandler, type Router } from 'express';
import fs from 'fs';
import path from 'path';

import { mcpManager } from '@/services/mcp-manager.js';

const router: Router = express.Router();

// 通用加载 repo-cache 下所有 mcp 的 .env 环境变量
const repoCacheDir = path.resolve(import.meta.dirname, '../../repo-cache');
if (fs.existsSync(repoCacheDir)) {
  const mcpDirs = fs
    .readdirSync(repoCacheDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
  mcpDirs.forEach((mcpName) => {
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

// 获取 MCP 的 .env 文件内容
router.get('/mcp/env/:mcpName', ((req, res) => {
  const mcpName = req.params.mcpName;
  const envPath = path.join(repoCacheDir, String(mcpName), '.env');
  if (!fs.existsSync(envPath)) {
    return res.json({ env: {} });
  }
  try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envObj = {};
    envContent.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1] ?? '';
        let value = match[2] ?? '';
        // 去除包裹的引号
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
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
router.post('/mcp/env/:mcpName', ((req, res) => {
  const mcpName = req.params.mcpName;
  const envPath = path.join(repoCacheDir, String(mcpName), '.env');
  const envObj = req.body.env || {};
  try {
    const envContent = Object.entries(envObj)
      .map(
        ([key, value]) =>
          `${key}=${typeof value === 'string' ? value.replace(/\n/g, '\\n') : ''}`
      )
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

export default router;
