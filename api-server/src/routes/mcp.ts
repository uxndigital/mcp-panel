import { createStreamableHttpRouter } from '@uxndigital/mcp-server';
import express from 'express';

import { mcpManager } from '@/services/mcp-manager.js';

const routerMap = new Map<string, express.Router>();

const mcpRouter = (req, res, next) => {
  const mcpName = req.params.mcpName;
  const path = req.path;

  console.log(`MCP 请求: ${req.method} /${mcpName}${path}`);

  const endpoint = `/${mcpName}/mcp`;
  const mcpServer = mcpManager.getMcpServer(endpoint);

  if (mcpServer) {
    let router = routerMap.get(endpoint);
    if (!router) {
      router = createStreamableHttpRouter({
        server: mcpServer as any,
        unmount: () => {
          routerMap.delete(endpoint);
        }
      });
      routerMap.set(endpoint, router);
    }
    return router(req, res, next);
  }

  next();
};

export default mcpRouter;
