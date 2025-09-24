#!/usr/bin/env node

// 简单的SSE测试脚本
const EventSource = require('eventsource');

// 替换为你的实际访问令牌
const ACCESS_TOKEN = 'your_access_token_here';
const RUN_ID = 'your_run_id_here';

// 测试单个run的SSE
console.log('=== 测试单个转录任务的SSE连接 ===');

const url = `http://localhost:3002/api/runs/${RUN_ID}/events?runId=${RUN_ID}&access_token=${ACCESS_TOKEN}`;

console.log(`连接到: ${url}`);

const eventSource = new EventSource(url);

eventSource.onopen = () => {
  console.log('SSE连接已建立');
};

eventSource.onmessage = (event) => {
  console.log('收到消息:', event.data);

  try {
    const data = JSON.parse(event.data);
    console.log('解析后数据:', data);

    if (data.event === 'done') {
      console.log('转录完成！');
      eventSource.close();
    }
  } catch (error) {
    console.error('解析消息失败:', error);
  }
};

eventSource.onerror = (error) => {
  console.error('SSE连接错误:', error);
  eventSource.close();
};

// 30秒后自动关闭
setTimeout(() => {
  console.log('测试超时，关闭连接');
  eventSource.close();
}, 30000);

// 测试全局事件
console.log('\n=== 测试全局任务事件 ===');

const globalUrl = `http://localhost:3002/api/runs/events?access_token=${ACCESS_TOKEN}`;
console.log(`连接到: ${globalUrl}`);

const globalEventSource = new EventSource(globalUrl);

globalEventSource.onopen = () => {
  console.log('全局SSE连接已建立');
};

globalEventSource.onmessage = (event) => {
  console.log('收到全局消息:', event.data);
};

globalEventSource.onerror = (error) => {
  console.error('全局SSE连接错误:', error);
  globalEventSource.close();
};

setTimeout(() => {
  globalEventSource.close();
}, 30000);