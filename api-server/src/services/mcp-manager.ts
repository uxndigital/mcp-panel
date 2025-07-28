import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { exec } from 'child_process';
import dotenv from 'dotenv';
import fsSync from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface McpMetadata {
  name: string;
  gitUrl: string;
  version?: string;
  commit: string;
  installDate: string;
  directory: string;
}

interface McpMetadataFile {
  [endpoint: string]: McpMetadata;
}

export class McpManager {
  private mcpServers: Map<string, McpServer> = new Map();
  private mcpEndpoints: Map<string, string> = new Map();
  private mcpMetadata: Map<string, McpMetadata> = new Map();
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), 'repo-cache');
    // 如果目录不存在则创建
    fs.mkdir(this.baseDir, { recursive: true }).catch(() => {});
    // 加载已保存的元数据
    this.loadMetadata();
  }

  async initialize(): Promise<void> {
    try {
      // 读取 mcp 目录下的所有文件夹
      const entries = await fs.readdir(this.baseDir, { withFileTypes: true });
      const mcpDirs = entries.filter((entry) => entry.isDirectory());

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

          // 加载 .env
          this.loadMcpEnv(mcpDir);

          // 生成端点路径
          const endpoint = `/${dir.name}/mcp`;

          // 注册 MCP 服务器
          this.mcpServers.set(endpoint, server);
          this.mcpEndpoints.set(endpoint, mcpDir);

          // 尝试获取已存在 MCP 的 Git 信息
          try {
            const gitInfo = await this.getGitInfo(mcpDir);
            const remoteUrl = await this.getRemoteUrl(mcpDir);
            
            // 检查是否已有保存的元数据
            const existingMetadata = this.mcpMetadata.get(endpoint);
            
            const metadata: McpMetadata = {
              name: dir.name,
              gitUrl: remoteUrl,
              version: gitInfo.version,
              commit: gitInfo.commit,
              installDate: existingMetadata?.installDate || 'unknown', // 使用已保存的安装时间
              directory: mcpDir
            };
            this.mcpMetadata.set(endpoint, metadata);
          } catch (error) {
            console.warn(`无法获取 ${dir.name} 的 Git 信息:`, error);
            // 检查是否已有保存的元数据
            const existingMetadata = this.mcpMetadata.get(endpoint);
            
            // 创建基本元数据
            const metadata: McpMetadata = {
              name: dir.name,
              gitUrl: 'unknown',
              version: undefined,
              commit: 'unknown',
              installDate: existingMetadata?.installDate || 'unknown',
              directory: mcpDir
            };
            this.mcpMetadata.set(endpoint, metadata);
          }

          console.log(`✅ 已加载 MCP: ${dir.name}`);
        } catch {
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
    // 备份目录路径
    const backupDir: string | null = null;
    let installSuccess = false;
    
    // 标准化 GitHub URL 格式
    const normalizedUrl = this.normalizeGitHubUrl(githubUrl);
    
    // 从 GitHub URL 提取仓库名称
    const repoName = this.extractRepoName(normalizedUrl);
    const mcpDir = path.join(this.baseDir, repoName);

    // 生成唯一的临时目录
    const tmpDir = path.join(this.baseDir, `.tmp-${repoName}-${Date.now()}`);

    console.log(`🔄 开始安装 MCP: ${repoName}`);
    console.log(`📥 使用 URL: ${normalizedUrl}`);

    try {
      // 2. 克隆仓库到临时目录
      await execAsync(`git clone ${normalizedUrl} ${tmpDir}`);

      // 获取 Git 信息（临时目录）
      const gitInfo = await this.getGitInfo(tmpDir);
      console.log(
        `📊 Git 信息: ${gitInfo.commit.substring(0, 8)} ${gitInfo.version || 'no version'}`
      );

      // 3. 在临时目录安装依赖并构建
      await execAsync(
        `cd ${tmpDir} && pnpm install --ignore-workspace && pnpm run build`
      );
      console.log(`📦 已安装并构建 MCP: ${repoName}`);

      // // 4. 清理不需要的文件
      await execAsync(
        `rm -rf ${tmpDir}/src ${tmpDir}/server ${tmpDir}/.github`
      );

      // 5. 构建成功后移动到目标目录
      // 先删除目标目录（如果存在，理论上已备份）
      try {
        await fs.rm(mcpDir, { recursive: true, force: true });
      } catch {}
      await fs.rename(tmpDir, mcpDir);

      // 动态导入 MCP 服务器
      const mcpModule = await import(path.join(mcpDir, 'dist/src/index.js'));
      const server = mcpModule.default;

      // 生成唯一的端点路径
      const endpoint = `/${repoName}/mcp`;

      // 保存元数据
      const metadata: McpMetadata = {
        name: repoName,
        gitUrl: githubUrl,
        version: gitInfo.version,
        commit: gitInfo.commit,
        installDate: new Date().toISOString(),
        directory: mcpDir
      };

      // 注册 MCP 服务器和元数据
      this.mcpServers.set(endpoint, server);
      this.mcpEndpoints.set(endpoint, mcpDir);
      this.mcpMetadata.set(endpoint, metadata);

      // 保存元数据到文件
      this.saveMetadata();

      installSuccess = true;
      console.log(`✅ 成功安装 MCP: ${endpoint}`);
      // 安装成功后重启服务
      console.log('🚀 安装完成，服务即将重启...');
      setTimeout(() => process.exit(0), 100);
      return endpoint;
    } catch (error) {
      console.error('Error installing MCP:', error);
      // 如果有备份目录，删除新目录并还原备份
      if (backupDir) {
        try {
          // 删除新目录（如果存在）
          try {
            await fs.rm(mcpDir, { recursive: true, force: true });
          } catch {}
          // 还原备份
          await fs.rename(backupDir, mcpDir);
          console.log(`♻️ 安装失败，已还原原目录: ${mcpDir}`);
        } catch (restoreErr) {
          console.error('还原原目录失败:', restoreErr);
        }
      }
      throw error;
    } finally {
      // 安装成功后删除备份
      if (installSuccess && backupDir) {
        try {
          await fs.rm(backupDir, { recursive: true, force: true });
          console.log(`🗑️ 已删除备份目录: ${backupDir}`);
        } catch (delBakErr) {
          console.warn('删除备份目录失败:', delBakErr);
        }
      }
      // 无论成功失败都清理临时目录
      try {
        await fs.rm(tmpDir, { recursive: true, force: true });
      } catch {}
    }
  }

  private async getGitInfo(
    mcpDir: string
  ): Promise<{ commit: string; version?: string }> {
    try {
      // 获取最新提交的哈希
      const { stdout: commit } = await execAsync(
        `cd ${mcpDir} && git rev-parse HEAD`
      );

      // 尝试获取版本标签
      let version: string | undefined;
      try {
        const { stdout: tagOutput } = await execAsync(
          `cd ${mcpDir} && git describe --tags --exact-match HEAD 2>/dev/null || echo ""`
        );
        if (tagOutput.trim()) {
          version = tagOutput.trim();
        }
      } catch {
        // 如果没有标签，尝试获取最近的标签
        try {
          const { stdout: nearestTag } = await execAsync(
            `cd ${mcpDir} && git describe --tags --abbrev=0 2>/dev/null || echo ""`
          );
          if (nearestTag.trim()) {
            version = `${nearestTag.trim()}+`;
          }
        } catch {
          // 忽略错误，版本保持为 undefined
        }
      }

      // 如果还没有版本，尝试从 package.json 获取
      if (!version) {
        try {
          const packageJsonPath = path.join(mcpDir, 'package.json');
          const packageJson = JSON.parse(
            await fs.readFile(packageJsonPath, 'utf-8')
          );
          if (packageJson.version) {
            version = packageJson.version;
          }
        } catch {
          // 忽略错误
        }
      }

      return {
        commit: commit.trim(),
        version
      };
    } catch (error) {
      console.warn('获取 Git 信息失败:', error);
      return {
        commit: 'unknown',
        version: undefined
      };
    }
  }

  private async getRemoteUrl(mcpDir: string): Promise<string> {
    try {
      const { stdout } = await execAsync(
        `cd ${mcpDir} && git remote get-url origin`
      );
      return stdout.trim();
    } catch (error) {
      console.warn('获取远程 URL 失败:', error);
      return 'unknown';
    }
  }

  async uninstallMcp(endpoint: string): Promise<void> {
    console.log(`🔧 开始卸载 MCP: ${endpoint}`);
    const mcpDir = this.mcpEndpoints.get(endpoint);
    const mcpMetadata = this.mcpMetadata.get(endpoint);

    if (!mcpDir) {
      throw new Error(`未找到端点 ${endpoint} 对应的 MCP 目录`);
    }

    console.log(`📍 目标目录: ${mcpDir}`);

    try {
      // 先从内存中移除引用
      this.mcpServers.delete(endpoint);
      this.mcpEndpoints.delete(endpoint);
      this.mcpMetadata.delete(endpoint);
      console.log(`🧠 已从内存中移除 MCP 引用`);

      // 保存更新后的元数据到文件
      this.saveMetadata();

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
      // 更新成功后重启服务
      console.log('🚀 更新完成，服务即将重启...');
      setTimeout(() => process.exit(0), 100);
    } catch (error) {
      console.error(`❌ 卸载 MCP 失败: ${endpoint}`, error);

      // 删除失败，恢复内存映射
      if (mcpDir) {
        this.mcpEndpoints.set(endpoint, mcpDir);
      }
      if (mcpMetadata) {
        this.mcpMetadata.set(endpoint, mcpMetadata);
      }
      console.log(`🔄 已恢复内存映射`);
      throw error;
    }
  }

  async updateMcp(endpoint: string): Promise<McpMetadata> {
    console.log(`🔄 开始更新 MCP: ${endpoint}`);
    const mcpDir = this.mcpEndpoints.get(endpoint);
    const currentMetadata = this.mcpMetadata.get(endpoint);

    if (!mcpDir || !currentMetadata) {
      throw new Error(`未找到端点 ${endpoint} 对应的 MCP`);
    }

    console.log(`📍 目标目录: ${mcpDir}`);

    let oldCommit: string = '';

    try {
      // 检查目录是否存在 Git 仓库
      try {
        await fs.access(path.join(mcpDir, '.git'));
      } catch {
        throw new Error(`MCP 目录不是 Git 仓库，无法更新: ${mcpDir}`);
      }

      // 获取当前提交哈希以备回滚
      const { stdout: currentCommit } = await execAsync(
        `cd ${mcpDir} && git rev-parse HEAD`
      );
      oldCommit = currentCommit.trim();

      console.log(`📊 当前提交: ${oldCommit.substring(0, 8)}`);

      // 拉取最新代码
      await execAsync(`cd ${mcpDir} && git fetch origin`);

      // 检查是否有更新
      const { stdout: latestCommit } = await execAsync(
        `cd ${mcpDir} && git rev-parse origin/main || git rev-parse origin/master`
      );
      const newCommit = latestCommit.trim();

      if (oldCommit === newCommit) {
        console.log(`ℹ️ MCP 已是最新版本，但会更新时间戳`);
        // 即使没有代码更新，也更新时间戳
        const updatedMetadata: McpMetadata = {
          ...currentMetadata,
          installDate: new Date().toISOString()
        };
        
        // 更新内存中的元数据
        this.mcpMetadata.set(endpoint, updatedMetadata);
        
        // 保存元数据到文件
        this.saveMetadata();
        
        console.log(`✅ 已更新时间戳: ${endpoint}`);
        return updatedMetadata;
      }

      console.log(`🆕 发现更新: ${newCommit.substring(0, 8)}`);

      // 更新到最新版本
      await execAsync(
        `cd ${mcpDir} && git reset --hard origin/main || git reset --hard origin/master`
      );

      // 重新安装依赖并构建
      await execAsync(
        `cd ${mcpDir} && pnpm install --ignore-workspace && pnpm run build`
      );
      console.log(`📦 已重新构建 MCP`);

      // 清理源代码文件（保留构建后的文件）
      await execAsync(
        `rm -rf ${mcpDir}/src ${mcpDir}/server ${mcpDir}/.github`
      );

      // 重新加载模块 - 需要清除模块缓存
      const modulePath = path.join(mcpDir, 'dist/src/index.js');

      // 重新动态导入 MCP 服务器
      const mcpModule = await import(`${modulePath}?t=${Date.now()}`); // 添加时间戳避免缓存
      const server = mcpModule.default;

      // 获取更新后的 Git 信息
      const gitInfo = await this.getGitInfo(mcpDir);

      // 更新元数据
      const updatedMetadata: McpMetadata = {
        name: currentMetadata.name,
        gitUrl: currentMetadata.gitUrl,
        version: gitInfo.version,
        commit: gitInfo.commit,
        installDate: new Date().toISOString(),
        directory: mcpDir
      };

      // 更新内存中的服务器和元数据
      this.mcpServers.set(endpoint, server);
      this.mcpMetadata.set(endpoint, updatedMetadata);

      // 保存元数据到文件
      this.saveMetadata();

      console.log(
        `✅ 成功更新 MCP: ${endpoint} (${oldCommit.substring(0, 8)} → ${newCommit.substring(0, 8)})`
      );
      console.log(`📅 更新时间: ${updatedMetadata.installDate}`);
      // 更新成功后重启服务
      console.log('🚀 更新完成，服务即将重启...');
      setTimeout(() => process.exit(0), 100);
      return updatedMetadata;
    } catch (error) {
      console.error(`❌ 更新 MCP 失败: ${endpoint}`, error);

      // 尝试回滚到之前的版本
      if (oldCommit) {
        try {
          await execAsync(`cd ${mcpDir} && git reset --hard ${oldCommit}`);
          console.log(`🔄 已回滚到之前版本`);
        } catch (rollbackError) {
          console.error(`❌ 回滚失败:`, rollbackError);
        }
      }

      throw new Error(
        `更新失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  getMcpServer(endpoint: string): McpServer | undefined {
    return this.mcpServers.get(endpoint);
  }

  getAllEndpoints(): string[] {
    return Array.from(this.mcpEndpoints.keys());
  }

  getAllMcpInfo(): McpMetadata[] {
    return Array.from(this.mcpMetadata.values());
  }

  /**
   * 标准化 GitHub URL 格式，支持 HTTPS 和 SSH
   */
  private normalizeGitHubUrl(url: string): string {
    // 移除末尾的 .git（如果存在）
    let normalizedUrl = url.replace(/\.git$/, '');
    
    // 检查是否是 SSH 格式
    if (normalizedUrl.startsWith('git@github.com:')) {
      // 已经是 SSH 格式，添加 .git 后缀
      return `${normalizedUrl}.git`;
    }
    
    // 检查是否是 HTTPS 格式
    if (normalizedUrl.startsWith('https://github.com/')) {
      // 保持 HTTPS 格式，添加 .git 后缀
      return `${normalizedUrl}.git`;
    }
    
    // 检查是否是 SSH 格式但缺少 git@ 前缀
    if (normalizedUrl.includes('github.com:') && !normalizedUrl.startsWith('git@')) {
      // 添加 git@ 前缀
      return `git@${normalizedUrl}.git`;
    }
    
    // 检查是否是 HTTPS 格式但缺少协议
    if (normalizedUrl.includes('github.com/') && !normalizedUrl.startsWith('http')) {
      // 添加 https:// 前缀
      return `https://${normalizedUrl}.git`;
    }
    
    // 如果都不匹配，假设是 HTTPS 格式
    return `${normalizedUrl}.git`;
  }

  /**
   * 从 GitHub URL 提取仓库名称
   */
  private extractRepoName(url: string): string {
    // 移除 .git 后缀
    const cleanUrl = url.replace(/\.git$/, '');
    
    // 提取最后一部分作为仓库名
    const parts = cleanUrl.split('/');
    const repoName = parts[parts.length - 1];
    
    // 如果仓库名为空，使用默认名称
    return repoName || 'unknown-repo';
  }

  /**
   * 加载已保存的元数据
   */
  private loadMetadata() {
    try {
      const metadataPath = path.join(this.baseDir, 'metadata.json');
      if (fsSync.existsSync(metadataPath)) {
        const metadataContent = fsSync.readFileSync(metadataPath, 'utf-8');
        const savedMetadata: McpMetadataFile = JSON.parse(metadataContent);
        
        // 将保存的元数据加载到内存中
        Object.entries(savedMetadata).forEach(([endpoint, metadata]) => {
          this.mcpMetadata.set(endpoint, metadata);
        });
        
        console.log(`📋 已加载 ${Object.keys(savedMetadata).length} 个 MCP 元数据记录`);
      }
    } catch (error) {
      console.warn('加载元数据失败:', error);
    }
  }

  /**
   * 保存元数据到文件
   */
  private saveMetadata() {
    try {
      const metadataPath = path.join(this.baseDir, 'metadata.json');
      const metadataToSave: McpMetadataFile = {};
      
      // 将内存中的元数据转换为对象
      this.mcpMetadata.forEach((metadata, endpoint) => {
        metadataToSave[endpoint] = metadata;
      });
      
      // 保存到文件
      fsSync.writeFileSync(metadataPath, JSON.stringify(metadataToSave, null, 2));
      console.log(`💾 已保存 ${Object.keys(metadataToSave).length} 个 MCP 元数据记录`);
    } catch (error) {
      console.error('保存元数据失败:', error);
    }
  }

  /**
   * 加载指定 mcp 目录下的 .env 文件
   */
  private loadMcpEnv(mcpDir: string) {
    const envPath = path.join(mcpDir, '.env');
    try {
      if (fsSync.existsSync(envPath)) {
        dotenv.config({ path: envPath, override: true });
        console.log(`✅ [MCP ENV] 已加载 .env: ${envPath}`);
        // 检查部分常用环境变量
        // const checkVars = ['NODE_ENV', 'PORT', 'API_KEY', 'SECRET_KEY'];
        // console.log(process.env);
        Object.keys(process.env).forEach((key) => {
          console.log(`[MCP ENV] ${key} =`, process.env[key]);
        });
        // checkVars.forEach(key => {
        //   if (process.env[key]) {
        //     console.log(`[MCP ENV] ${key} =`, process.env[key]);
        //   }
        // });
      } else {
        console.log(`ℹ️ [MCP ENV] 未找到 .env: ${envPath}`);
      }
    } catch (e) {
      console.warn(`⚠️ [MCP ENV] 加载 .env 失败: ${envPath}`, e);
    }
  }
}

export const mcpManager = new McpManager();
