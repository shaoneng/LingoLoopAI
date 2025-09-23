import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function ProgressTracker() {
  const { user, accessToken } = useAuth();
  const [progress, setProgress] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (user && accessToken) {
      fetchProgress();
    }
  }, [user, accessToken]);

  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/user/progress', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取学习进度失败');
      }

      const data = await response.json();
      setProgress(data.progress);
    } catch (err) {
      setError(err.message);
      console.error('Progress error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>加载进度中...</div>
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

  if (!progress) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>暂无学习进度</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>
        学习进度追踪
      </h2>

      {/* 学习目标 */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '500' }}>
          学习目标
        </h3>
        <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '14px' }}>每日学习时长</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                {progress.dailyMinutesCompleted || 0} / {progress.dailyMinutesGoal || 30} 分钟
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
                width: `${Math.min(100, ((progress.dailyMinutesCompleted || 0) / (progress.dailyMinutesGoal || 30)) * 100)}%`,
                height: '100%',
                backgroundColor: '#007bff',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '14px' }}>每周学习时长</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                {progress.weeklyMinutesCompleted || 0} / {progress.weeklyMinutesGoal || 210} 分钟
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
                width: `${Math.min(100, ((progress.weeklyMinutesCompleted || 0) / (progress.weeklyMinutesGoal || 210)) * 100)}%`,
                height: '100%',
                backgroundColor: '#28a745',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* 近期学习记录 */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '500' }}>
          近期学习记录
        </h3>
        <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
          {progress.recentSessions && progress.recentSessions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {progress.recentSessions.slice(0, 5).map((session, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: index < progress.recentSessions.length - 1 ? '1px solid #e9ecef' : 'none'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>
                      {session.audioTitle || '未知音频'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {new Date(session.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#28a745' }}>
                      {Math.round(session.listeningTimeMs / 1000 / 60)} 分钟
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {session.completedSegments || 0} 句
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#666', fontSize: '14px', textAlign: 'center' }}>
              暂无学习记录
            </div>
          )}
        </div>
      </div>

      {/* 技能进展 */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '500' }}>
          技能进展
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div style={{
            backgroundColor: '#e8f5e8',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
              {progress.totalListeningHours || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>总听音时长（小时）</div>
          </div>

          <div style={{
            backgroundColor: '#e8f4fd',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
              {progress.totalCompletedSegments || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>完成句子数</div>
          </div>

          <div style={{
            backgroundColor: '#fff3cd',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
              {progress.averageScore || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>平均分数</div>
          </div>

          <div style={{
            backgroundColor: '#f8d7da',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
              {progress.totalRecordings || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>录音次数</div>
          </div>
        </div>
      </div>

      {/* 学习建议 */}
      <div>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '500' }}>
          学习建议
        </h3>
        <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
          {progress.suggestions && progress.suggestions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {progress.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}
                >
                  <div style={{ fontSize: '16px', color: '#007bff' }}>
                    💡
                  </div>
                  <div style={{ fontSize: '14px', color: '#333', flex: 1 }}>
                    {suggestion}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#666', fontSize: '14px' }}>
              继续保持当前学习节奏！
            </div>
          )}
        </div>
      </div>

      {/* 刷新按钮 */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button
          onClick={fetchProgress}
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
          刷新进度
        </button>
      </div>
    </div>
  );
}