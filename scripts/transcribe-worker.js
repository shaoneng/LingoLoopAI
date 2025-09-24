#!/usr/bin/env node
/*
  Simple transcription worker runner for long audios.
  - Picks queued jobs from DB and processes them via runQueuedTranscription
  - Honors retry schedule via TASKS_MAX_ATTEMPTS / TASKS_RETRY_SCHEDULE_MS
  Usage: node scripts/transcribe-worker.js
*/

require('dotenv').config()

const prisma = require('../lib/prisma').default
const {
  listPendingTranscriptionJobs,
  markJobProcessing,
  markJobSucceeded,
  markJobFailed,
} = require('../lib/tasks')
const { runQueuedTranscription } = require('../lib/transcriptRuns')

const DEFAULT_SCHEDULE = [5000, 30000, 120000]
const MAX_ATTEMPTS = Number(process.env.TASKS_MAX_ATTEMPTS || 3)

function parseSchedule() {
  const raw = process.env.TASKS_RETRY_SCHEDULE_MS
  if (!raw) return DEFAULT_SCHEDULE
  const arr = raw.split(',').map((x) => Number(x.trim())).filter((n) => Number.isFinite(n) && n > 0)
  return arr.length ? arr : DEFAULT_SCHEDULE
}

function computeRetryDelay(attempt) {
  const schedule = parseSchedule()
  const idx = Math.min(Math.max(0, attempt - 1), schedule.length - 1)
  return schedule[idx]
}

async function processJob(job) {
  // mark processing (increment retryCount)
  await markJobProcessing({ jobId: job.id, prismaClient: prisma })
  try {
    await runQueuedTranscription({ runId: job.runId, prismaClient: prisma })
    await markJobSucceeded({ jobId: job.id, prismaClient: prisma })
    console.log('[worker] job succeeded', job.id)
  } catch (err) {
    const attempts = (job.retryCount || 0) + 1
    const shouldRetry = attempts < MAX_ATTEMPTS
    const delay = shouldRetry ? computeRetryDelay(attempts) : null
    await markJobFailed({ jobId: job.id, errorMessage: err.message, delayMs: delay, prismaClient: prisma })
    console.error('[worker] job failed', job.id, err.message)
  }
}

async function loop() {
  while (true) {
    try {
      const jobs = await listPendingTranscriptionJobs(10, { prismaClient: prisma })
      if (!jobs.length) {
        await new Promise((r) => setTimeout(r, 3000))
        continue
      }
      for (const job of jobs) {
        await processJob(job)
      }
    } catch (err) {
      console.error('[worker] loop error:', err)
      await new Promise((r) => setTimeout(r, 5000))
    }
  }
}

loop()
  .catch((e) => {
    console.error('[worker] fatal', e)
    process.exit(1)
  })

