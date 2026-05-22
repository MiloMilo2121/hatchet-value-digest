import { Hatchet } from '@hatchet-dev/typescript-sdk';
import { registerValueDigestWorkflow } from './workflow';
import * as dotenv from 'dotenv';

// Load environment variables (e.g. HATCHET_CLIENT_TOKEN)
dotenv.config();

/**
 * WHY THIS EXISTS:
 * This is the entrypoint for the proof-of-concept.
 * It initializes the Hatchet client, starts a worker to listen for tasks,
 * and exposes a `--demo` flag to manually trigger the workflow instantly.
 */
async function main() {
  // Initialize Hatchet using the token from the environment
  const hatchet = Hatchet.init();

  // Register the workflow definition
  const valueDigestWorkflow = registerValueDigestWorkflow(hatchet);

  const isDemo = process.argv.includes('--demo');

  // WHY THIS ORDER MATTERS:
  // The worker must register the workflow and be connected to the engine
  // BEFORE we fire the --demo trigger. If we trigger first, the engine queues
  // the run as PENDING with no matching worker, and it just sits there.
  // start() only resolves on shutdown, so we do NOT await it — we await
  // waitUntilReady() which polls until the engine has assigned a workerId.
  const worker = await hatchet.worker('value-digest-worker');

  await worker.registerWorkflow(valueDigestWorkflow);

  // Start the worker loop in the background; this Promise resolves on stop/kill
  const workerLoop = worker.start();

  // Block until the worker is actually ready to receive dispatch
  // (v1 SDK readiness hook; polls every 200ms, default timeout 10s — we give 30s)
  await worker.waitUntilReady(30_000);

  console.log('🟢 Hatchet worker started successfully.');
  console.log('Listening for scheduled (cron) or manual workflow runs...');

  if (isDemo) {
    console.log('🚀 Triggering manual Value Digest for Loom demo...');
    // Manually trigger the workflow (overriding the cron schedule for instant execution)
    // V1 preferred method: using the workflow object directly
    const runRef = await valueDigestWorkflow.runNoWait({});
    // runRef.workflowRunId is an EventualWorkflowRunId (may be a Promise); resolve via getWorkflowRunId()
    const runId = await runRef.getWorkflowRunId();
    console.log(`✅ Workflow triggered. Run ID: ${runId}`);
    console.log('You can monitor the execution in your Hatchet Dashboard.\n');
  }

  // Keep the process alive on the worker loop so tasks can be processed
  await workerLoop;
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
