import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const execAsync = promisify(exec);

export class McpManager {
  private mcpServers: Map<string, McpServer> = new Map();
  private mcpEndpoints: Map<string, string> = new Map();
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), 'src', 'mcp');
    // 如果目录不存在则创建
    fs.mkdir(this.baseDir, { recursive: true }).catch(() => {});
  }

  async initialize(): Promise<void> {
    try {
      // 读取 mcp 目录下的所有文件夹
      const entries = await fs.readdir(this.baseDir, { withFileTypes: true });
      const mcpDirs = entries.filter(entry => entry.isDirectory());

      // 遍历每个 MCP 目录
      for (const dir of mcpDirs) {
        const mcpDir = path.join(this.baseDir, dir.name);
        try {
          // 检查是否存在 index.ts 或 index.js
          const indexPath = path.join(mcpDir, 'dist/src/index.ts');
          const indexJsPath = path.join(mcpDir, 'dist/src/index.js');
          
          let modulePath: string;
          try {
            await fs.access(indexPath);
            modulePath = indexPath;
          } catch {
            try {
              await fs.access(indexJsPath);
              modulePath = indexJsPath;
            } catch {
              throw new Error('找不到 index.ts 或 index.js 文件');
            }
          }
          
          // 动态导入 MCP 服务器
          const mcpModule = await import(modulePath);
          const server = mcpModule.default;

          // 生成端点路径
          const endpoint = `/mcp/${dir.name}`;
          
          // 注册 MCP 服务器
          this.mcpServers.set(endpoint, server);
          this.mcpEndpoints.set(endpoint, mcpDir);
          
          console.log(`✅ 已加载 MCP: ${dir.name}`);
        } catch (error) {
          console.warn(`⚠️ 跳过无效的 MCP 目录: ${dir.name}`, error);
        }
      }
    } catch (error) {
      console.error('初始化 MCP 管理器时出错:', error);
      throw error;
    }
  }

  async installMcp(githubUrl: string): Promise<string> {
    try {
      // 从 GitHub URL 提取仓库名称
      const repoName = githubUrl.split('/').pop()?.replace('.git', '') || '';
      const mcpDir = path.join(this.baseDir, repoName);

      // 克隆仓库
      await execAsync(`git clone ${githubUrl} ${mcpDir}`);

      // 安装依赖
      await execAsync(`cd ${mcpDir} && pnpm install && pnpm run build`);

      await execAsync(`rm -rf ${mcpDir}/src ${mcpDir}/server ${mcpDir}/.github`);

      // 动态导入 MCP 服务器
      const mcpModule = await import(path.join(mcpDir, 'dist/src/index.js'));
      const server = mcpModule.default;

      // 生成唯一的端点路径
      const endpoint = `/mcp/${repoName}`;
      
      // 注册 MCP 服务器
      this.mcpServers.set(endpoint, server);
      this.mcpEndpoints.set(endpoint, mcpDir);

      return endpoint;
    } catch (error) {
      console.error('Error installing MCP:', error);
      throw error;
    }
  }

  async uninstallMcp(endpoint: string): Promise<void> {
    console.log(endpoint, 'endpoint');
    const mcpDir = this.mcpEndpoints.get(endpoint);
    console.log(mcpDir, 'mcpDir');
    if (mcpDir) {
      try {
        // 删除目录
        await fs.rm(mcpDir, { recursive: true, force: true });
        this.mcpServers.delete(endpoint);
        this.mcpEndpoints.delete(endpoint);
      } catch (error) {
        console.error('Error uninstalling MCP:', error);
        throw error;
      }
    }
  }

  getMcpServer(endpoint: string): McpServer | undefined {
    return this.mcpServers.get(endpoint);
  }

  getAllEndpoints(): string[] {
    return Array.from(this.mcpEndpoints.keys());
  }
} 