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
          const endpoint = `/${dir.name}/mcp`;
          
          // 注册 MCP 服务器
          this.mcpServers.set(endpoint, server);
          this.mcpEndpoints.set(endpoint, mcpDir);
          
          console.log(`✅ 已加载 MCP: ${dir.name}`);
        } catch (error) {
          console.warn(`⚠️ 发现无效的 MCP 目录: ${dir.name}，正在清理...`);
          
          // 自动清理无效的目录
          try {
            await fs.rm(mcpDir, { recursive: true, force: true });
            console.log(`🧹 已清理无效目录: ${mcpDir}`);
          } catch (cleanupError) {
            console.error(`❌ 清理目录失败: ${mcpDir}`, cleanupError);
            // 尝试使用系统命令
            try {
              await execAsync(`rm -rf "${mcpDir}"`);
              console.log(`🧹 已通过系统命令清理目录: ${mcpDir}`);
            } catch (systemError) {
              console.error(`❌ 系统命令清理也失败: ${mcpDir}`, systemError);
            }
          }
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

      // 使用 --ignore-workspace 标志独立安装依赖
      await execAsync(`cd ${mcpDir} && pnpm install --ignore-workspace && pnpm run build`);
      console.log(`📦 已安装并构建 MCP: ${repoName}`);
      
      // 清理不需要的文件
      await execAsync(`rm -rf ${mcpDir}/src ${mcpDir}/server ${mcpDir}/.github`);

      // 动态导入 MCP 服务器
      const mcpModule = await import(path.join(mcpDir, 'dist/src/index.js'));
      const server = mcpModule.default;

      // 生成唯一的端点路径
      const endpoint = `/${repoName}/mcp`;
      
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
    console.log(`🔧 开始卸载 MCP: ${endpoint}`);
    const mcpDir = this.mcpEndpoints.get(endpoint);
    
    if (!mcpDir) {
      throw new Error(`未找到端点 ${endpoint} 对应的 MCP 目录`);
    }

    console.log(`📍 目标目录: ${mcpDir}`);

    try {
      // 先从内存中移除引用
      this.mcpServers.delete(endpoint);
      this.mcpEndpoints.delete(endpoint);
      console.log(`🧠 已从内存中移除 MCP 引用`);
      
      // 检查目录是否存在
      try {
        await fs.access(mcpDir);
        console.log(`📁 确认目录存在，开始删除...`);
        
        // 方法1: 尝试使用 Node.js fs.rm
        try {
          // 先尝试修复目录权限，确保所有文件都可删除
          try {
            await execAsync(`chmod -R 755 "${mcpDir}"`);
            console.log(`🔓 已修复目录权限`);
          } catch (chmodError) {
            console.warn(`⚠️ 修复权限失败:`, chmodError);
          }
          
          await fs.rm(mcpDir, { recursive: true, force: true });
          console.log(`🗑️ fs.rm 删除完成`);
        } catch (fsError) {
          console.warn(`⚠️ fs.rm 删除失败:`, fsError);
        }
        
        // 验证删除结果，如果还存在则使用系统命令
        try {
          await fs.access(mcpDir);
          console.warn(`⚠️ 目录仍然存在，尝试系统命令删除`);
          
          // 方法2: 使用系统命令强制删除
          await execAsync(`rm -rf "${mcpDir}"`);
          console.log(`🔨 系统命令删除完成`);
          
          // 再次验证
          try {
            await fs.access(mcpDir);
            console.error(`❌ 系统命令删除后目录仍然存在!`);
            throw new Error(`无法完全删除目录: ${mcpDir}`);
          } catch {
            console.log(`✅ 系统命令删除成功验证`);
          }
        } catch {
          console.log(`✅ fs.rm 删除成功验证`);
        }
        
      } catch {
        // 目录不存在，这是我们想要的结果
        console.log(`ℹ️ 目录不存在，无需删除`);
      }
      
      console.log(`✅ 成功卸载 MCP: ${endpoint}`);
    } catch (error) {
      console.error(`❌ 卸载 MCP 失败: ${endpoint}`, error);
      
      // 删除失败，恢复内存映射
      if (mcpDir) {
        this.mcpEndpoints.set(endpoint, mcpDir);
        console.log(`🔄 已恢复内存映射`);
      }
      throw error;
    }
  }

  getMcpServer(endpoint: string): McpServer | undefined {
    return this.mcpServers.get(endpoint);
  }

  getAllEndpoints(): string[] {
    return Array.from(this.mcpEndpoints.keys());
  }
} 