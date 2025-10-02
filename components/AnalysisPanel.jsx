import React from 'react'
import { useAuth } from '../contexts/AuthContext'

function Section({ title, children }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, background: '#fff' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>{title}</h3>
      {children}
    </div>
  )
}

function KeyVal({ k, v }) {
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 13, color: '#475569' }}>
      <div style={{ width: 120, color: '#64748b' }}>{k}</div>
      <div style={{ flex: 1 }}>{v}</div>
    </div>
  )
}

function translatePos(pos) {
  if (!pos) return ''
  const m = {
    NOUN: '名词', PROPN: '专有名词', PRON: '代词',
    VERB: '动词', AUX: '助动词', PART: '小品词',
    ADJ: '形容词', ADV: '副词',
    ADP: '介词', DET: '限定词', NUM: '数词',
    CCONJ: '并列连词', SCONJ: '从属连词', INTJ: '感叹词',
    PUNCT: '标点', SYM: '符号', X: '其他',
  }
  return m[pos] || m[pos?.toUpperCase?.()] || pos
}

function translatePhrase(tag) {
  if (!tag) return ''
  const raw = String(tag).trim()
  const inner = raw.match(/\(([^)]+)\)/)?.[1]?.trim()
  if (inner && /[\u4e00-\u9fa5]/.test(inner)) return inner
  const m = {
    NP: '名词短语', VP: '动词短语', PP: '介词短语',
    ADJP: '形容词短语', ADVP: '副词短语',
    SBAR: '从句', S: '句子', IP: '句子', CP: '从句',
  }
  const head = (raw.match(/^[A-Za-z]+/)?.[0] || raw).toUpperCase()
  return m[head] || (inner || raw)
}

function translateSyntaxLabel(label) {
  if (!label) return ''
  const raw = String(label).trim()
  const inner = raw.match(/\(([^)]+)\)/)?.[1]?.trim()
  if (inner && /[\u4e00-\u9fa5]/.test(inner)) return inner
  const map = {
    'Main Clause': '主句',
    'Subordinate Clause': '从句',
    'Relative Clause': '定语从句',
    'Adverbial Clause': '状语从句',
    'Noun Clause': '名词性从句',
    'Predicate': '谓语',
    'Subject': '主语',
    'Object': '宾语',
    'Complement': '补语',
    'SBAR': '从句',
    'NP': '名词短语',
    'VP': '动词短语',
    'PP': '介词短语',
  }
  if (map[raw]) return map[raw]
  const head = (raw.match(/^[A-Za-z]+/)?.[0] || raw).toUpperCase()
  return map[head] || (inner || raw)
}

const AnalysisPanel = React.forwardRef(function AnalysisPanel({ runId, segmentIndex, segmentText, showSource }, ref) {
  const { accessToken } = useAuth()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [sentence, setSentence] = React.useState(null)
  const [grammar, setGrammar] = React.useState(null)
  const [analyzing, setAnalyzing] = React.useState(false)

  const fetchExisting = React.useCallback(async () => {
    if (!runId || segmentIndex == null || !accessToken) return
    setLoading(true)
    setError('')
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || ''
      const segmentIndexToUse = segmentIndex >= 0 ? segmentIndex : 0
      const resp = await fetch(`${base}/api/runs/${runId}/segments/${segmentIndexToUse}/analysis?kinds=sentence,grammar`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || '加载分析结果失败')
      const items = data.items || []
      setSentence(items.find((x) => x.kind === 'sentence') || null)
      setGrammar(items.find((x) => x.kind === 'grammar') || null)
    } catch (e) {
      setError(e.message || '加载分析结果失败')
    } finally {
      setLoading(false)
    }
  }, [runId, segmentIndex, accessToken])

  React.useEffect(() => {
    setSentence(null)
    setGrammar(null)
    setError('')
    fetchExisting()
  }, [fetchExisting])

  const triggerAnalyze = async (kinds = ['sentence','grammar'], { force = false } = {}) => {
    if (!runId || segmentIndex == null || !accessToken) return
    setAnalyzing(true)
    setError('')
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || ''
      const segmentIndexToUse = segmentIndex >= 0 ? segmentIndex : 0
      const resp = await fetch(`${base}/api/runs/${runId}/segments/${segmentIndexToUse}/analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ kinds, force }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || '分析失败')
      const items = data.items || []
      const s = items.find((x) => x.kind === 'sentence' && x.status === 'succeeded')
      const g = items.find((x) => x.kind === 'grammar' && x.status === 'succeeded')
      if (s) setSentence(s)
      if (g) setGrammar(g)
      const failed = items.find((x) => x.status === 'failed')
      if (failed) throw new Error(failed.error || '部分分析失败')
    } catch (e) {
      setError(e.message || '分析失败')
    } finally {
      setAnalyzing(false)
    }
  }

  React.useImperativeHandle(ref, () => ({
    analyze: async (force = false) => {
      await triggerAnalyze(['sentence','grammar'], { force })
    },
    getState: () => ({ analyzing, loading, error, segmentIndex, runId }),
  }), [analyzing, loading, error, segmentIndex, runId])

  function buildVocabList() {
    // 优先使用句子分析返回的 vocab
    const r = sentence?.result || {}
    let items = Array.isArray(r.vocab) ? r.vocab : []
    if (items.length) return items
    // 兜底：从 tokens 里抽取名词/动词/形容词/副词/专有名词
    const tok = Array.isArray(r.tokens) ? r.tokens : []
    const wanted = new Set(['NOUN','PROPN','VERB','ADJ','ADV'])
    const seen = new Set()
    const fallback = []
    for (const t of tok) {
      const w = (t.text || '').trim()
      const pos = (t.pos || '').toUpperCase()
      if (!w || seen.has(w)) continue
      if (!pos || wanted.has(pos)) {
        seen.add(w)
        fallback.push({ word: w, pos: t.pos || '', meaning: '' })
      }
      if (fallback.length >= 5) break
    }
    return fallback
  }

  const renderSentence = (item) => {
    if (!item) return null
    const r = item.result || {}
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {r.summary ? (
          <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{r.summary}</div>
        ) : null}
        {/* 词法展示按需求隐藏 */}
        {Array.isArray(r.phrases) && r.phrases.length ? (
          <div>
            <div style={{ color: '#64748b', fontSize: 13, marginBottom: 4 }}>短语</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {r.phrases.map((p, i) => {
                const label = translatePhrase(p.type)
                return (
                  <li key={i} style={{ fontSize: 13, color: '#334155' }}>{label ? `${label}：` : ''}{p.text}</li>
                )
              })}
            </ul>
          </div>
        ) : null}
        {Array.isArray(r.syntax) && r.syntax.length ? (
          <div>
            <div style={{ color: '#64748b', fontSize: 13, marginBottom: 4 }}>句法要点</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {r.syntax.map((s, i) => {
                const lbl = translateSyntaxLabel(s.label)
                return (
                  <li key={i} style={{ fontSize: 13, color: '#334155' }}>{lbl ? `${lbl}：` : ''}{s.detail || ''}</li>
                )
              })}
            </ul>
          </div>
        ) : null}
        {r.metrics ? <KeyVal k='复杂度' v={typeof r.metrics.complexity === 'number' ? r.metrics.complexity.toFixed(2) : '—'} /> : null}
      </div>
    )
  }

  const renderGrammar = (item) => {
    if (!item) return null
    const r = item.result || {}
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {r.summary ? (
          <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{r.summary}</div>
        ) : null}
        {Array.isArray(r.patterns) && r.patterns.length ? (
          <div>
            <div style={{ color: '#64748b', fontSize: 13, marginBottom: 4 }}>语法点</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {r.patterns.map((p, i) => (
                <li key={i} style={{ fontSize: 13, color: '#334155' }}>{p.name}{p.matchedText ? `：${p.matchedText}` : ''}（{p.rationale || '—'}）</li>
              ))}
            </ul>
          </div>
        ) : null}
        {Array.isArray(r.suggestions) && r.suggestions.length ? (
          <div>
            <div style={{ color: '#64748b', fontSize: 13, marginBottom: 4 }}>建议</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {r.suggestions.map((s, i) => (
                <li key={i} style={{ fontSize: 13, color: '#334155' }}>{s.hint}{s.example ? `（例：${s.example}）` : ''}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {(() => {
          const diff = (r && r.difficulty_score && typeof r.difficulty_score.score === 'number')
            ? r.difficulty_score.score
            : (typeof r.score === 'number' ? r.score : null)
          return <KeyVal k='难度' v={diff != null ? diff.toFixed(2) : '—'} />
        })()}
      </div>
    )
  }

  if (!runId) {
    return <div style={{ color: '#94a3b8', fontSize: 13 }}>暂无 run</div>
  }
  if (segmentIndex == null) {
    return null;
  }

  if (!showSource) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0, overflowY: 'auto' }}>
      {analyzing ? (
        <div style={{
          alignSelf: 'flex-start',
          padding: '4px 8px',
          borderRadius: 999,
          background: '#e0f2fe',
          color: '#0369a1',
          fontSize: 12,
          fontWeight: 600,
        }}>
          分析中…
        </div>
      ) : null}
      <div style={{ fontSize: 13, color: '#64748b' }}>当前句子：<span style={{ color: '#0f172a' }}>{segmentText || '（无文本）'}</span></div>
      {error ? (
        <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.12)', color: '#b91c1c', fontSize: 12 }}>{error}</div>
      ) : null}
      {/* 重点词汇 */}
      {(loading || (buildVocabList().length > 0)) ? (
        <Section title='重点词汇'>
          {loading && !sentence ? (
            <div style={{ color: '#94a3b8', fontSize: 13 }}>加载中…</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {buildVocabList().map((v, i) => (
                <span key={i} style={{ padding: '4px 8px', borderRadius: 999, background: '#f1f5f9', border: '1px solid #e2e8f0', fontSize: 12, color: '#0f172a' }}>
                  {v.word}{v.pos ? `/${translatePos(v.pos)}` : ''}{v.meaning ? ` — ${v.meaning}` : ''}
                </span>
              ))}
              {buildVocabList().length === 0 ? (
                <span style={{ color: '#94a3b8', fontSize: 13 }}>暂无数据</span>
              ) : null}
            </div>
          )}
        </Section>
      ) : null}

      {(loading || sentence) ? (
        <Section title='句子分析'>
          {loading && !sentence ? <div style={{ color: '#94a3b8', fontSize: 13 }}>加载中…</div> : renderSentence(sentence)}
        </Section>
      ) : null}
      {(loading || grammar) ? (
        <Section title='语法分析'>
          {loading && !grammar ? <div style={{ color: '#94a3b8', fontSize: 13 }}>加载中…</div> : renderGrammar(grammar)}
        </Section>
      ) : null}
    </div>
  )
})

export default AnalysisPanel
