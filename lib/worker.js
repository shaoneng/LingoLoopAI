import prisma from './prisma';
import { runQueuedTranscription } from './transcriptRuns';
import { markJobProcessing, markJobSucceeded, markJobFailed, listPendingTranscriptionJobs } from './tasks';
import { recordAuditLog } from './audit';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [5000, 30000, 120000]; // 5s, 30s, 2min

class TranscriptionWorker {
  constructor() {
    this.isRunning = false;
    this.processingJobs = new Set();
  }

  async start() {
    if (this.isRunning) {
      console.log('Worker is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting transcription worker...');

    this.poll();
  }

  async stop() {
    this.isRunning = false;
    console.log('Stopping transcription worker...');
  }

  async poll() {
    if (!this.isRunning) return;

    try {
      const jobs = await listPendingTranscriptionJobs(10);

      for (const job of jobs) {
        if (this.processingJobs.has(job.id)) {
          continue; // Skip already processing jobs
        }

        this.processingJobs.add(job.id);
        this.processJob(job).catch(error => {
          console.error(`Job ${job.id} failed:`, error);
        }).finally(() => {
          this.processingJobs.delete(job.id);
        });
      }
    } catch (error) {
      console.error('Error polling for jobs:', error);
    }

    // Poll every 2 seconds
    setTimeout(() => this.poll(), 2000);
  }

  async processJob(job) {
    try {
      console.log(`Processing job ${job.id} for run ${job.runId}`);

      // Mark job as processing
      await markJobProcessing({ jobId: job.id });

      // Update run status to processing
      await prisma.transcriptRun.update({
        where: { id: job.runId },
        data: { status: 'processing' },
      });

      // Process the transcription
      const result = await runQueuedTranscription({ runId: job.runId });

      // Mark job as succeeded
      await markJobSucceeded({ jobId: job.id });

      console.log(`Job ${job.id} completed successfully`);

      // Record audit log
      if (result.run?.authorId) {
        await recordAuditLog({
          userId: result.run.authorId,
          kind: 'TRANSCRIBE_END',
          targetId: job.runId,
          meta: {
            audioId: job.audioId,
            status: 'succeeded',
            duration: result.audio?.durationMs
          }
        });
      }

    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);

      const retryCount = job.retryCount || 0;
      const shouldRetry = retryCount < MAX_RETRIES;

      if (shouldRetry) {
        const delayMs = RETRY_DELAYS[retryCount];
        console.log(`Retrying job ${job.id} in ${delayMs}ms (attempt ${retryCount + 1})`);

        await markJobFailed({
          jobId: job.id,
          errorMessage: error.message,
          delayMs
        });
      } else {
        console.log(`Job ${job.id} failed permanently after ${retryCount} retries`);

        // Mark job as failed
        await markJobFailed({
          jobId: job.id,
          errorMessage: error.message
        });

        // Update run status to failed
        await prisma.transcriptRun.update({
          where: { id: job.runId },
          data: {
            status: 'failed',
            error: error.message,
            completedAt: new Date()
          },
        });

        // Update audio file status
        await prisma.audioFile.update({
          where: { id: job.audioId },
          data: {
            status: 'failed',
            errorMessage: error.message
          },
        });

        // Record audit log
        const run = await prisma.transcriptRun.findUnique({
          where: { id: job.runId },
          select: { authorId: true }
        });

        if (run?.authorId) {
          await recordAuditLog({
            userId: run.authorId,
            kind: 'TRANSCRIBE_END',
            targetId: job.runId,
            meta: {
              audioId: job.audioId,
              status: 'failed',
              error: error.message
            }
          });
        }
      }
    }
  }

  // Get current processing status
  getStatus() {
    return {
      isRunning: this.isRunning,
      processingJobs: Array.from(this.processingJobs),
      processingCount: this.processingJobs.size
    };
  }
}

// Global worker instance
let worker = null;

export function getWorker() {
  if (!worker) {
    worker = new TranscriptionWorker();
  }
  return worker;
}

export async function startWorker() {
  const w = getWorker();
  await w.start();
  return w;
}

export async function stopWorker() {
  if (worker) {
    await worker.stop();
    worker = null;
  }
}

// For health checks
export function getWorkerStatus() {
  return worker ? worker.getStatus() : { isRunning: false, processingJobs: [], processingCount: 0 };
}