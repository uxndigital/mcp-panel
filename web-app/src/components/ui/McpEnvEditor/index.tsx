import { useEffect, useState } from 'react';
import Button from '../Button';
import Input from '../Input';

interface McpEnvEditorProps {
  mcpName: string;
  serverDomain: string;
}

type EnvItem = { key: string; value: string };

export default function McpEnvEditor({ mcpName, serverDomain }: McpEnvEditorProps) {
  const [envs, setEnvs] = useState<EnvItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 拉取 env
  useEffect(() => {
    setLoading(true);
    fetch(`${serverDomain}/api/mcp/env/${encodeURIComponent(mcpName)}`)
      .then(res => res.json())
      .then(data => {
        if (data.env) {
          setEnvs(
            Object.entries(data.env).map(([key, value]) => ({
              key: key ?? '',
              value: value != null ? String(value) : ''
            }))
          );
        } else {
          setEnvs([]);
        }
      })
      .catch(() => setEnvs([]))
      .finally(() => setLoading(false));
  }, [mcpName, serverDomain]);

  // 编辑
  const handleChange = (idx: number, field: 'key' | 'value', value: string) => {
    setEnvs(envs => {
      const copy = [...envs];
      copy[idx] = {
        key: field === 'key' ? value : copy[idx]?.key ?? '',
        value: field === 'value' ? value : copy[idx]?.value ?? ''
      };
      return copy;
    });
  };

  // 新增
  const handleAdd = () => setEnvs(envs => [...envs, { key: '', value: '' }]);

  // 删除
  const handleDelete = (idx: number) => setEnvs(envs => envs.filter((_, i) => i !== idx));

  // 保存
  const handleSave = async () => {
    setSaving(true);
    const envObj: Record<string, string> = {};
    envs.forEach(({ key, value }) => {
      if (key) envObj[key] = value;
    });
    try {
      const res = await fetch(`${serverDomain}/api/mcp/env/${encodeURIComponent(mcpName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ env: envObj }),
      });
      if (res.ok) {
        alert('保存成功');
      } else {
        alert('保存失败');
      }
    } catch {
      alert('保存失败');
    }
    setSaving(false);
  };

  if (loading) return <div>环境变量加载中...</div>;

  return (
    <div style={{ background: '#f7f7f7', padding: 12, borderRadius: 6, marginTop: 8 }}>
      <div>
        {envs.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <Input
              style={{ width: 140 }}
              value={item.key}
              onChange={e => handleChange(idx, 'key', e.target.value)}
              placeholder="变量名"
            />
            <Input
              style={{ width: 220 }}
              value={item.value}
              onChange={e => handleChange(idx, 'value', e.target.value)}
              placeholder="变量值"
            />
            <Button variant="danger" onClick={() => handleDelete(idx)}>删除</Button>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <Button onClick={handleAdd} variant="outline">新增变量</Button>
        <Button onClick={handleSave} disabled={saving} variant="primary">
          {saving ? '保存中...' : '保存'}
        </Button>
      </div>
    </div>
  );
} 