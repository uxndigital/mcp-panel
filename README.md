# MCP Panel

一个用于管理 Model Context Protocol (MCP) 服务器的管理面板。

## 项目结构

```
mcp-panel/
├── packages/
│   ├── api-server/          # Express API 服务器
│   │   ├── src/
│   │   │   ├── index.ts     # API 服务器入口
│   │   │   ├── services/    # MCP 管理服务
│   │   │   └── mcp/         # MCP 实例存储
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── web-app/             # React 前端应用
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── index.html
│   └── mcp-server/          # MCP 服务器核心
├── package.json             # 根目录配置
└── pnpm-workspace.yaml     # pnpm workspace 配置
```

## 功能特性

- 🚀 通过 GitHub URL 安装 MCP 服务器
- 🗑️ 卸载已安装的 MCP 服务器
- 📋 查看所有已安装的 MCP 端点
- 🔌 为每个 MCP 提供独立的 HTTP 端点
- 🌐 现代化的 React 前端界面

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式（同时启动 API 和前端）

```bash
pnpm run dev
```

这将启动：
- API 服务器: `http://localhost:3001`
- 前端应用: `http://localhost:9904`

### 单独启动服务

```bash
# 只启动 API 服务器
pnpm run dev:api

# 只启动前端应用
pnpm run dev:web
```

### 生产构建

```bash
# 构建所有项目
pnpm run build

# 启动生产环境
pnpm run start
```

## API 端点

### MCP 管理 API

- `POST /api/mcp/install` - 安装 MCP 服务器
- `DELETE /api/mcp/uninstall/{name}` - 卸载 MCP 服务器
- `GET /api/mcp/list` - 获取已安装的 MCP 列表
- `GET /health` - 健康检查

### MCP 服务端点

每个安装的 MCP 服务器都会有一个独立的端点：
- `POST /mcp/{name}` - 与特定 MCP 服务器通信

## 开发命令

```bash
# 安装所有依赖
pnpm install:all

# 开发模式（并发启动）
pnpm run dev

# 单独启动 API 服务器
pnpm run dev:api

# 单独启动前端应用
pnpm run dev:web

# 构建所有项目
pnpm run build

# 启动生产环境
pnpm run start

# 代码检查
pnpm run lint

# 清理构建文件
pnpm run clean
```

## 技术栈

### API 服务器
- **Node.js** + **TypeScript**
- **Express.js** - Web 框架
- **@modelcontextprotocol/sdk** - MCP SDK

### 前端应用
- **React 19** + **TypeScript**
- **Vite** - 构建工具
- **现代化 UI** - 响应式设计

## 架构说明

1. **API 服务器** (`packages/api-server`): 
   - 处理 MCP 的安装、卸载和管理
   - 为每个 MCP 提供 HTTP 端点
   - 使用 Express.js 构建 RESTful API

2. **前端应用** (`packages/web-app`):
   - React 单页应用
   - 通过 Vite 代理与 API 服务器通信
   - 提供用户友好的管理界面

3. **MCP 服务器** (`packages/mcp-server`):
   - MCP 协议的核心实现
   - 处理与 MCP 实例的通信

## 配置

### 环境变量

API 服务器支持以下环境变量：

```bash
PORT=3001  # API 服务器端口
```

### 端口配置

- API 服务器默认端口: `3001`
- 前端应用默认端口: `9904`
- 前端会自动代理 `/api` 和 `/mcp` 请求到 API 服务器
