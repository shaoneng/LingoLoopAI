import React, { useState, useEffect, useCallback } from 'react';
import { useEvents } from '../contexts/EventContext';
import { useAuth } from '../contexts/AuthContext';

const STATUS_LABELS = {
  queued: '排队中',
  processing: '处理中',
  succeeded: '已完成',
  failed: '失败'
};

const STATUS_COLORS = {
  queued: 'text-yellow-600 bg-yellow-50',
  processing: 'text-blue-600 bg-blue-50',
  succeeded: 'text-green-600 bg-green-50',
  failed: 'text-red-600 bg-red-50'
};

const PROGRESS_STEPS = {
  queued: 10,
  processing: 50,
  succeeded: 100,
  failed: 0
};

export const TranscriptionStatus = ({ runId, audioId, onStatusChange, onCompleted }) => {
  const { accessToken } = useAuth();
  const { subscribeToRun, pollRunProgress } = useEvents();
  const [status, setStatus] = useState('queued');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isPolling, setIsPolling] = useState(false);

  // 格式化时间
  const formatTime = useCallback((seconds) => {
    if (!seconds || seconds <= 0) return '未知';
    if (seconds < 60) return `${Math.ceil(seconds)}秒`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}分钟`;
  }, []);

  // 获取进度信息
  const fetchProgress = useCallback(async () => {
    if (!accessToken || !runId) return;

    try {
      const data = await pollRunProgress(runId);
      if (data) {
        setStatus(data.status);
        setProgress(data.progress);
        setTimeElapsed(data.timeElapsed);
        setEstimatedTimeRemaining(data.estimatedTimeRemaining);
        setError(data.error);

        if (data.jobs && data.jobs.length > 0) {
          const latestJob = data.jobs[data.jobs.length - 1];
          setRetryCount(latestJob.retryCount || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  }, [accessToken, runId, pollRunProgress]);

  // 状态变化处理
  const handleStatusChange = useCallback((data) => {
    const newStatus = data.status;
    setStatus(newStatus);
    setProgress(PROGRESS_STEPS[newStatus] || 0);

    if (onStatusChange) {
      onStatusChange(newStatus, data);
    }

    if (newStatus === 'succeeded' || newStatus === 'failed') {
      if (onCompleted) {
        onCompleted(newStatus === 'succeeded', data);
      }
    }
  }, [onStatusChange, onCompleted]);

  // 设置SSE订阅
  useEffect(() => {
    if (!runId || !accessToken) return;

    const unsubscribe = subscribeToRun(
      runId,
      handleStatusChange,
      (error) => {
        console.error('SSE connection error:', error);
        // SSE连接失败时，回退到轮询
        setIsPolling(true);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [runId, accessToken, subscribeToRun, handleStatusChange]);

  // 轮询备份方案
  useEffect(() => {
    if (!isPolling || !runId) return;

    const interval = setInterval(fetchProgress, 3000); // 每3秒轮询一次
    return () => clearInterval(interval);
  }, [isPolling, runId, fetchProgress]);

  // 初始化时获取进度
  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // 计算运行时间
  useEffect(() => {
    if (status === 'processing' && timeElapsed > 0) {
      const interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1000);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status, timeElapsed]);

  if (!runId) {
    return <div className="text-gray-500">等待转写开始...</div>;
  }

  return (
    <div className="space-y-4">
      {/* 状态指示器 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[status] || 'text-gray-600 bg-gray-50'}`}>
            {STATUS_LABELS[status] || status}
          </div>
          {retryCount > 0 && (
            <div className="text-xs text-gray-500">
              重试次数: {retryCount}
            </div>
          )}
        </div>
        <div className="text-sm text-gray-500">
          已用时: {formatTime(timeElapsed / 1000)}
        </div>
      </div>

      {/* 进度条 */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-sm text-gray-600 text-center">
        {progress}%
      </div>

      {/* 预估剩余时间 */}
      {status === 'processing' && estimatedTimeRemaining && (
        <div className="text-sm text-blue-600 text-center">
          预计剩余时间: {formatTime(estimatedTimeRemaining)}
        </div>
      )}

      {/* 错误信息 */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          <div className="font-medium">转写失败</div>
          <div className="mt-1">{error}</div>
        </div>
      )}

      {/* 状态描述 */}
      <div className="text-sm text-gray-600">
        {status === 'queued' && '您的音频已加入队列，请耐心等待...'}
        {status === 'processing' && '正在转写音频，这可能需要几分钟时间...'}
        {status === 'succeeded' && '转写完成！'}
        {status === 'failed' && '转写失败，请重试或联系客服。'}
      </div>

      {/* SSE连接状态 */}
      {isPolling && (
        <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
          使用轮询模式获取实时更新
        </div>
      )}
    </div>
  );
};