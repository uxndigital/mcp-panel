import './App.css';

import { Flex } from '@uxndigital/ui-essentials';
import { useEffect, useState } from 'react';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

import { container } from './style';

interface McpInfo {
  name: string;
  gitUrl: string;
  version?: string;
  commit: string;
  installDate: string;
  directory: string;
}

interface McpListResponse {
  mcps: McpInfo[];
}

function App() {
  const [mcps, setMcps] = useState<McpInfo[]>([]);
  const [githubUrl, setGithubUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [updatingMcps, setUpdatingMcps] = useState<Set<string>>(new Set());

  // 获取 MCP 列表
  const fetchMcps = async () => {
    try {
      const response = await fetch('/api/mcp/list');
      const data: McpListResponse = await response.json();
      setMcps(data.mcps);
    } catch (error) {
      console.error('获取 MCP 列表失败:', error);
    }
  };

  // 安装 MCP
  const installMcp = async () => {
    if (!githubUrl.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/mcp/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('安装成功:', data.endpoint);
        setGithubUrl('');
        await fetchMcps();
      } else {
        const error = await response.json();
        console.error('安装失败:', error.error);
        alert(`安装失败: ${error.error}`);
      }
    } catch (error) {
      console.error('安装失败:', error);
      alert(`安装失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 更新 MCP
  const updateMcp = async (mcpInfo: McpInfo) => {
    const mcpName = mcpInfo.name;
    setUpdatingMcps((prev) => new Set(prev.add(mcpName)));

    try {
      const encodedMcpName = encodeURIComponent(mcpName);
      const response = await fetch(`/api/mcp/update/${encodedMcpName}`, {
        method: 'PUT',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('更新成功:', data.metadata);
        alert(`更新成功! 新版本: ${data.metadata.commit.substring(0, 8)}`);
        await fetchMcps();
      } else {
        const error = await response.json();
        console.error('更新失败:', error.error);
        alert(`更新失败: ${error.error}`);
      }
    } catch (error) {
      console.error('更新失败:', error);
      alert(`更新失败: ${error}`);
    } finally {
      setUpdatingMcps((prev) => {
        const newSet = new Set(prev);
        newSet.delete(mcpName);
        return newSet;
      });
    }
  };

  // 卸载 MCP
  const uninstallMcp = async (mcpInfo: McpInfo) => {
    if (!confirm(`确定要卸载 ${mcpInfo.name} 吗？`)) {
      return;
    }

    try {
      const encodedMcpName = encodeURIComponent(mcpInfo.name);
      const response = await fetch(`/api/mcp/uninstall/${encodedMcpName}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('卸载成功');
        await fetchMcps();
      } else {
        const error = await response.json();
        console.error('卸载失败:', error.error);
        alert(`卸载失败: ${error.error}`);
      }
    } catch (error) {
      console.error('卸载失败:', error);
      alert(`卸载失败: ${error}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const formatCommit = (commit: string) => {
    return commit.substring(0, 8);
  };

  useEffect(() => {
    fetchMcps();
  }, []);

  return (
    <Flex className={container}>
      {/* <div className="App"> */}
      <aside>
        <h1 className="app-title">MCP 管理面板</h1>
        <Flex
          className="mcp-install"
          direction="column"
          justify="flex-end"
          gap="12px"
        >
          <Input
            className="mcp-install-input"
            type="text"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="输入 GitHub 仓库 URL"
          />
          <Button
            onClick={installMcp}
            disabled={loading || !githubUrl.trim()}
            variant="outline"
          >
            {loading ? '安装中...' : '安装'}
          </Button>
        </Flex>
      </aside>
      <main className="app-content">
        <div className="mcp-list">
          <Flex
            justify="space-between"
            align="center"
            className="mcp-list-header"
          >
            <h2>已安装的 MCP 服务器</h2>
            <Button variant="outline" onClick={fetchMcps}>
              刷新列表
            </Button>
          </Flex>

          {mcps.length === 0 ? (
            <p>暂无已安装的 MCP 服务器</p>
          ) : (
            <div className="mcp-list-container">
              {mcps.map((mcp) => (
                <div key={mcp.name}>
                  <Flex justify="space-between" align="flex-start">
                    <div style={{ flex: 1 }}>
                      <h3 className="mcp-list-item-name">
                        {mcp.name}
                        {mcp.version && (
                          <span className="mcp-list-item-version">
                            {mcp.version}
                          </span>
                        )}
                      </h3>
                      <div className="mcp-list-item-info">
                        <div>
                          <strong>Git URL:</strong>
                          <a
                            href={mcp.gitUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {mcp.gitUrl}
                          </a>
                        </div>
                        <div>
                          <strong>提交:</strong>
                          <code className="mcp-list-item-commit">
                            {formatCommit(mcp.commit)}
                          </code>
                        </div>
                        <div>
                          <strong>安装时间:</strong>
                          {formatDate(mcp.installDate)}
                        </div>
                        <div>
                          <strong>端点:</strong> <code>/{mcp.name}/mcp</code>
                        </div>
                      </div>
                    </div>
                    <Flex gap="8px">
                      <Button
                        onClick={() => updateMcp(mcp)}
                        variant="outline"
                        disabled={updatingMcps.has(mcp.name)}
                      >
                        {updatingMcps.has(mcp.name) ? '更新中...' : '更新'}
                      </Button>
                      <Button
                        onClick={() => uninstallMcp(mcp)}
                        variant="danger"
                      >
                        卸载
                      </Button>
                    </Flex>
                  </Flex>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </Flex>
  );
}

export default App;
