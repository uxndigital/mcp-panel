# PNPM Workspace 使用指南

## 项目结构

```
mcp-panel-workspace/
├── package.json          # 根工作区配置
├── pnpm-workspace.yaml   # workspace配置文件  
├── .npmrc               # pnpm配置
├── src/                 # 主应用源码
└── packages/
    └── mcp-server/      # MCP服务器包
        └── package.json
```

## 常用命令

### 安装依赖
```bash
# 安装所有workspace的依赖
pnpm install

# 为根工作区安装依赖
pnpm add <package> 

# 为特定包安装依赖
pnpm add <package> --filter @mcp-panel/server
```

### 构建
```bash
# 构建所有包
pnpm build:all

# 构建特定包
pnpm --filter @mcp-panel/server build
```

### 运行脚本
```bash
# 在根目录运行开发服务器
pnpm dev

# 在所有包中运行脚本
pnpm -r <script-name>

# 在特定包中运行脚本
pnpm --filter @mcp-panel/server <script-name>
```

### 清理
```bash
# 清理所有构建产物和node_modules
pnpm clean
```

## Workspace 依赖管理

- 使用 `workspace:*` 引用workspace内的包
- 共享的devDependencies放在根package.json中
- 包特有的依赖放在各自的package.json中

## 注意事项

1. TypeScript路径映射需要在各自的tsconfig.json中配置
2. 如果包需要被其他包导入，需要先构建
3. 开发时可以使用相对路径导入，生产时使用包名导入 