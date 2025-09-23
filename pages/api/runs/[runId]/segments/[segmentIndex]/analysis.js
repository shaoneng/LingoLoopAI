import { setCors } from '../../../../../../lib/cors'
import prisma from '../../../../../../lib/prisma'
import { requireAuth, enforceSoftDelete } from '../../../../../../lib/middleware/auth'
import { analyzeSegmentWithGemini } from '../../../../../../lib/analysis'

function parseKinds(input) {
  if (!input) return ['sentence', 'grammar']
  if (Array.isArray(input)) return input.map((x) => x.toString())
  return input.toString().split(',').map((s) => s.trim()).filter(Boolean)
}

function toInt(value) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.floor(n) : NaN
}

export default async function handler(req, res) {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { user } = await requireAuth(req)
    const runId = req.query?.runId?.toString()
    const segStr = req.query?.segmentIndex?.toString()
    const segIdx = toInt(segStr)
    if (!runId || !Number.isInteger(segIdx) || segIdx < 0) {
      return res.status(400).json({ error: '缺少有效的 runId 或 segmentIndex。' })
    }

    // Check if this is a BBC resource request
    if (runId.startsWith('shared-bbc-')) {
      return await handleBBCResourceAnalysis(req, res, runId, segIdx, user)
    }

    const run = await prisma.transcriptRun.findFirst({
      where: { id: runId, audio: { userId: user.id } },
      select: {
        id: true,
        segments: true,
        audio: { select: { id: true, language: true, deletedAt: true } },
      },
    })

    if (!run || !run.audio) return res.status(404).json({ error: '转写记录不存在或无权访问。' })
    enforceSoftDelete(run.audio, '音频不存在或已删除。')

    const segments = Array.isArray(run.segments) ? run.segments : []
    if (segIdx >= segments.length) {
      return res.status(400).json({ error: 'segmentIndex 超出范围。' })
    }
    const text = segments[segIdx]?.text || ''
    if (!text) return res.status(400).json({ error: '该分段缺少可分析的文本。' })

    if (req.method === 'GET') {
      const kinds = parseKinds(req.query?.kinds)
      const items = await prisma.analysis.findMany({
        where: { runId, segmentIndex: segIdx, kind: { in: kinds }, status: 'succeeded' },
        orderBy: { createdAt: 'desc' },
      })
      return res.status(200).json({ items })
    }

    if (req.method === 'POST') {
      const kinds = parseKinds(req.body?.kinds)
      const force = req.body?.force === true || String(req.body?.force).toLowerCase() === 'true'
      const engine = 'gemini'
      // 写死模型为 gemini-2.5-pro
      const modelId = 'gemini-2.5-pro'

      const results = []
      for (const kind of kinds) {
        try {
          const { analysis, reused } = await analyzeSegmentWithGemini({
            runId,
            segmentIndex: segIdx,
            kind,
            text,
            language: run.audio?.language || 'en-US',
            engine,
            modelId,
            force,
            prismaClient: prisma,
            userId: user.id,
          })
          results.push({ kind, status: analysis.status, analysisId: analysis.id, reused, summary: analysis.summary, score: analysis.score, result: analysis.result })
        } catch (error) {
          results.push({ kind, status: 'failed', error: error.message || '分析失败' })
        }
      }
      return res.status(200).json({ items: results })
    }
  } catch (error) {
    if (error?.statusCode) return res.status(error.statusCode).json({ error: error.message || '请求失败' })
    console.error('Segment analysis handler error:', error)
    return res.status(500).json({ error: '分析请求失败，请稍后再试。' })
  }
}

async function handleBBCResourceAnalysis(req, res, runId, segmentIndex, user) {
  try {
    const resourceId = runId.replace('shared-bbc-', '');

    // Get the BBC resource
    const resource = await prisma.sharedBbcResource.findUnique({
      where: { id: resourceId },
    });

    if (!resource || !resource.isPublished) {
      return res.status(404).json({ error: '资源不存在' });
    }

    // Check user access for BBC resource
    const hasActiveSubscription = await checkUserSubscription(user.id);
    if (user.role !== 'ADMIN' && !hasActiveSubscription) {
      // Count how many published resources exist
      const totalCount = await prisma.sharedBbcResource.count({
        where: { isPublished: true },
      });

      // Count resources published before this one
      const beforeCount = await prisma.sharedBbcResource.count({
        where: {
          isPublished: true,
          OR: [
            { publishDate: { lt: resource.publishDate || resource.createdAt } },
            {
              publishDate: resource.publishDate || resource.createdAt,
              createdAt: { lt: resource.createdAt },
            },
          ],
        },
      });

      // If this resource is not in the first 5, deny access
      if (beforeCount >= 5) {
        return res.status(403).json({ error: '需要订阅才能访问此资源' });
      }
    }

    // Check if segment exists
    if (!resource.segments || !Array.isArray(resource.segments) || segmentIndex >= resource.segments.length) {
      return res.status(400).json({ error: '段落不存在' });
    }

    const segment = resource.segments[segmentIndex];
    const text = segment.text || segment.sourceText || '';
    if (!text) return res.status(400).json({ error: '该分段缺少可分析的文本。' });

    if (req.method === 'GET') {
      // Return existing BBC analysis (generated on demand)
      const analysis = await generateBBCSegmentAnalysis(segment, segmentIndex);
      return res.status(200).json({
        items: [
          {
            id: `bbc-${resourceId}-segment-${segmentIndex}-sentence`,
            kind: 'sentence',
            status: 'succeeded',
            result: analysis.sentence,
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString()
          },
          {
            id: `bbc-${resourceId}-segment-${segmentIndex}-grammar`,
            kind: 'grammar',
            status: 'succeeded',
            result: analysis.grammar,
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString()
          }
        ]
      });
    } else if (req.method === 'POST') {
      const kinds = parseKinds(req.body?.kinds);
      const force = req.body?.force === true || String(req.body?.force).toLowerCase() === 'true';

      const items = [];

      if (kinds.includes('sentence')) {
        const analysis = await generateBBCSegmentAnalysis(segment, segmentIndex);
        items.push({
          id: `bbc-${resourceId}-segment-${segmentIndex}-sentence`,
          kind: 'sentence',
          status: 'succeeded',
          result: analysis.sentence,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        });
      }

      if (kinds.includes('grammar')) {
        const analysis = await generateBBCSegmentAnalysis(segment, segmentIndex);
        items.push({
          id: `bbc-${resourceId}-segment-${segmentIndex}-grammar`,
          kind: 'grammar',
          status: 'succeeded',
          result: analysis.grammar,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        });
      }

      return res.status(200).json({ items });
    }
  } catch (error) {
    console.error('BBC segment analysis error:', error);
    return res.status(500).json({ error: '分析失败' });
  }
}

async function generateBBCSegmentAnalysis(segment, segmentIndex) {
  const text = segment.text || segment.sourceText || '';

  // Basic sentence analysis
  const sentence = {
    summary: `这是BBC音频第${segmentIndex + 1}段的内容分析。该段落包含了与主题相关的英文表达和词汇。`,
    phrases: extractPhrases(text),
    syntax: [
      {
        label: 'sentence_structure',
        detail: '这是一个标准的英文句子结构，适合英语学习者理解。'
      }
    ],
    vocab: extractVocabulary(text),
    tokens: generateTokens(text)
  };

  // Basic grammar analysis
  const grammar = {
    tense: 'mixed',
    voice: 'active',
    structure: 'standard',
    notes: '这段文字使用了标准的英文语法结构，包含常用的时态和句式。'
  };

  return { sentence, grammar };
}

function extractPhrases(text) {
  // Simple phrase extraction
  const phrases = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  sentences.forEach((sentence, index) => {
    if (sentence.trim().length > 10) {
      phrases.push({
        text: sentence.trim(),
        type: 'phrase',
        start: index,
        end: index + 1
      });
    }
  });

  return phrases.slice(0, 3);
}

function extractVocabulary(text) {
  if (!text) return [];

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && word.length < 15)
    .filter(word => /^[a-z]+$/.test(word))
    .slice(0, 5);

  return words.map(word => ({
    word: word,
    pos: guessPartOfSpeech(word),
    meaning: `${word}的含义需要结合上下文理解，建议查阅词典获取准确释义。`
  }));
}

function guessPartOfSpeech(word) {
  if (word.endsWith('ing')) return 'VERB';
  if (word.endsWith('ed')) return 'VERB';
  if (word.endsWith('ly')) return 'ADV';
  if (word.endsWith('tion') || word.endsWith('sion')) return 'NOUN';
  if (word.endsWith('ness')) return 'NOUN';
  if (word.endsWith('ment')) return 'NOUN';
  if (word.endsWith('ful') || word.endsWith('less')) return 'ADJ';
  return 'NOUN';
}

function generateTokens(text) {
  return text.split(/\s+/).map((token, index) => ({
    text: token,
    pos: guessPartOfSpeech(token),
    index: index
  }));
}

async function checkUserSubscription(userId) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) return false;

    return subscription.status === 'ACTIVE' &&
           new Date(subscription.expiresAt) > new Date();
  } catch (error) {
    console.error('Check subscription error:', error);
    return false;
  }
}
