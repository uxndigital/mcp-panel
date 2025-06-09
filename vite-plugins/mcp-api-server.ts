import express from "express";
import type { Plugin } from "vite";
import { McpManager } from "../src/services/mcp-manager.js";
import { Server } from "../packages/mcp-server/src/streamable-http.js";

export interface McpApiServerPluginOptions {
  // 可以添加一些配置选项
  baseUrl?: string;
  enableLogging?: boolean;
}

export function mcpApiServerPlugin(
  options: McpApiServerPluginOptions = {}
): Plugin {
  const { baseUrl = "/api", enableLogging = true } = options;

  return {
    name: "mcp-api-server",
    configureServer(server) {
      // 创建 Express 应用
      const app = express();
      app.use(express.json());

      // 创建 MCP 管理器实例
      const mcpManager = new McpManager();

      // 初始化 MCP 管理器
      mcpManager.initialize().catch((error) => {
        console.error("初始化 MCP 管理器失败:", error);
      });

      // MCP 动态路由处理
      app.use("/mcp", (req, res, next) => {
        const path = req.path;
        const mcpName = path.split("/")[1]; // 因为已经在 /mcp 路由下了
        
        if (enableLogging) {
          console.log(`MCP 请求: ${req.method} ${req.path}`);
        }

        if (mcpName) {
          const endpoint = `/mcp/${mcpName}`;
          const mcpServer = mcpManager.getMcpServer(endpoint);
          
          if (mcpServer) {
            const serverInstance = new Server(mcpServer);
            
            if (req.method === "POST") {
              serverInstance.handlePostRequest(req, res).catch(next);
              return;
            } else if (req.method === "GET") {
              serverInstance.handleGetRequest(req, res).catch(next);
              return;
            }
            return;
          }
        }
        next();
      });

      // MCP 管理 API
      app.post(`${baseUrl}/mcp/install`, async (req, res, next) => {
        try {
          const { githubUrl } = req.body;
          if (!githubUrl) {
            return res.status(400).json({ error: "GitHub URL is required" });
          }
          
          if (enableLogging) {
            console.log(`安装 MCP: ${githubUrl}`);
          }
          
          const endpoint = await mcpManager.installMcp(githubUrl);
          res.json({ endpoint });
        } catch (error) {
          next(error);
        }
      });

      // 使用中间件方式处理卸载路由
      app.use(`${baseUrl}/mcp/uninstall`, (req, res, next) => {
        if (req.method === "DELETE") {
          const fullPath = req.path;
          // 移除开头的 '/' 如果存在
          console.log(fullPath, 'fullPath');
          const endpointPath = fullPath.startsWith("/")
          ? fullPath
          : "/" + fullPath;
          console.log(endpointPath, 'endpointPath');
          const endpoint = "/mcp" + endpointPath;

          if (enableLogging) {
            console.log(`卸载 MCP: ${endpoint}`);
          }

          mcpManager
            .uninstallMcp(endpoint)
            .then(() => res.json({ success: true }))
            .catch(next);
        } else {
          next();
        }
      });

      // 获取所有 MCP 端点列表
      app.get(`${baseUrl}/mcp/list`, (req, res) => {
        const endpoints = mcpManager.getAllEndpoints();
        
        if (enableLogging) {
          console.log(`获取 MCP 列表: ${endpoints.length} 个端点`);
        }
        
        res.json({ endpoints });
      });

      // 错误处理中间件
      app.use((error: any, req: any, res: any, next: any) => {
        console.error("MCP API Error:", error);
        res
          .status(500)
          .json({ error: error.message || "Internal server error" });
      });

      // 将 Express app 作为中间件添加到 Vite 开发服务器
      server.middlewares.use(app);

      if (enableLogging) {
        console.log("MCP API Server plugin 已启动");
      }
    },
  };
} 