# MCP Panel

一个用于管理 Model Context Protocol (MCP) 服务的现代化管理面板，支持通过 GitHub 仓库一键安装、升级和管理 MCP 服务。

## ✨ 功能特性
- 🚀 一键安装 MCP 服务（支持 GitHub URL）
- 🔄 智能检测并升级 MCP 到最新版本
- 🗑️ 安全卸载 MCP 服务及依赖
- 📊 元数据跟踪（Git URL、版本、提交哈希、安装时间）
- 🔌 独立端点：为每个 MCP 提供独立 HTTP 访问
- 🎨 现代化 React UI
- ⚡ PM2 生产部署支持
- 🛠️ 依赖隔离，避免冲突

## 📁 目录结构
```
mcp-panel/
├── api-server/      # 后端 Express API 服务
│   ├── src/
│   │   ├── index.ts         # API 服务入口
│   │   └── services/
│   │       └── mcp-manager.ts
│   ├── package.json
│   └── tsconfig.json
├── repo-cache/      # MCP 实例仓库存储
├── web-app/         # 前端 React 应用
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── ecosystem.config.cjs  # PM2 配置
├── package.json          # 根目录配置
└── pnpm-lock.yaml        # 锁定依赖
```

## 🚀 快速开始

### 环境要求
- Node.js 18+
- pnpm 8+
- PM2（可选，生产部署）

### 安装依赖
```bash
pnpm install
```

### 启动开发环境
同时启动后端和前端：
```bash
pnpm run dev
```
- API 服务: http://localhost:9800
- 前端应用: http://localhost:9801

### 单独启动
```bash
# 只启动 API 服务
cd api-server && pnpm run dev

# 只启动前端
cd web-app && pnpm run dev
```

### 构建与生产部署
推荐使用 PM2：
```bash
pnpm run build      # 构建前后端
pnpm start          # 使用 PM2 启动
```

## 🛠️ 常用命令
```bash
pnpm install           # 安装所有依赖
pnpm run dev           # 开发模式（前后端）
pnpm run build         # 构建所有项目
pnpm run lint          # 代码检查
pnpm start             # PM2 启动
```

## 📚 API 端点
| 方法   | 路径                        | 说明               |
|--------|-----------------------------|--------------------|
| POST   | /api/mcp/install            | 安装 MCP 服务      |
| PUT    | /api/mcp/update/{name}      | 升级 MCP 服务      |
| DELETE | /api/mcp/uninstall/{name}   | 卸载 MCP 服务      |
| GET    | /api/mcp/list               | 获取已安装列表     |
| GET    | /health                     | 健康检查           |

每个 MCP 服务会有独立端点：
- `POST/GET /{mcpName}/mcp` 与指定 MCP 通信

## 🏗️ 技术栈
- 前端：React 19, Vite, TypeScript, Linaria
- 后端：Express, TypeScript
- 包管理：pnpm
- 进程管理：PM2

## 🧩 示例：自定义 MCP Server 工具

你可以基于 `@modelcontextprotocol/sdk/server/mcp.js` 快速注册自定义自动化工具。例如，注册一个 Puppeteer 浏览器自动化工具：

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({
  name: "test-mcp",
  version: "1.0.0",
  command: "test",
});

// 注册一个“navigate”工具
server.tool(
  "test",
  {
    pageId: z.string().describe("唯一页面标识符"),
    url: z.string().url().describe("要导航到的URL"),
  },
  async (args) => {
    return { content: [{ type: "text", text: "Hello word" }] };
  }
);

export default server;
```

你可以通过 `server.tool` 注册任意自动化能力，参数和返回值均支持类型校验和描述。

## 🤝 贡献
欢迎提交 Issue 和 PR！

## 📝 许可证
MIT License
