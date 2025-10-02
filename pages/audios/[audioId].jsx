import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import PaginatedTranscript from '../../components/PaginatedTranscript';
// Removed history & revisions for now to focus on Analysis
import AnalysisPanel from '../../components/AnalysisPanel';
import { parseAudioFilename } from '../../lib/audioMetadata';
import { useRealtimeAudio } from '../../hooks/useRealtimeAudioFiles';
import { useRealtimeTranscriptRuns } from '../../hooks/useRealtimeTranscriptRuns';
import { useRealtime } from '../../contexts/RealtimeContext';

function formatDuration(ms) {
  if (!ms || Number.isNaN(ms)) return '—';
  const totalSec = Math.round(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export default function AudioDetailPage() {
  const router = useRouter();
  const { audioId } = router.query;
  const { user, accessToken, initializing, logout } = useAuth();
  const { sync } = useRealtime();
  const realtimeAudio = useRealtimeAudio(audioId);
  const { runs: realtimeRuns } = useRealtimeTranscriptRuns({ audioId, autoSync: true });
  const audioRef = React.useRef(null);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [data, setData] = React.useState(null);
  const [signedUrl, setSignedUrl] = React.useState('');
  const [signing, setSigning] = React.useState(false);
  const [logoutPending, setLogoutPending] = React.useState(false);
  const [selectedSeg, setSelectedSeg] = React.useState({ globalIndex: -1, text: '' });
  const analysisRef = React.useRef(null);
  const [analyzingUi, setAnalyzingUi] = React.useState(false);
  const [listening, setListening] = React.useState(false);
  const [showSource, setShowSource] = React.useState(true);
  const [transcribing, setTranscribing] = React.useState(false);
  const [overviewLoading, setOverviewLoading] = React.useState(false);
  const [overview, setOverview] = React.useState(null); // { description, vocab }

  React.useEffect(() => {
    if (!audioId || !accessToken) return;
    sync();
  }, [audioId, accessToken, sync]);

  React.useEffect(() => {
    if (!audioId || !accessToken) return;
    let cancelled = false;
    const fetchDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '';
        const resp = await fetch(`${base}/api/audios/${audioId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const payload = await resp.json();
        if (!resp.ok) throw new Error(payload.error || '加载失败');
        if (!cancelled) setData(payload);
      } catch (err) {
        if (!cancelled) setError(err.message || '加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [audioId, accessToken]);

  React.useEffect(() => {
    if (!realtimeAudio || !data?.audio) return;
    setData((current) => {
      if (!current?.audio) return current;
      const currentTs = current.audio.updatedAt ? new Date(current.audio.updatedAt).getTime() : 0;
      const incomingTs = realtimeAudio.updatedAt ? new Date(realtimeAudio.updatedAt).getTime() : 0;
      if (incomingTs <= currentTs) {
        return current;
      }
      return {
        ...current,
        audio: { ...current.audio, ...realtimeAudio },
      };
    });
  }, [realtimeAudio, data?.audio]);

  React.useEffect(() => {
    if (!realtimeRuns?.length || !data?.audio?.id) return;
    setData((current) => {
      if (!current?.audio?.id) return current;
      const nextRuns = realtimeRuns.filter((run) => run.audioId === current.audio.id);
      if (!nextRuns.length) return current;
      const latest = nextRuns.reduce((acc, run) => {
        const runTs = run.updatedAt ? new Date(run.updatedAt).getTime() : 0;
        const accTs = acc?.updatedAt ? new Date(acc.updatedAt).getTime() : 0;
        return runTs > accTs ? run : acc;
      }, current.latestRun || null);
      return {
        ...current,
        latestRun: latest || current.latestRun,
        recentRuns: nextRuns,
      };
    });
  }, [realtimeRuns, data?.audio?.id]);

  React.useEffect(() => {
    if (!data?.audio?.id || !accessToken) return;
    let cancelled = false;
    const fetchSignedUrl = async () => {
      setSigning(true);
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '';
        const resp = await fetch(`${base}/api/audios/${data.audio.id}/download`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const payload = await resp.json();
        if (!resp.ok) throw new Error(payload.error || '获取播放地址失败');
        if (!cancelled) {
          setSignedUrl(payload.signedUrl);
          const el = audioRef.current;
          if (el) {
            el.src = payload.signedUrl;
            el.load();
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('Failed to fetch signed URL', err);
          setSignedUrl('');
        }
      } finally {
        if (!cancelled) setSigning(false);
      }
    };
    fetchSignedUrl();
    return () => {
      cancelled = true;
    };
  }, [data?.audio?.id, accessToken]);

  // 拉取/生成整篇概述与重点词汇
  React.useEffect(() => {
    const runId = data?.latestRun?.id;
    if (!runId || !accessToken) return;
    let cancelled = false;
    const load = async () => {
      setOverviewLoading(true);
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '';
        // 先尝试 GET
        let resp = await fetch(`${base}/api/runs/${runId}/analysis`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        let payload = await resp.json();
        let item = resp.ok ? payload.item : null;
        if (!item) {
          resp = await fetch(`${base}/api/runs/${runId}/analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({ force: false }),
          });
          payload = await resp.json();
          item = resp.ok ? payload.item : null;
        }
        if (!cancelled && item) {
          const result = item.result || {};
          setOverview({ description: result.description || '', vocab: Array.isArray(result.vocab) ? result.vocab : [] });
        }
      } catch (e) {
        // 忽略
      } finally {
        if (!cancelled) setOverviewLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [data?.latestRun?.id, accessToken]);

  React.useEffect(() => {
    const nextStatus = data?.latestRun?.status;
    const shouldListen = nextStatus && ['queued', 'processing'].includes(nextStatus);
    setListening(Boolean(shouldListen));
  }, [data?.latestRun?.status]);

  const handleLogout = async () => {
    setLogoutPending(true);
    try {
      await logout();
    } finally {
      setLogoutPending(false);
    }
  };

  const retriggerTranscribe = async () => {
    if (!data?.audio?.id || !accessToken) return;
    setTranscribing(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const resp = await fetch(`${base}/api/audios/${data.audio.id}/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          engine: 'google-speech-v2',
          language: data.audio.language || 'en-US',
          diarize: true,
          gapSec: data.audio.gapSec || 0.8,
          force: true,
        }),
      });
      const payload = await resp.json();
      if (!resp.ok && resp.status !== 202) throw new Error(payload.error || '触发转写失败');
      setData((prev) => (!prev ? prev : {
        ...prev,
        latestRun: {
          id: payload.runId || prev.latestRun?.id || 'pending',
          status: payload.status || 'queued',
          engine: 'google-speech-v2',
          version: payload.version || prev.latestRun?.version || null,
          completedAt: null,
        },
      }));
      setListening(true);
    } catch (err) {
      alert(err.message || '触发转写失败');
    } finally {
      setTranscribing(false);
    }
  };

  if (initializing) {
    return <div style={{ padding: 40, textAlign: 'center' }}>加载中…</div>;
  }

  if (!user) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>请先登录</h2>
        <p><Link href="/login">前往登录页</Link></p>
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>音频详情加载中…</div>;
  }

  if (!data) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>未找到音频</h2>
        <p><Link href="/dashboard">返回列表</Link></p>
      </div>
    );
  }

  const { audio, latestRun } = data;
  const metaTitle = parseAudioFilename(audio?.filename || '');

  const displayName = user?.displayName || user?.email || '访客';

  const zhStatus = (s) => {
    if (!s) return '—';
    const map = {
      uploaded: '已上传',
      uploading: '上传中',
      transcribed: '已转写',
      processing: '处理中',
      queued: '排队中',
      failed: '失败',
      quota_exceeded: '配额超限',
    };
    return map[s] || s;
  };

  return (
    <div
      style={{
        maxWidth: 1200,
        width: '100%',
        margin: '20px auto',
        padding: '0 20px',
        fontFamily: 'Inter, "Inter Fallback", ui-sans-serif, system-ui, -apple-system, "system-ui", "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
        fontSize: '0.875rem',
        lineHeight: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100vh',
        minHeight: '100%',
        color: '#1f2937',
        boxSizing: 'border-box',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 18,
          fontSize: 14,
          color: '#475569',
        }}
      >
        <Link href="/dashboard" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>← 返回我的音频</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
          <span style={{ fontWeight: 500, color: '#1e293b' }}>你好，{displayName}</span>
          <button
            type="button"
            onClick={handleLogout}
            disabled={logoutPending}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: '1px solid #cbd5f5',
              background: logoutPending ? '#e2e8f0' : '#f8fafc',
              color: '#1e293b',
              fontWeight: 500,
              cursor: logoutPending ? 'not-allowed' : 'pointer',
            }}
          >
            {logoutPending ? '退出中…' : '退出登录'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: 'rgba(220,53,69,0.12)', color: '#a11' }}>
          {error}
        </div>
      )}

      <header style={{ marginBottom: 18, width: '100%', maxWidth: 1200, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 20, paddingRight: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: 26, letterSpacing: '-0.01em' }}>{metaTitle.title}</h1>
          <button
            type="button"
            aria-label="重新转写（强制）"
            title="重新转写（强制）"
            onClick={retriggerTranscribe}
            disabled={transcribing}
            style={{
              width: 34,
              height: 34,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              border: '1px solid #2563eb',
              background: transcribing ? '#e0f2fe' : '#2563eb',
              color: '#fff',
              fontWeight: 700,
              cursor: transcribing ? 'not-allowed' : 'pointer',
            }}
          >
            {transcribing ? '…' : '↻'}
          </button>
        </div>
        <p style={{ color: '#4b5563', marginTop: 6, letterSpacing: '-0.005em' }}>
          {metaTitle.program ? `${metaTitle.program} · ` : ''}
          {metaTitle.dateText ? `${metaTitle.dateText} · ` : ''}
          时长：{formatDuration(audio.durationMs)} · 状态：{zhStatus(audio.status)}
        </p>
        {listening && (
          <div style={{ fontSize: 12, color: '#16a34a' }}>实时更新已连接</div>
        )}
        <p style={{ color: '#94a3b8', marginTop: 4, fontSize: 12 }}>最近更新：{audio.updatedAt ? new Date(audio.updatedAt).toLocaleString() : '—'}</p>
      </header>

      <div style={{ display: 'flex', gap: 24, alignItems: 'stretch', justifyContent: 'center', flex: 1, width: '100%', minHeight: 520, maxHeight: 'calc(100% - 160px)' }}>
        <section style={{ width: 300, minWidth: 280, maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
          <div style={{ border: '1px solid #e1e1e1', borderRadius: 10, padding: 16, background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <h2 style={{ margin: '0 0 10px', fontSize: 18, letterSpacing: '-0.01em' }}>媒体区</h2>
            <audio ref={audioRef} controls style={{ width: '100%', borderRadius: 8 }} src={signedUrl || undefined}>
              <track kind="captions" />
            </audio>
            {signing ? (
              <div style={{ fontSize: 13, color: '#94a3b8' }}>正在获取播放地址…</div>
            ) : signedUrl ? (
              <div style={{ fontSize: 13, color: '#4b5563' }}>链接有效期约 10 分钟，如无法播放请刷新页面。</div>
            ) : (
              <div style={{ fontSize: 13, color: '#ef4444' }}>暂时无法获取播放链接，可稍后重试。</div>
            )}
            {/* 媒体元信息（语言/模式/上传时间/gcsUri）按要求隐藏 */}
            {/* 内容介绍与重点词汇 */}
            <div style={{ marginTop: 8, borderTop: '1px dashed #d4d4d8', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: '#1f2937' }}>内容介绍</div>
                {overviewLoading && !overview ? (
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>生成中…</div>
                ) : (
                  <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {overview?.description || '—'}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: '#1f2937' }}>重点词汇</div>
                {overview && Array.isArray(overview.vocab) && overview.vocab.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {overview.vocab.map((v, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 8,
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          fontSize: 12,
                          color: '#0f172a',
                          lineHeight: 1.6,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>
                          {v.word}{v.phonetic ? ` ${v.phonetic}` : ''}
                        </div>
                        {v.definition ? (
                          <div style={{ color: '#334155', whiteSpace: 'pre-wrap' }}>{v.definition}</div>
                        ) : null}
                        {v.translation ? (
                          <div style={{ color: '#0f172a', whiteSpace: 'pre-wrap' }}>{v.translation}</div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : overviewLoading ? (
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>生成中…</div>
                ) : (
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>—</div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section style={{ width: 640, minWidth: 480, maxWidth: 640, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ border: '1px solid #e1e1e1', borderRadius: 10, padding: 16, background: '#fff', flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
            {latestRun ? (
              <>
                {(latestRun.status === 'queued' || latestRun.status === 'processing') && (
                  <div style={{ marginBottom: 8, padding: '8px 10px', borderRadius: 6, background: '#fff7ed', color: '#9a3412', fontSize: 13 }}>
                    {listening ? '转写进行中，完成后将自动刷新…' : '等待更新…'} 当前状态：{latestRun.status}
                  </div>
                )}
                <PaginatedTranscript
                  key={latestRun.id}
                  runId={latestRun.id}
                  audioRef={audioRef}
                  showSource={showSource}
                  setShowSource={setShowSource}
                  onActiveSegmentChange={({ localIndex, globalIndex, segment }) => {
                    const text = segment?.text || ''
                    setSelectedSeg({ globalIndex: typeof globalIndex === 'number' ? globalIndex : localIndex, text })
                  }}
                />
              </>
            ) : (
              <div style={{ margin: 'auto', textAlign: 'center', color: '#94a3b8' }}>
                <p>暂无转写结果。</p>
                <button
                  type="button"
                  onClick={retriggerTranscribe}
                  disabled={transcribing}
                  style={{
                    marginTop: 12,
                    padding: '10px 18px',
                    borderRadius: 8,
                    border: 'none',
                    background: transcribing ? '#e0f2fe' : '#2563eb',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 15,
                    cursor: transcribing ? 'not-allowed' : 'pointer',
                  }}
                >
                  {transcribing ? '正在启动…' : '开始转写'}
                </button>
              </div>
            )}
          </div>
        </section>

        <section style={{ width: 280, minWidth: 260, maxWidth: 320, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ border: '1px solid #e1e1e1', borderRadius: 10, padding: 16, background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>分析区</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  title="分析"
                  onClick={async () => { if (analyzingUi) return; setAnalyzingUi(true); try { await analysisRef.current?.analyze(false); } finally { setAnalyzingUi(false); } }}
                  disabled={analyzingUi || selectedSeg.globalIndex == null || selectedSeg.globalIndex < 0}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #2563eb', background: analyzingUi ? '#93c5fd' : '#2563eb', color: '#fff', fontWeight: 600, cursor: analyzingUi ? 'not-allowed' : 'pointer' }}
                >
                  分析
                </button>
                <button
                  type="button"
                  aria-label="重新分析"
                  title="重新分析"
                  onClick={async () => { if (analyzingUi) return; setAnalyzingUi(true); try { await analysisRef.current?.analyze(true); } finally { setAnalyzingUi(false); } }}
                  disabled={analyzingUi || selectedSeg.globalIndex == null || selectedSeg.globalIndex < 0}
                  style={{ width: 36, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '1px solid #0ea5e9', background: analyzingUi ? '#7dd3fc' : '#0ea5e9', color: '#fff', fontWeight: 700, cursor: analyzingUi ? 'not-allowed' : 'pointer' }}
                >
                  ↻
                </button>
              </div>
            </div>
            {latestRun ? (
              <AnalysisPanel ref={analysisRef} runId={latestRun.id} segmentIndex={selectedSeg.globalIndex} segmentText={selectedSeg.text} showSource={showSource} />
            ) : (
              <div style={{ color: '#94a3b8', fontSize: 13 }}>暂无转写结果，无法分析。</div>
            )}
          </div>
        </section>
      </div>

      <footer style={{ marginTop: 24 }} />
    </div>
  );
}
