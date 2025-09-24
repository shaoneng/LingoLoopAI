import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

const EventContext = createContext();

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};

export const EventProvider = ({ children }) => {
  const { accessToken } = useAuth();
  const [connections, setConnections] = useState(new Map());
  const [globalEvents, setGlobalEvents] = useState([]);

  // 创建SSE连接
  const createConnection = useCallback((url, onMessage, onError) => {
    if (!accessToken) return null;

    const eventSource = new EventSource(`${url}&access_token=${accessToken}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      onError(error);
      eventSource.close();
    };

    return eventSource;
  }, [accessToken]);

  // 监听特定run的状态变化
  const subscribeToRun = useCallback((runId, onStatusChange, onError) => {
    if (!runId || !accessToken) return () => {};

    const url = `/api/runs/${runId}/events?runId=${runId}`;
    const connection = createConnection(url, (data) => {
      if (data.event === 'update' || data.event === 'done') {
        onStatusChange(data);
      }
    }, onError);

    if (connection) {
      setConnections(prev => new Map(prev).set(runId, connection));
    }

    return () => {
      if (connection) {
        connection.close();
        setConnections(prev => {
          const newMap = new Map(prev);
          newMap.delete(runId);
          return newMap;
        });
      }
    };
  }, [accessToken, createConnection]);

  // 监听全局任务状态变化
  const subscribeToGlobalEvents = useCallback((onEvent, onError) => {
    if (!accessToken) return () => {};

    const url = '/api/runs/events';
    const connection = createConnection(url, (data) => {
      if (data.event === 'update' || data.event === 'done' || data.event === 'snapshot') {
        onEvent(data);
      }
    }, onError);

    if (connection) {
      setConnections(prev => new Map(prev).set('global', connection));
    }

    return () => {
      if (connection) {
        connection.close();
        setConnections(prev => {
          const newMap = new Map(prev);
          newMap.delete('global');
          return newMap;
        });
      }
    };
  }, [accessToken, createConnection]);

  // 轮询任务进度（备用方案）
  const pollRunProgress = useCallback(async (runId) => {
    if (!accessToken) return null;

    try {
      const response = await fetch(`/api/runs/${runId}/progress?runId=${runId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to poll progress:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error polling progress:', error);
      return null;
    }
  }, [accessToken]);

  // 清理所有连接
  const cleanup = useCallback(() => {
    connections.forEach((connection) => {
      connection.close();
    });
    setConnections(new Map());
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const value = {
    subscribeToRun,
    subscribeToGlobalEvents,
    pollRunProgress,
    cleanup,
    connections: Array.from(connections.keys()),
    globalEvents
  };

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
};