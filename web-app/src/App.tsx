import { useState, useEffect } from 'react'
import './App.css'

interface McpInfo {
  name: string;
  gitUrl: string;
  version?: string;
  commit: string;
  installDate: string;
  directory: string;
}

interface McpListResponse {
  mcps: McpInfo[]
}

function App() {
  const [mcps, setMcps] = useState<McpInfo[]>([])
  const [githubUrl, setGithubUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [updatingMcps, setUpdatingMcps] = useState<Set<string>>(new Set())

  // 获取 MCP 列表
  const fetchMcps = async () => {
    try {
      const response = await fetch('/api/mcp/list')
      const data: McpListResponse = await response.json()
      setMcps(data.mcps)
    } catch (error) {
      console.error('获取 MCP 列表失败:', error)
    }
  }

  // 安装 MCP
  const installMcp = async () => {
    if (!githubUrl.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/mcp/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubUrl })
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('安装成功:', data.endpoint)
        setGithubUrl('')
        await fetchMcps()
      } else {
        const error = await response.json()
        console.error('安装失败:', error.error)
        alert(`安装失败: ${error.error}`)
      }
    } catch (error) {
      console.error('安装失败:', error)
      alert(`安装失败: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  // 更新 MCP
  const updateMcp = async (mcpInfo: McpInfo) => {
    const mcpName = mcpInfo.name;
    setUpdatingMcps(prev => new Set(prev.add(mcpName)));
    
    try {
      const encodedMcpName = encodeURIComponent(mcpName);
      const response = await fetch(`/api/mcp/update/${encodedMcpName}`, {
        method: 'PUT'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('更新成功:', data.metadata)
        alert(`更新成功! 新版本: ${data.metadata.commit.substring(0, 8)}`)
        await fetchMcps()
      } else {
        const error = await response.json()
        console.error('更新失败:', error.error)
        alert(`更新失败: ${error.error}`)
      }
    } catch (error) {
      console.error('更新失败:', error)
      alert(`更新失败: ${error}`)
    } finally {
      setUpdatingMcps(prev => {
        const newSet = new Set(prev);
        newSet.delete(mcpName);
        return newSet;
      });
    }
  }

  // 卸载 MCP
  const uninstallMcp = async (mcpInfo: McpInfo) => {
    if (!confirm(`确定要卸载 ${mcpInfo.name} 吗？`)) {
      return;
    }
    
    try {
      const encodedMcpName = encodeURIComponent(mcpInfo.name);
      const response = await fetch(`/api/mcp/uninstall/${encodedMcpName}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        console.log('卸载成功')
        await fetchMcps()
      } else {
        const error = await response.json()
        console.error('卸载失败:', error.error)
        alert(`卸载失败: ${error.error}`)
      }
    } catch (error) {
      console.error('卸载失败:', error)
      alert(`卸载失败: ${error}`)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const formatCommit = (commit: string) => {
    return commit.substring(0, 8)
  }

  useEffect(() => {
    fetchMcps()
  }, [])

  return (
    <div className="App">
      <h1>MCP 管理面板</h1>
      
      <div className="mcp-install">
        <h2>安装 MCP 服务器</h2>
        <div>
          <input
            type="text"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="输入 GitHub 仓库 URL"
            style={{ width: '300px', marginRight: '10px' }}
          />
          <button onClick={installMcp} disabled={loading || !githubUrl.trim()}>
            {loading ? '安装中...' : '安装'}
          </button>
        </div>
      </div>

      <div className="mcp-list">
        <h2>已安装的 MCP 服务器</h2>
        <button onClick={fetchMcps} style={{ marginBottom: '10px' }}>
          刷新列表
        </button>
        {mcps.length === 0 ? (
          <p>暂无已安装的 MCP 服务器</p>
        ) : (
          <div>
            {mcps.map((mcp) => (
              <div key={mcp.name} style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '15px', 
                marginBottom: '15px',
                backgroundColor: '#f9f9f9'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
                      {mcp.name}
                      {mcp.version && (
                        <span style={{ 
                          marginLeft: '10px', 
                          fontSize: '0.8em', 
                          backgroundColor: '#007acc', 
                          color: 'white', 
                          padding: '2px 8px', 
                          borderRadius: '4px' 
                        }}>
                          {mcp.version}
                        </span>
                      )}
                    </h3>
                    <div style={{ fontSize: '0.9em', color: '#666', lineHeight: '1.4' }}>
                      <div><strong>Git URL:</strong> 
                        <a href={mcp.gitUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '5px', color: '#007acc' }}>
                          {mcp.gitUrl}
                        </a>
                      </div>
                      <div><strong>提交:</strong> <code style={{ backgroundColor: '#eee', padding: '2px 4px', borderRadius: '3px' }}>{formatCommit(mcp.commit)}</code></div>
                      <div><strong>安装时间:</strong> {formatDate(mcp.installDate)}</div>
                      <div><strong>端点:</strong> <code>/{mcp.name}/mcp</code></div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => updateMcp(mcp)}
                      disabled={updatingMcps.has(mcp.name)}
                      style={{ 
                        backgroundColor: updatingMcps.has(mcp.name) ? '#ccc' : '#28a745', 
                        color: 'white', 
                        border: 'none',
                        padding: '8px 15px',
                        borderRadius: '4px',
                        cursor: updatingMcps.has(mcp.name) ? 'not-allowed' : 'pointer',
                        fontSize: '0.9em'
                      }}
                    >
                      {updatingMcps.has(mcp.name) ? '更新中...' : '更新'}
                    </button>
                    <button 
                      onClick={() => uninstallMcp(mcp)}
                      style={{ 
                        backgroundColor: '#ff4444', 
                        color: 'white', 
                        border: 'none',
                        padding: '8px 15px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9em'
                      }}
                    >
                      卸载
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
