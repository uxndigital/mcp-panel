import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import express from "express";
import { McpManager } from "./src/services/mcp-manager.js";
import { Server } from "./packages/mcp-server/src/streamable-http.js";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 自定义插件，集成 Express API 服务器
    {
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
          if (mcpName) {
            const endpoint = `/mcp/${mcpName}`;
            const mcpServer = mcpManager.getMcpServer(endpoint);
            if (mcpServer) {
              // 这里需要你的 Server 类来处理 MCP 请求
              // 暂时返回一个简单的响应
              // res.json({ message: `MCP ${mcpName} endpoint`, path: req.path, fullEndpoint: endpoint })
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
        app.post("/api/mcp/install", async (req, res, next) => {
          try {
            const { githubUrl } = req.body;
            if (!githubUrl) {
              return res.status(400).json({ error: "GitHub URL is required" });
            }
            const endpoint = await mcpManager.installMcp(githubUrl);
            res.json({ endpoint });
          } catch (error) {
            next(error);
          }
        });

        // 使用中间件方式处理卸载路由
        app.use("/api/mcp/uninstall", (req, res, next) => {
          if (req.method === "DELETE") {
            const fullPath = req.path;
            // 移除开头的 '/' 如果存在
            const endpointPath = fullPath.startsWith("/")
              ? fullPath
              : "/" + fullPath;
            const endpoint = "/mcp" + endpointPath;

            mcpManager
              .uninstallMcp(endpoint)
              .then(() => res.json({ success: true }))
              .catch(next);
          } else {
            next();
          }
        });

        app.get("/api/mcp/list", (req, res) => {
          const endpoints = mcpManager.getAllEndpoints();
          res.json({ endpoints });
        });

        // 错误处理中间件
        app.use((error: any, req: any, res: any, next: any) => {
          console.error("API Error:", error);
          res
            .status(500)
            .json({ error: error.message || "Internal server error" });
        });

        // 将 Express app 作为中间件添加到 Vite 开发服务器
        server.middlewares.use(app);
      },
    },
  ],
  server: {
    port: 9904,
    host: true,
  },
});
