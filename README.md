# MCP Panel

一个用于管理 Model Context Protocol (MCP) 服务器的现代化管理面板，支持通过 GitHub 仓库安装、更新和管理 MCP 服务器。

## ✨ 功能特性

- 🚀 **一键安装** - 通过 GitHub URL 快速安装 MCP 服务器
- 🔄 **智能更新** - 自动检测并更新 MCP 到最新版本
- 🗑️ **安全卸载** - 完全移除 MCP 服务器及其依赖
- 📊 **元数据跟踪** - 记录 Git URL、版本、提交哈希、安装时间
- 🔌 **独立端点** - 为每个 MCP 提供独立的 HTTP 端点
- 🎨 **现代化 UI** - 基于 React 的美观管理界面
- ⚡ **PM2 部署** - 生产级进程管理和监控
- 🔧 **依赖隔离** - 每个 MCP 独立管理依赖，避免冲突

## 📁 项目结构

```
mcp-panel/
├── api-server/              # Express API 服务器
│   ├── src/
│   │   ├── index.ts         # API 服务器入口
│   │   └── services/        # MCP 管理服务
│   │       └── mcp-manager.ts
│   ├── package.json
│   └── tsconfig.json
├── repo-cache/             # MCP 实例存储目录
├── web-app/                 # React 前端应用
│   ├── src/
│   │   ├── App.tsx          # 主应用组件
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
├── packages/
│   └── mcp-server/          # MCP 服务器核心库
├── ecosystem.config.cjs     # PM2 配置文件
├── package.json             # 根目录配置
└── pnpm-workspace.yaml     # pnpm workspace 配置
```

## 🚀 快速开始

### 环境要求

- Node.js 18+ 
- pnpm 8+
- PM2 (可选，用于生产部署)

### 安装依赖

```bash
pnpm install
```

### 开发模式

同时启动 API 服务器和前端应用：

```bash
pnpm run dev
```

这将启动：
- API 服务器: `http://localhost:9800`
- 前端应用: `http://localhost:9801` (开发模式)

单独启动服务：

```bash
# 只启动 API 服务器
pnpm run dev:api

# 只启动前端应用  
pnpm run dev:web
```

### 生产部署

#### 方式一：使用 PM2（推荐）

```bash
# 构建项目
pnpm run build

# 使用 PM2 启动
pnpm start

# 查看运行状态
pnpm run monitor:pm2

# 查看日志
pnpm run logs:pm2

# 停止服务
pnpm run stop:pm2

# 重启服务
pnpm run restart:pm2
```

#### 方式二：传统启动

```bash
# 构建项目
pnpm run build

# 启动服务
pnpm run start:all
```

## 📋 API 端点

### MCP 管理 API

| 方法 | 端点 | 描述 |
|------|------|------|
| `POST` | `/api/mcp/install` | 安装 MCP 服务器 |
| `PUT` | `/api/mcp/update/{name}` | 更新 MCP 服务器 |
| `DELETE` | `/api/mcp/uninstall/{name}` | 卸载 MCP 服务器 |
| `GET` | `/api/mcp/list` | 获取已安装的 MCP 列表 |
| `GET` | `/health` | 健康检查 |

### MCP 服务端点

每个安装的 MCP 服务器都有独立的端点：
- `POST/GET` `/{mcpName}/mcp` - 与特定 MCP 服务器通信

## 🎯 使用方法

### 1. 安装 MCP 服务器

在前端界面中输入 GitHub 仓库 URL，例如：
```
https://github.com/example/my-mcp-server
```

系统会自动：
- 克隆仓库代码
- 安装依赖并构建
- 记录 Git 元数据（提交哈希、版本、安装时间）
- 创建独立的端点 `/my-mcp-server/mcp`

### 2. 更新 MCP 服务器

点击 MCP 卡片上的"更新"按钮：
- 自动拉取最新代码
- 检查是否有更新
- 重新构建并热重载
- 更新元数据信息
- 如果更新失败会自动回滚

### 3. 管理 MCP 服务器

每个 MCP 卡片显示：
- 📛 **名称和版本** - 显示项目名称和版本标签
- 🔗 **Git URL** - 可点击的源代码链接  
- 📝 **提交信息** - 当前运行的提交哈希
- 📅 **安装时间** - 首次安装或最后更新时间
- 🌐 **API 端点** - 服务器访问地址

## 🔧 开发命令

```bash
# 安装所有依赖
pnpm install:all

# 开发模式（热重载）
pnpm run dev

# 构建所有项目  
pnpm run build

# 代码检查
pnpm run lint

# 清理构建文件
pnpm run clean

# PM2 管理
pnpm run start:pm2    # 启动
pnpm run stop:pm2     # 停止  
pnpm run restart:pm2  # 重启
pnpm run delete:pm2   # 删除
pnpm run logs:pm2     # 查看日志
pnpm run monitor:pm2  # 监控面板
```

## 📦 PM2 配置

项目包含完整的 PM2 配置文件 `ecosystem.config.cjs`：

- **自动重启** - 进程崩溃时自动重启
- **内存监控** - 超过限制自动重启
- **日志管理** - 自动分割和管理日志文件
- **多实例** - 支持集群模式（可配置）
- **环境变量** - 支持开发和生产环境

## 🛠️ 技术栈

### 后端
- **Node.js** + **TypeScript** - 现代 JavaScript 运行时
- **Express.js** - Web 框架
- **@modelcontextprotocol/sdk** - MCP 官方 SDK
- **pnpm** - 高效的包管理器

### 前端  
- **React 19** - 用户界面库
- **TypeScript** - 类型安全
- **Vite** - 快速构建工具
- **现代化 CSS** - 响应式设计

### 部署
- **PM2** - 生产级进程管理
- **pnpm Workspaces** - Monorepo 管理
- **独立依赖** - 每个 MCP 项目隔离依赖

## 🔒 安全特性

- **依赖隔离** - 每个 MCP 使用独立的 node_modules
- **权限管理** - 安全的文件系统操作
- **错误处理** - 完善的错误恢复机制
- **回滚支持** - 更新失败自动回滚到上一版本

## 📝 注意事项

1. **Git 仓库要求** - MCP 项目必须是有效的 Git 仓库
2. **构建脚本** - MCP 项目需要包含 `build` 脚本
3. **入口文件** - 构建后需要 `dist/src/index.js` 文件
4. **端口配置** - API 服务器默认端口 9800，前端端口 9801
5. **存储位置** - MCP 安装在 `repo-cache/` 目录

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 🚀 GitHub Workflows

项目包含完整的 CI/CD 流水线：

### CI 流水线 (`.github/workflows/ci.yml`)
- **触发时机**: Push 到 main/develop 分支或 Pull Request
- **检查内容**:
  - 🔍 代码风格检查 (ESLint)
  - 🏗️ TypeScript 类型检查
  - 📦 项目构建验证
  - 🔧 PM2 配置验证
  - 🔒 安全审计
  - 📁 项目结构验证

### 生产部署 (`.github/workflows/production-mcp.yml`)
- **触发时机**: Push 到 main 分支
- **部署流程**:
  - 📥 代码同步和依赖安装
  - 🏗️ 项目构建
  - 🚀 PM2 部署
  - 📊 应用状态监控
  - 💚 健康检查
  - 📝 部署结果总结

### 定期维护 (`.github/workflows/maintenance.yml`)
- **触发时机**: 每周日凌晨 2 点自动运行
- **维护内容**:
  - 📦 依赖更新检查
  - 🔒 安全漏洞扫描
  - 💚 生产环境健康检查
  - 🗑️ 日志清理
  - 💻 系统资源监控
  - 💾 备份状态检查

### 环境变量配置

需要在 GitHub Repository Settings 中配置：

#### Secrets
- `SERVER_USERNAME`: 服务器用户名

#### Variables  
- `DEPLOY_ROOT`: 部署根目录路径
- `BASE_PATH`: 应用基础路径（可选）

## �� 许可证

MIT License
