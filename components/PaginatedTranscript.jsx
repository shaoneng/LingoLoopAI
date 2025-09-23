import React from 'react';
import TranscriptPlayer from './TranscriptPlayer';
import { useAuth } from '../contexts/AuthContext';

const PAGE_SIZE = 40;

export default function PaginatedTranscript({ runId, audioRef, onActiveSegmentChange, showSource, setShowSource }) {
  const { accessToken } = useAuth();
  const [segments, setSegments] = React.useState([]);
  const [nextCursor, setNextCursor] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const fetchSegments = React.useCallback(
    async (cursor) => {
      if (!runId || !accessToken) return;
      setLoading(true);
      setError('');
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE || '';
        const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
        if (cursor != null) params.set('cursor', String(cursor));
        const resp = await fetch(`${base}/api/runs/${runId}/segments?${params.toString()}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const payload = await resp.json();
        if (!resp.ok) throw new Error(payload.error || '加载分段失败');
        if (cursor != null && cursor !== 0) {
          setSegments((prev) => [...prev, ...(payload.items || [])]);
        } else {
          setSegments(payload.items || []);
        }
        setNextCursor(payload.nextCursor ?? null);
      } catch (err) {
        setError(err.message || '加载分段失败');
      } finally {
        setLoading(false);
      }
    },
    [runId, accessToken]
  );

  React.useEffect(() => {
    if (!runId) return;
    fetchSegments(0);
  }, [runId, fetchSegments]);

  // 自动连续拉取剩余分页，直到全部加载完成
  React.useEffect(() => {
    if (!runId || !accessToken) return;
    if (loading) return;
    if (nextCursor != null) {
      fetchSegments(nextCursor);
    }
  }, [nextCursor, loading, runId, accessToken, fetchSegments]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
      {error && (
        <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(220,53,69,0.12)', color: '#a11', fontSize: 12 }}>
          {error}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <TranscriptPlayer audioRef={audioRef} segments={segments} onActiveChange={onActiveSegmentChange} runId={runId} showSource={showSource} setShowSource={setShowSource} />
      </div>
      {/* 加载更多按钮按需求移除 */}
    </div>
  );
}
