import pkg from '../lib/worker.js';
const { startWorker, getWorkerStatus } = pkg;
import pkg2 from '../lib/prisma.js';
const { prisma } = pkg2;

async function testWorker() {
  console.log('=== 测试工作器状态 ===');

  // 检查初始状态
  const initialStatus = getWorkerStatus();
  console.log('初始状态:', initialStatus);

  // 启动工作器
  console.log('\n启动工作器...');
  await startWorker();

  // 检查启动后状态
  const startedStatus = getWorkerStatus();
  console.log('启动后状态:', startedStatus);

  // 查看待处理的任务
  console.log('\n=== 查看待处理任务 ===');
  const pendingJobs = await prisma.job.findMany({
    where: {
      jobType: 'transcribe_long',
      status: 'queued',
    },
    include: {
      run: {
        include: {
          audio: {
            select: {
              filename: true,
              durationMs: true,
              sizeBytes: true,
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'asc' },
    take: 5,
  });

  console.log(`找到 ${pendingJobs.length} 个待处理任务:`);
  pendingJobs.forEach((job, index) => {
    console.log(`${index + 1}. Job ${job.id}`);
    console.log(`   Run: ${job.runId}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Audio: ${job.run.audio.filename}`);
    console.log(`   Duration: ${job.run.audio.durationMs}ms`);
    console.log(`   Size: ${job.run.audio.sizeBytes} bytes`);
    console.log(`   Created: ${job.createdAt}`);
    console.log('');
  });

  // 查看正在处理的转录任务
  console.log('\n=== 查看正在处理的转录任务 ===');
  const processingRuns = await prisma.transcriptRun.findMany({
    where: {
      status: 'processing',
    },
    include: {
      audio: {
        select: {
          filename: true,
          durationMs: true,
          sizeBytes: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  console.log(`找到 ${processingRuns.length} 个正在处理的任务:`);
  processingRuns.forEach((run, index) => {
    console.log(`${index + 1}. Run ${run.id}`);
    console.log(`   Status: ${run.status}`);
    console.log(`   Audio: ${run.audio.filename}`);
    console.log(`   Duration: ${run.audio.durationMs}ms`);
    console.log(`   Created: ${run.createdAt}`);
    console.log('');
  });

  console.log('测试完成！');
  console.log('工作器正在后台运行，会自动处理队列中的任务。');
  console.log('查看控制台日志以获取处理详情。');
}

// 运行测试
testWorker().catch(console.error);

export { testWorker };