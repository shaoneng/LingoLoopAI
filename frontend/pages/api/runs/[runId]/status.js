import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  const { runId } = req.query;

  if (!runId) {
    res.status(400).json({ error: 'runId is required' });
    return;
  }

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let lastStatus = null;
  const intervalId = setInterval(async () => {
    try {
      const run = await prisma.transcriptRun.findUnique({
        where: { id: runId },
        select: { status: true, error: true },
      });

      if (!run) {
        throw new Error('Run not found');
      }

      const currentStatus = run.status;
      if (lastStatus !== currentStatus) {
        lastStatus = currentStatus;
        const data = { status: currentStatus };
        if (run.error) {
          data.error = run.error;
        }
        res.write(`data: ${JSON.stringify(data)}

`);
        res.flush();
      }

      // Stop polling if the job is completed or failed
      if (currentStatus === 'completed' || currentStatus === 'failed') {
        clearInterval(intervalId);
        res.end();
      }
    } catch (error) {
      console.error(`Error polling for run ${runId}:`, error);
      clearInterval(intervalId);
      // Send an error event to the client before closing
      res.write(`data: ${JSON.stringify({ error: error.message || 'An error occurred' })}\n\n`);
      res.end();
    }
  }, 2000); // Poll every 2 seconds

  // Clean up when the client disconnects
  req.on('close', () => {
    clearInterval(intervalId);
    res.end();
  });
}
