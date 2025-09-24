const { startWorker } = require('../lib/worker');

async function main() {
  console.log('启动 LingoLoopAI 转录工作器...');

  try {
    await startWorker();
    console.log('工作器已启动并正在运行...');
    console.log('按 Ctrl+C 停止工作器');

    // 保持进程运行
    process.on('SIGINT', async () => {
      console.log('\n正在停止工作器...');
      const { stopWorker } = require('../lib/worker');
      await stopWorker();
      console.log('工作器已停止');
      process.exit(0);
    });

    // 防止进程退出
    setInterval(() => {
      // 定期检查工作器状态
      const status = require('../lib/worker').getWorkerStatus();
      console.log(`[${new Date().toISOString()}] 工作器状态: ${status.isRunning ? '运行中' : '已停止'}, 处理中任务: ${status.processingCount}`);
    }, 30000); // 每30秒输出一次状态

  } catch (error) {
    console.error('启动工作器失败:', error);
    process.exit(1);
  }
}

main();