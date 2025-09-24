import crypto from 'crypto'
import prisma from './prisma'
import { recordAuditLog, AuditKinds } from './audit'

// 按需"写死"默认模型为 gemini-2.5-pro（忽略环境变量）
const DEFAULT_MODEL = 'gemini-2.5-pro'
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY
const API_BASES = [
  'https://generativelanguage.googleapis.com/v1beta',
  'https://generativelanguage.googleapis.com/v1',
]

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const keys = Object.keys(value).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`
}

function hashParams(params) {
  return crypto.createHash('sha256').update(stableStringify(params)).digest('hex')
}

function mapModelAlias(id) {
  if (!id) return 'gemini-1.5-pro'
  const lower = id.toLowerCase()
  // 常见别名/误写映射
  if (lower.includes('w.5')) return 'gemini-1.5-pro'
  // 兼容常见新型号命名，直接放行由后续探测处理
  if (lower.startsWith('gemini-2.')) return `gemini-${lower.split('gemini-')[1]}`
  if (lower === 'gemini-pro') return 'gemini-1.5-pro'
  return id
}

function normalizeModelId(modelId = DEFAULT_MODEL) {
  const mapped = mapModelAlias((modelId || '').trim())
  const id = mapped || 'gemini-1.5-pro'
  return id.includes('/') ? id : `models/${id}`
}

function ensureApiKey() {
  if (!API_KEY) {
    const err = new Error('缺少 GOOGLE_GENAI_API_KEY 环境变量用于调用 Gemini')
    err.statusCode = 500
    throw err
  }
}

function buildSentencePrompt(text, locale = 'zh-CN') {
  return `你是一名英语教学助手，请对给定英文句子进行“句子分析”。直接输出 JSON，不要输出多余说明。
要求：
1) 词法分解（尽量标注 POS 与 lemma）
2) 短语结构（NP/VP/PP/AdjP/AdvP 等）
3) 句法要点与信息结构（主谓宾、从句、并列、时态、语态等）
4) 难度与复杂度评分（0~1）
5) 重点词汇（最多 5 个）：挑选关键信息词，给出中文释义，可附简短备注
只用中文说明。

句子：${text}

JSON Schema:
{
  "tokens": [{"text": string, "pos"?: string, "lemma"?: string}],
  "phrases": [{"type": string, "text": string}],
  "syntax": [{"label": string, "detail": string}],
  "metrics": {"length": number, "avgWordLen"?: number, "complexity": number},
  "vocab"?: [{"word": string, "pos"?: string, "meaning": string, "note"?: string}],
  "summary": string
}`
}

function buildOverviewPrompt(text) {
  return `你是一名专业的英语教学内容编辑。请针对整段英文文本，输出内容简介与重点词汇。
严格只输出 JSON（不要多余文字）：
{
  "description": string, // 200字以内的中文简介，概括这段音频/文本讲了什么
  "vocab": [ // 最多 8 个重点词汇
    {
      "word": string,      // 原词
      "phonetic"?: string,  // 音标（可选）
      "definition": string, // 英文释义
      "translation": string // 中文释义
    }
  ]
}

英文全文：\n${text}`
}

function buildGrammarPrompt(text) {
  return `
# Role & Goal
你是一名专家级的英语语法学家和ESL（English as a Second Language）教师。你的任务是为一个给定的英文句子提供全面、精确的语法和结构分析。

# Core Instructions
1.  **结构分解**: 首先，分析句子的主干结构，识别出主语 (Subject)、谓语 (Verb)、宾语 (Object)、补语 (Complement)、状语 (Adverbial) 等核心成分。
2.  **语法点识别**: 精准识别句子中包含的所有关键语法点，例如时态、语态、情态动词、从句类型（定语、状语、名词性从句）、非谓语动词（不定式、动名词、分词）、特殊句型（倒装、强调、虚拟语气）等。
3.  **提供建议**: 提供具体的、可行的学习建议和用法说明，帮助用户更好地理解和运用类似语法结构。
4.  **难度评估**: 根据句子的结构复杂性、词汇难度和语法点，对句子进行0.0到1.0的难度评分，并给出简要的总结。

# Output Format
- **严格要求**: 必须直接输出一个格式正确的 JSON 对象，不包含任何额外的解释、介绍性文字或 Markdown 标记 (例如 \`\`\`json)。
- **语言**: JSON 对象中的所有说明、理由和消息都必须使用中文。

## Sentence for Analysis:
${text}

## JSON Schema & Field Explanations:
{
  "main_structure": {
    "subject": string,
    "verb": string,
    "object": string,
    "complement"?: string,
    "adverbial"?: string[]
  },
  "patterns": [
    { "name": string, "matchedText": string, "rationale": string }
  ],
  "suggestions": [
    { "hint": string, "example": string }
  ],
  "difficulty_score": {
    "score": number,
    "rationale": string
  },
  "summary": string
}

## Example:
### Input Sentence:
"Though challenging, the project he is working on will ultimately benefit the entire community."

### Expected JSON Output:
{
  "main_structure": {
    "subject": "the project he is working on",
    "verb": "will ultimately benefit",
    "object": "the entire community",
    "adverbial": ["Though challenging"]
  },
  "patterns": [
    {
      "name": "让步状语(分词形式)",
      "matchedText": "Though challenging",
      "rationale": "分词'challenging'作状语，补充说明主句情况，由'Though'引导，表示让步关系，完整形式是'Though it is challenging'。"
    },
    {
      "name": "定语从句",
      "matchedText": "he is working on",
      "rationale": "此从句修饰先行词'project'，关系代词'that'或'which'被省略。"
    },
    {
      "name": "一般将来时",
      "matchedText": "will ultimately benefit",
      "rationale": "使用'will' + 动词原形'benefit'，表示对未来的预测。"
    }
  ],
  "suggestions": [
    {
      "hint": "让步状语的分词结构是英语中常见的简洁表达方式，学会识别和使用此类结构能让表达更加精炼。",
      "example": "Though tired, she continued working. (Though she was tired, she continued working.)"
    },
    {
      "hint": "定语从句中关系代词的省略是英语中的常见现象，当关系代词在从句中作宾语时通常可以省略。",
      "example": "The book (that) I bought yesterday is interesting."
    }
  ],
  "difficulty_score": {
    "score": 0.6,
    "rationale": "句子包含了省略形式的状语和省略关系代词的定语从句，结构较复杂。"
  },
  "summary": "这是一个复合句，由'Though'引导的省略分词状语开头，主句的主语是一个由定语从句修饰的名词短语，谓语动词为将来时。"
}`
}

async function callGeminiJson({ modelId = DEFAULT_MODEL, prompt }) {
  ensureApiKey()
  const normalized = normalizeModelId(modelId) // e.g. models/gemini-2.5-pro
  const baseId = normalized.replace(/^models\//, '')
  // 候选模型列表（按优先级）
  const modelIds = [
    baseId,
    `${baseId}-latest`,
    'gemini-1.5-pro',
    'gemini-1.5-pro-latest',
    'gemini-2.0-flash',
    'gemini-2.0-flash-latest',
  ]
  // 去重并加上 models/ 前缀
  const candidates = Array.from(new Set(modelIds)).map((id) => (id.startsWith('models/') ? id : `models/${id}`))
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }]}],
    generationConfig: { temperature: 0.2, topP: 0.9 },
  }
  let lastErr = null
  for (const base of API_BASES) {
    for (const model of candidates) {
      const url = `${base}/${model}:generateContent`
      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
          body: JSON.stringify(body),
        })
        if (!resp.ok) {
          const detail = await resp.text().catch(() => resp.statusText)
          const err = new Error(`Gemini API 调用失败: ${resp.status}`)
          err.detail = detail
          err.model = model
          err.url = url
          lastErr = err
          continue
        }
        const data = await resp.json()
        const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || ''
        try {
          return JSON.parse(text)
        } catch (e) {
          const match = text.match(/\{[\s\S]*\}/)
          if (match) return JSON.parse(match[0])
          const err = new Error('Gemini 返回内容非 JSON 格式')
          err.raw = text
          throw err
        }
      } catch (e) {
        lastErr = e
      }
    }
  }
  throw lastErr || new Error('Gemini API 调用失败')
  // Unreachable
}

export async function analyzeSegmentWithGemini({
  runId,
  segmentIndex,
  kind, // 'sentence' | 'grammar'
  text,
  language,
  engine = 'gemini',
  modelId = DEFAULT_MODEL,
  force = false,
  extraParams = {},
  prismaClient = prisma,
  userId = null,
}) {
  if (!text || typeof text !== 'string') {
    const err = new Error('缺少待分析的文本')
    err.statusCode = 400
    throw err
  }
  if (!runId || segmentIndex == null) {
    const err = new Error('缺少 runId 或 segmentIndex')
    err.statusCode = 400
    throw err
  }

  const params = { language: language || 'en-US', modelId, ...extraParams }
  const paramsHash = hashParams({ kind, engine, ...params })

  // 先查是否已有相同唯一键的记录，避免并发/重复创建
  const existingAny = await prismaClient.analysis.findFirst({
    where: { runId, segmentIndex, kind, engine, paramsHash },
    orderBy: { createdAt: 'desc' },
  })

  if (existingAny && !force && existingAny.status === 'succeeded') {
    return { analysis: existingAny, reused: true }
  }

  let created
  if (existingAny) {
    // 复用旧记录，置为 processing，清理错误与完成时间
    created = await prismaClient.analysis.update({
      where: { id: existingAny.id },
      data: { status: 'processing', error: null, completedAt: null },
    })
  } else {
    try {
      created = await prismaClient.analysis.create({
        data: {
          runId,
          segmentIndex,
          kind,
          engine,
          params,
          paramsHash,
          status: 'processing',
        },
      })
    } catch (e) {
      // 处理极端并发下的唯一键竞争：回退到查询并更新
      if (e?.code === 'P2002') {
        const fallback = await prismaClient.analysis.findFirst({
          where: { runId, segmentIndex, kind, engine, paramsHash },
        })
        if (fallback) {
          created = await prismaClient.analysis.update({
            where: { id: fallback.id },
            data: { status: 'processing', error: null, completedAt: null },
          })
        } else {
          throw e
        }
      } else {
        throw e
      }
    }
  }

  await recordAuditLog({ userId, kind: AuditKinds.ANALYZE_START, targetId: runId, meta: { segmentIndex, kind, engine } }).catch(() => undefined)

  try {
    let prompt
    if (kind === 'sentence') prompt = buildSentencePrompt(text)
    else if (kind === 'grammar') prompt = buildGrammarPrompt(text)
    else if (kind === 'translation') prompt = `请把下面的英文句子翻译成自然、通顺的中文，避免逐词直译，保持地道表达。只输出 JSON：{"zh": "..."}，不要输出其他文字。\n\n英文：${text}\nJSON: {"zh": "..."}`
    else if (kind === 'overview') prompt = buildOverviewPrompt(text)
    else throw new Error('不支持的分析类型')

    const result = await callGeminiJson({ modelId, prompt })

    const summary = result?.summary || (kind === 'sentence' ? '句子分析完成' : kind === 'grammar' ? '语法分析完成' : '')
    const score = typeof result?.score === 'number' ? result.score : (result?.metrics?.complexity ?? null)

    const completed = await prismaClient.analysis.update({
      where: { id: created.id },
      data: {
        status: 'succeeded',
        result,
        summary: typeof summary === 'string' ? summary : null,
        score: typeof score === 'number' ? score : null,
        completedAt: new Date(),
      },
    })

    await recordAuditLog({ userId, kind: AuditKinds.ANALYZE_END, targetId: runId, meta: { segmentIndex, kind, engine } }).catch(() => undefined)
    return { analysis: completed, reused: false }
  } catch (error) {
    await prismaClient.analysis.update({
      where: { id: created.id },
      data: {
        status: 'failed',
        error: error.message || '分析失败',
        completedAt: new Date(),
      },
    }).catch(() => undefined)
    await recordAuditLog({ userId, kind: AuditKinds.ANALYZE_FAILED, targetId: runId, meta: { segmentIndex, kind, engine, message: error.message } }).catch(() => undefined)
    throw error
  }
}
