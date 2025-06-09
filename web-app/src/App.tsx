import { useState, useEffect } from 'react'
import './App.css'

interface McpEndpoint {
  endpoints: string[]
}

function App() {
  const [endpoints, setEndpoints] = useState<string[]>([])
  const [githubUrl, setGithubUrl] = useState('')
  const [loading, setLoading] = useState(false)

  // 获取 MCP 列表
  const fetchEndpoints = async () => {
    try {
      const response = await fetch('/api/mcp/list')
      const data: McpEndpoint = await response.json()
      setEndpoints(data.endpoints)
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
        await fetchEndpoints()
      } else {
        const error = await response.json()
        console.error('安装失败:', error.error)
      }
    } catch (error) {
      console.error('安装失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 卸载 MCP
  const uninstallMcp = async (endpoint: string) => {
    try {
      // 新格式: /puppeteer-mcp/mcp -> 提取 puppeteer-mcp
      const mcpName = endpoint.replace(/^\//, '').replace(/\/mcp$/, '');
      const encodedMcpName = encodeURIComponent(mcpName);
      const response = await fetch(`/api/mcp/uninstall/${encodedMcpName}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        console.log('卸载成功')
        await fetchEndpoints()
      } else {
        const error = await response.json()
        console.error('卸载失败:', error.error)
      }
    } catch (error) {
      console.error('卸载失败:', error)
    }
  }

  useEffect(() => {
    fetchEndpoints()
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
        <button onClick={fetchEndpoints} style={{ marginBottom: '10px' }}>
          刷新列表
        </button>
        {endpoints.length === 0 ? (
          <p>暂无已安装的 MCP 服务器</p>
        ) : (
          <ul>
            {endpoints.map((endpoint) => (
              <li key={endpoint} style={{ marginBottom: '10px' }}>
                <span>{endpoint}</span>
                <button 
                  onClick={() => uninstallMcp(endpoint)}
                  style={{ marginLeft: '10px', backgroundColor: '#ff4444', color: 'white' }}
                >
                  卸载
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default App
