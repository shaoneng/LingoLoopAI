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

export default function RevisionsPanel({ runId, baseText = '', baseSegments = [] }) {
  const { accessToken } = useAuth();
  const [revisions, setRevisions] = React.useState([]);
  const [activeRevisionId, setActiveRevisionId] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [newTitle, setNewTitle] = React.useState('');
  const [newText, setNewText] = React.useState(baseText || '');
  const [creating, setCreating] = React.useState(false);
  const [editingTitle, setEditingTitle] = React.useState('');
  const [editingText, setEditingText] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setNewText(baseText || '');
  }, [baseText]);

  const loadRevisions = React.useCallback(async () => {
    if (!runId || !accessToken) return;
    setLoading(true);
    setError('');
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || '';
      const resp = await fetch(`${base}/api/runs/${runId}/revisions`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = await resp.json();
      if (!resp.ok) throw new Error(payload.error || '加载修订失败');
      const items = payload.items || [];
      setRevisions(items);
      if (items.length) {
        setActiveRevisionId(items[0].id);
        setEditingTitle(items[0].title || '');
        setEditingText(items[0].text || '');
      } else {
        setActiveRevisionId(null);
        setEditingTitle('');
        setEditingText('');
      }
    } catch (err) {
      setError(err.message || '加载修订失败');
    } finally {
      setLoading(false);
    }
  }, [runId, accessToken]);

  React.useEffect(() => {
    loadRevisions();
  }, [loadRevisions]);

  const createRevision = async () => {
    if (!runId || !newText.trim() || !accessToken) return;
    setCreating(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || '';
      const resp = await fetch(`${base}/api/runs/${runId}/revisions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: newTitle,
          text: newText,
          segments: baseSegments,
        }),
      });
      const payload = await resp.json();
      if (!resp.ok) throw new Error(payload.error || '创建修订失败');
      setRevisions((prev) => [payload, ...prev]);
      setActiveRevisionId(payload.id);
      setEditingTitle(payload.title || '');
      setEditingText(payload.text || '');
      setNewTitle('');
      setNewText(baseText || '');
    } catch (err) {
      alert(err.message || '创建修订失败');
    } finally {
      setCreating(false);
    }
  };

  const updateRevision = async () => {
    if (!activeRevisionId || !accessToken) return;
    setSaving(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || '';
      const resp = await fetch(`${base}/api/revisions/${activeRevisionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ title: editingTitle, text: editingText }),
      });
      const payload = await resp.json();
      if (!resp.ok) throw new Error(payload.error || '保存修订失败');
      setRevisions((prev) => prev.map((rev) => (rev.id === payload.id ? payload : rev)));
    } catch (err) {
      alert(err.message || '保存修订失败');
    } finally {
      setSaving(false);
    }
  };

  const deleteRevision = async (id) => {
    if (!accessToken || !id) return;
    if (!window.confirm('确认删除该修订？')) return;
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || '';
      const resp = await fetch(`${base}/api/revisions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!resp.ok && resp.status !== 204) {
        const payload = await resp.json().catch(() => ({}));
        throw new Error(payload.error || '删除失败');
      }
      setRevisions((prev) => {
        const rest = prev.filter((rev) => rev.id !== id);
        if (activeRevisionId === id) {
          if (rest.length) {
            setActiveRevisionId(rest[0].id);
            setEditingTitle(rest[0].title || '');
            setEditingText(rest[0].text || '');
          } else {
            setActiveRevisionId(null);
            setEditingTitle('');
            setEditingText('');
          }
        }
        return rest;
      });
    } catch (err) {
      alert(err.message || '删除失败');
    }
  };

  React.useEffect(() => {
    const current = revisions.find((rev) => rev.id === activeRevisionId);
    if (current) {
      setEditingTitle(current.title || '');
      setEditingText(current.text || '');
    }
  }, [activeRevisionId, revisions]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ border: '1px solid #e1e1e1', borderRadius: 10, padding: 16, background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>新建修订</h3>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="可选标题"
          style={{ border: '1px solid #d4d4d8', borderRadius: 6, padding: '6px 10px', fontSize: 13 }}
        />
        <textarea
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="将当前转写复制为起点，进行自定义编辑…"
          rows={4}
          style={{ border: '1px solid #d4d4d8', borderRadius: 6, padding: '8px 10px', fontSize: 13, resize: 'vertical' }}
        />
        <button
          type="button"
          onClick={createRevision}
          disabled={creating || !newText.trim()}
          style={{
            alignSelf: 'flex-start',
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #10b981',
            background: creating ? '#cffafe' : '#10b981',
            color: creating ? '#0f172a' : '#fff',
            fontWeight: 600,
            cursor: creating || !newText.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {creating ? '保存中…' : '创建修订'}
        </button>
      </div>

      <div style={{ border: '1px solid #e1e1e1', borderRadius: 10, padding: 16, background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>历史修订</h3>
        {error && (
          <div style={{ padding: '6px 8px', borderRadius: 6, background: 'rgba(220,53,69,0.12)', color: '#a11', fontSize: 12 }}>
            {error}
          </div>
        )}
        {loading ? (
          <div style={{ color: '#64748b', fontSize: 13 }}>加载中…</div>
        ) : (
          <div style={{ display: 'flex', gap: 12 }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, width: 160, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {revisions.map((rev) => (
                <li
                  key={rev.id}
                  onClick={() => setActiveRevisionId(rev.id)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    background: activeRevisionId === rev.id ? '#e0f2fe' : '#fff',
                    cursor: 'pointer',
                    fontSize: 12,
                    color: '#475569',
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{rev.title || '未命名修订'}</div>
                  <div>{formatTimestamp(rev.createdAt)}</div>
                </li>
              ))}
              {!revisions.length && (
                <li style={{ padding: '6px 8px', borderRadius: 6, background: '#fff', color: '#94a3b8', fontSize: 13 }}>
                  暂无修订。
                </li>
              )}
            </ul>
            <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeRevisionId ? (
                <>
                  <input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    placeholder="修订标题"
                    style={{ border: '1px solid #d4d4d8', borderRadius: 6, padding: '6px 10px', fontSize: 13 }}
                  />
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    rows={6}
                    style={{ border: '1px solid #d4d4d8', borderRadius: 6, padding: '8px 10px', fontSize: 13, resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={updateRevision}
                      disabled={saving}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid #2563eb',
                        background: saving ? '#e0f2fe' : '#2563eb',
                        color: '#fff',
                        fontWeight: 600,
                        cursor: saving ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {saving ? '保存中…' : '保存修改'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRevision(activeRevisionId)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid #ef4444',
                        background: '#fff0f0',
                        color: '#ef4444',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      删除
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ color: '#94a3b8', fontSize: 13 }}>选择左侧修订查看详情。</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
