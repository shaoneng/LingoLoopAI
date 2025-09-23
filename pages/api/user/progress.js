import { setCors } from '../../../lib/cors';
import prisma from '../../../lib/prisma';
import { requireAuth } from '../../../lib/middleware/auth';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const { user } = await requireAuth(req);

    if (req.method === 'GET') {
      return await handleGetProgress(req, res, user);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Progress error:', error);
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: '服务器错误' });
  }
}

async function handleGetProgress(req, res, user) {
  try {
    // 获取当前时间
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // 本周开始（周日）
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // 本周结束（周六）

    // 获取用户的学习目标（从用户设置中获取，如果没有则使用默认值）
    const userSettings = user.settings || {};
    const dailyMinutesGoal = userSettings.dailyMinutesGoal || 30;
    const weeklyMinutesGoal = userSettings.weeklyMinutesGoal || 210;

    // 获取今日学习数据
    const todaySessions = await prisma.learningSession.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        createdAt: {
          gte: today,
        },
      },
      include: {
        audioFile: {
          select: {
            filename: true,
            durationMs: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 获取本周学习数据
    const weeklySessions = await prisma.learningSession.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        createdAt: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    });

    // 获取所有学习数据
    const allSessions = await prisma.learningSession.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
      },
      include: {
        audioFile: {
          select: {
            filename: true,
            durationMs: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // 最近10条记录
    });

    // 计算今日完成分钟数
    const dailyMinutesCompleted = Math.round(
      todaySessions.reduce((sum, session) => {
        return sum + (session.listeningTimeMs / 1000 / 60);
      }, 0)
    );

    // 计算本周完成分钟数
    const weeklyMinutesCompleted = Math.round(
      weeklySessions.reduce((sum, session) => {
        return sum + (session.listeningTimeMs / 1000 / 60);
      }, 0)
    );

    // 计算总体统计数据
    const totalListeningHours = Math.round(
      allSessions.reduce((sum, session) => {
        return sum + (session.listeningTimeMs / 1000 / 60 / 60);
      }, 0)
    );

    const totalCompletedSegments = allSessions.reduce((sum, session) => {
      return sum + (session.completedSegments || 0);
    }, 0);

    const totalRecordings = allSessions.reduce((sum, session) => {
      return sum + (session.recordingCount || 0);
    }, 0);

    // 计算平均分数
    const sessionsWithScores = allSessions.filter(session => session.score !== null);
    const averageScore = sessionsWithScores.length > 0
      ? Math.round(
          sessionsWithScores.reduce((sum, session) => sum + session.score, 0) / sessionsWithScores.length
        )
      : 0;

    // 生成学习建议
    const suggestions = generateSuggestions({
      dailyMinutesCompleted,
      weeklyMinutesCompleted,
      totalListeningHours,
      totalCompletedSegments,
      totalRecordings,
      dailyMinutesGoal,
      weeklyMinutesGoal,
    });

    return res.status(200).json({
      progress: {
        dailyMinutesGoal,
        weeklyMinutesGoal,
        dailyMinutesCompleted,
        weeklyMinutesCompleted,
        totalListeningHours,
        totalCompletedSegments,
        totalRecordings,
        averageScore,
        recentSessions: allSessions.map(session => ({
          id: session.id,
          audioTitle: session.audioFile?.filename || '未知音频',
          createdAt: session.createdAt,
          listeningTimeMs: session.listeningTimeMs,
          completedSegments: session.completedSegments,
          score: session.score,
        })),
        suggestions,
      },
    });
  } catch (error) {
    console.error('Get progress error:', error);
    return res.status(500).json({ error: '获取学习进度失败' });
  }
}

function generateSuggestions(stats) {
  const suggestions = [];

  // 每日目标建议
  if (stats.dailyMinutesCompleted < stats.dailyMinutesGoal * 0.5) {
    suggestions.push('今日学习时长不足，建议增加听音练习时间');
  } else if (stats.dailyMinutesCompleted >= stats.dailyMinutesGoal) {
    suggestions.push('今日学习目标已完成，继续保持！');
  }

  // 每周目标建议
  if (stats.weeklyMinutesCompleted < stats.weeklyMinutesGoal * 0.7) {
    suggestions.push('本周学习进度较慢，建议制定学习计划');
  }

  // 听音时长建议
  if (stats.totalListeningHours < 5) {
    suggestions.push('建议增加每日听音时长，培养英语听力习惯');
  } else if (stats.totalListeningHours >= 20) {
    suggestions.push('听音时长充足，可以尝试更难的材料');
  }

  // 句子完成建议
  if (stats.totalCompletedSegments < 50) {
    suggestions.push('建议多进行句子练习，提高听力理解能力');
  }

  // 录音练习建议
  if (stats.totalRecordings < 10) {
    suggestions.push('建议多进行录音练习，提高口语表达能力');
  }

  // 综合建议
  if (stats.dailyMinutesCompleted >= stats.dailyMinutesGoal && stats.totalRecordings === 0) {
    suggestions.push('可以尝试录音功能，进行跟读练习');
  }

  if (suggestions.length === 0) {
    suggestions.push('继续保持当前学习节奏！');
  }

  return suggestions;
}