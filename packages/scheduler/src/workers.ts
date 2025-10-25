import { Worker } from "bullmq";
import { redisConnection } from "./queues";
import { publishArticleJob } from "./jobs/publish-article";
import type { PublishArticleJobData } from "./queues";

let worker: Worker<PublishArticleJobData> | null = null;

export function initializeWorker() {
  if (worker) {
    console.log("[Scheduler] Worker already initialized");
    return worker;
  }

  console.log("[Scheduler] Initializing article publishing worker...");

  worker = new Worker<PublishArticleJobData>(
    "article-publishing",
    async (job) => {
      return await publishArticleJob(job);
    },
    {
      connection: redisConnection,
      concurrency: 5, // Process up to 5 jobs concurrently
    }
  );

  // Event listeners for monitoring
  worker.on("completed", (job) => {
    console.log(`[Scheduler] Job ${job.id} completed successfully`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Scheduler] Job ${job?.id} failed with error:`, err.message);
  });

  worker.on("error", (err) => {
    console.error("[Scheduler] Worker error:", err);
  });

  console.log("[Scheduler] Worker initialized successfully");

  return worker;
}

export async function shutdownWorker() {
  if (!worker) {
    console.log("[Scheduler] No worker to shutdown");
    return;
  }

  console.log("[Scheduler] Shutting down worker...");

  try {
    await worker.close();
    worker = null;
    console.log("[Scheduler] Worker shutdown complete");
  } catch (error) {
    console.error("[Scheduler] Error shutting down worker:", error);
    throw error;
  }
}

export function getWorker() {
  return worker;
}
