import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LearningStats() {
  const { user, accessToken } = useAuth();
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (user && accessToken) {
      fetchLearningStats();
    }
  }, [user, accessToken]);

  const fetchLearningStats = async () => {
    try {
      const response = await fetch('/api/user/learning-stats', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取学习统计失败');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      setError(err.message);
      console.error('Learning stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>加载学习统计中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ color: '#dc3545' }}>{error}</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>暂无学习数据</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>
        学习统计
      </h2>

      {/* 总体统计 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '16px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>
            {stats.totalSessions || 0}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>总学习次数</div>
        </div>

        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '16px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>
            {stats.totalMinutes || 0}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>总学习时长（分钟）</div>
        </div>

        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '16px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffc107' }}>
            {stats.totalSegments || 0}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>完成句子数</div>
        </div>

        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '16px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#17a2b8' }}>
            {stats.streakDays || 0}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>连续学习天数</div>
        </div>
      </div>

      {/* 本周统计 */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '500' }}>
          本周学习
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px'
        }}>
          <div style={{ backgroundColor: '#e8f5e8', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>
              {stats.weeklySessions || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>学习次数</div>
          </div>

          <div style={{ backgroundColor: '#e8f5e8', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>
              {stats.weeklyMinutes || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>学习时长</div>
          </div>

          <div style={{ backgroundColor: '#e8f5e8', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>
              {stats.weeklySegments || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>完成句子</div>
          </div>
        </div>
      </div>

      {/* 学习进度 */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '500' }}>
          学习进度
        </h3>
        <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '14px' }}>今日目标完成度</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                {stats.dailyProgress || 0}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e9ecef',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${stats.dailyProgress || 0}%`,
                height: '100%',
                backgroundColor: '#007bff',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '14px' }}>本周目标完成度</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                {stats.weeklyProgress || 0}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e9ecef',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${stats.weeklyProgress || 0}%`,
                height: '100%',
                backgroundColor: '#28a745',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* 成就徽章 */}
      <div>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '500' }}>
          成就徽章
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {stats.achievements && stats.achievements.length > 0 ? (
            stats.achievements.map((achievement, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: '#fff3cd',
                  padding: '8px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#856404',
                  border: '1px solid #ffeaa7'
                }}
              >
                🏆 {achievement}
              </div>
            ))
          ) : (
            <div style={{ color: '#666', fontSize: '14px' }}>
              继续学习以解锁成就徽章！
            </div>
          )}
        </div>
      </div>

      {/* 刷新按钮 */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button
          onClick={fetchLearningStats}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          刷新统计
        </button>
      </div>
    </div>
  );
}