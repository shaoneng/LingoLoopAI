import { setCors } from '../../../lib/cors';
import { requireAuth } from '../../../lib/middleware/auth';
import {
  fetchLearningSessionsWithAudio,
  fetchRecentSessionTimestamps,
} from '../../../lib/supabase/learningSessions';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const { user } = await requireAuth(req);

    if (req.method === 'GET') {
      return await handleGetStats(req, res, user);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Learning stats error:', error);
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: '服务器错误' });
  }
}

async function handleGetStats(req, res, user) {
  try {
    // 获取当前时间
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // 本周开始（周日）
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // 本周结束（周六）

    // 获取用户的所有学习会话
    const learningSessions = await fetchLearningSessionsWithAudio(user.id);

    // 计算总体统计
    const totalSessions = learningSessions.length;
    const totalMinutes = Math.round(
      learningSessions.reduce((sum, session) => {
        const durationMs = session.audioFile?.durationMs || 0;
        return sum + (durationMs / 1000 / 60); // 转换为分钟
      }, 0)
    );

    // 假设每个会话平均完成的句子数（这里需要根据实际业务逻辑调整）
    const totalSegments = learningSessions.reduce((sum, session) => {
      return sum + (session.completedSegments || 0);
    }, 0);

    // 计算连续学习天数
    const streakDays = await calculateStreakDays(user.id);

    // 计算本周统计
    const weeklySessions = learningSessions.filter(session => {
      const sessionDate = new Date(session.createdAt);
      return sessionDate >= weekStart && sessionDate <= weekEnd;
    });

    const weeklyMinutes = Math.round(
      weeklySessions.reduce((sum, session) => {
        const durationMs = session.audioFile?.durationMs || 0;
        return sum + (durationMs / 1000 / 60);
      }, 0)
    );

    const weeklySegments = weeklySessions.reduce((sum, session) => {
      return sum + (session.completedSegments || 0);
    }, 0);

    // 计算今日统计
    const todaySessions = learningSessions.filter(session => {
      const sessionDate = new Date(session.createdAt);
      return sessionDate >= today;
    });

    const todayMinutes = Math.round(
      todaySessions.reduce((sum, session) => {
        const durationMs = session.audioFile?.durationMs || 0;
        return sum + (durationMs / 1000 / 60);
      }, 0)
    );

    // 计算目标完成度（假设每日目标30分钟，每周目标210分钟）
    const dailyGoalMinutes = 30;
    const weeklyGoalMinutes = 210;

    const dailyProgress = Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100));
    const weeklyProgress = Math.min(100, Math.round((weeklyMinutes / weeklyGoalMinutes) * 100));

    // 计算成就徽章
    const achievements = calculateAchievements({
      totalSessions,
      totalMinutes,
      streakDays,
      totalSegments
    });

    return res.status(200).json({
      stats: {
        totalSessions,
        totalMinutes,
        totalSegments,
        streakDays,
        weeklySessions: weeklySessions.length,
        weeklyMinutes,
        weeklySegments,
        dailyProgress,
        weeklyProgress,
        achievements,
        todayMinutes,
        todaySessions: todaySessions.length
      },
    });
  } catch (error) {
    console.error('Get learning stats error:', error);
    return res.status(500).json({ error: '获取学习统计失败' });
  }
}

async function calculateStreakDays(userId) {
  // 这里简化实现，实际应该按日期分组计算连续学习天数
  const sessions = await fetchRecentSessionTimestamps(userId, 30);

  if (sessions.length === 0) return 0;

  // 简化：如果有最近的学习会话，返回1，否则返回0
  const latestSession = new Date(sessions[0].createdAt);
  const today = new Date();
  const daysDiff = Math.floor((today - latestSession) / (1000 * 60 * 60 * 24));

  return daysDiff <= 1 ? 1 : 0;
}

function calculateAchievements(stats) {
  const achievements = [];

  if (stats.totalSessions >= 1) {
    achievements.push('初学者');
  }

  if (stats.totalSessions >= 10) {
    achievements.push('坚持学习者');
  }

  if (stats.totalSessions >= 50) {
    achievements.push('学习达人');
  }

  if (stats.totalMinutes >= 60) {
    achievements.push('一小时俱乐部');
  }

  if (stats.totalMinutes >= 300) {
    achievements.push('五小时俱乐部');
  }

  if (stats.streakDays >= 7) {
    achievements.push('一周坚持');
  }

  if (stats.streakDays >= 30) {
    achievements.push('一月坚持');
  }

  if (stats.totalSegments >= 100) {
    achievements.push('百句达成');
  }

  if (stats.totalSegments >= 500) {
    achievements.push('五百句达成');
  }

  return achievements;
}
