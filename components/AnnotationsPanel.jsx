import React from 'react';
import { useAuth } from '../contexts/AuthContext';

function formatTimestamp(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch (err) {
    return value;
  }
}

export default function AnnotationsPanel({ runId }) {
  const { accessToken } = useAuth();
  const [annotations, setAnnotations] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [content, setContent] = React.useState('');
  const [anchorType, setAnchorType] = React.useState('time');
  const [anchorValue, setAnchorValue] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const loadAnnotations = React.useCallback(async () => {
    if (!runId || !accessToken) return;
    setLoading(true);
    setError('');
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const resp = await fetch(`${base}/api/runs/${runId}/annotations`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = await resp.json();
      if (!resp.ok) throw new Error(payload.error || '加载注释失败');
      setAnnotations(payload.items || []);
    } catch (err) {
      setError(err.message || '加载注释失败');
    } finally {
      setLoading(false);
    }
  }, [runId, accessToken]);

  React.useEffect(() => {
    loadAnnotations();
  }, [loadAnnotations]);

  const createAnnotation = async () => {
    if (!runId || !content || !anchorValue || !accessToken) return;
    setSubmitting(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const resp = await fetch(`${base}/api/runs/${runId}/annotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ content, anchorType, anchorValue }),
      });
      const payload = await resp.json();
      if (!resp.ok) throw new Error(payload.error || '创建注释失败');
      setAnnotations((prev) => [...prev, payload]);
      setContent('');
      setAnchorValue('');
    } catch (err) {
      alert(err.message || '创建注释失败');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAnnotation = async (id) => {
    if (!accessToken || !id) return;
    if (!window.confirm('确认删除该注释？')) return;
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const resp = await fetch(`${base}/api/annotations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!resp.ok && resp.status !== 204) {
        const payload = await resp.json().catch(() => ({}));
        throw new Error(payload.error || '删除失败');
      }
      setAnnotations((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert(err.message || '删除失败');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
      <h3 style={{ margin: 0, fontSize: 16 }}>注释</h3>
      {error && (
        <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(220,53,69,0.12)', color: '#a11', fontSize: 12 }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="记录你的想法…"
          rows={3}
          style={{ border: '1px solid #d4d4d8', borderRadius: 6, padding: '8px 10px', fontSize: 13, resize: 'vertical' }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={anchorType}
            onChange={(e) => setAnchorType(e.target.value)}
            style={{ border: '1px solid #d4d4d8', borderRadius: 6, padding: '6px 10px', fontSize: 13 }}
          >
            <option value="time">时间点 (秒)</option>
            <option value="segment">段落 ID</option>
          </select>
          <input
            value={anchorValue}
            onChange={(e) => setAnchorValue(e.target.value)}
            placeholder={anchorType === 'time' ? '如 12.3' : '如 seg-1'}
            style={{ flex: 1, border: '1px solid #d4d4d8', borderRadius: 6, padding: '6px 10px', fontSize: 13 }}
          />
          <button
            type="button"
            onClick={createAnnotation}
            disabled={submitting || !content || !anchorValue}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #10b981',
              background: submitting ? '#cffafe' : '#10b981',
              color: submitting ? '#0f172a' : '#fff',
              fontWeight: 600,
              cursor: submitting || !content || !anchorValue ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? '保存中…' : '新增'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, background: '#fff', minHeight: 160, maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ color: '#64748b', fontSize: 13 }}>加载中…</div>
        ) : annotations.length ? (
          annotations.map((item) => (
            <div key={item.id} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8' }}>
                <span>锚点：{item.anchorType} · {item.anchorValue}</span>
                <button
                  type="button"
                  onClick={() => deleteAnnotation(item.id)}
                  style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}
                >
                  删除
                </button>
              </div>
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{item.content}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{formatTimestamp(item.createdAt)}</div>
            </div>
          ))
        ) : (
          <div style={{ color: '#94a3b8', fontSize: 13 }}>暂无注释。</div>
        )}
      </div>
      <button
        type="button"
        onClick={loadAnnotations}
        disabled={loading}
        style={{
          alignSelf: 'flex-start',
          padding: '6px 12px',
          borderRadius: 6,
          border: '1px solid #cbd5f5',
          background: '#fff',
          color: '#2563eb',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        刷新
      </button>
    </div>
  );
}
