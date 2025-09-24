import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AnnotationsPanel from './AnnotationsPanel';

export default function RunHistoryList({ audioId, initialRuns = [] }) {
  const { accessToken } = useAuth();
  const [runs, setRuns] = React.useState(initialRuns);
  const [nextCursor, setNextCursor] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [hasInitialised, setHasInitialised] = React.useState(false);
  const [activeRunId, setActiveRunId] = React.useState(initialRuns?.[0]?.id || null);

  const fetchMore = React.useCallback(async () => {
    if (!audioId || !nextCursor || !accessToken) return;
    setLoading(true);
    setError('');
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || '';
      const params = new URLSearchParams({ limit: '10', cursor: nextCursor });
      const resp = await fetch(`${base}/api/audios/${audioId}/runs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = await resp.json();
      if (!resp.ok) throw new Error(payload.error || '加载失败');
      const items = payload.items || [];
      setRuns((prev) => [...prev, ...items]);
      setNextCursor(payload.nextCursor || null);
      if (!activeRunId && items.length) {
        setActiveRunId(items[0].id);
      }
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [audioId, nextCursor, accessToken, activeRunId]);

  React.useEffect(() => {
    if (hasInitialised || !audioId || !accessToken) return;
    const load = async () => {
      setHasInitialised(true);
      setLoading(true);
      setError('');
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE || '';
        const resp = await fetch(`${base}/api/audios/${audioId}/runs?limit=10`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const payload = await resp.json();
        if (!resp.ok) throw new Error(payload.error || '加载失败');
        const items = payload.items || [];
        setRuns(items);
        setNextCursor(payload.nextCursor || null);
        if (items.length) {
          setActiveRunId(items[0].id);
        }
      } catch (err) {
        setError(err.message || '加载失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [audioId, hasInitialised, accessToken]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {error && (
        <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(220,53,69,0.12)', color: '#a11', fontSize: 12 }}>
          {error}
        </div>
      )}
      <AnnotationsPanel runId={activeRunId} />
      <button
        type="button"
        onClick={fetchMore}
        disabled={!nextCursor || loading}
        style={{
          alignSelf: 'flex-start',
          padding: '6px 10px',
          borderRadius: 6,
          border: '1px solid #cbd5f5',
          background: nextCursor && !loading ? '#fff' : '#f1f5f9',
          color: nextCursor ? '#2563eb' : '#94a3b8',
          fontWeight: 600,
          cursor: nextCursor && !loading ? 'pointer' : 'not-allowed',
        }}
      >
        {loading ? '加载中…' : nextCursor ? '加载更多注释关联 run' : '注释列表'}
      </button>
    </div>
  );
}
