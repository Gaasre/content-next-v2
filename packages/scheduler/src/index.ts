export { articleQueue } from "./queues";
export { initializeWorker, shutdownWorker, getWorker } from "./workers";
export type { PublishArticleJobData } from "./queues";

import { articleQueue } from "./queues";

/**
 * Schedule an article to be published at a specific time
 * @param articleId - The ID of the article to publish
 * @param scheduledFor - The date/time when the article should be published
 * @returns The job ID (same as articleId)
 */
export async function scheduleArticlePublish(
  articleId: string,
  scheduledFor: Date
): Promise<string> {
  const now = new Date();
  const delay = scheduledFor.getTime() - now.getTime();

  if (delay < 0) {
    throw new Error("Scheduled time must be in the future");
  }

  console.log(
    `[Scheduler] Scheduling article ${articleId} for publication at ${scheduledFor.toISOString()}`
  );

  await articleQueue.add(
    "publish-article",
    { articleId },
    {
      jobId: articleId, // Use article ID as job ID for easy cancellation
      delay, // Delay in milliseconds
    }
  );

  console.log(`[Scheduler] Article ${articleId} scheduled successfully`);

  return articleId;
}

/**
 * Cancel a scheduled article publication
 * @param articleId - The ID of the article to cancel
 * @returns true if job was cancelled, false if job didn't exist
 */
export async function cancelScheduledArticle(
  articleId: string
): Promise<boolean> {
  console.log(
    `[Scheduler] Attempting to cancel scheduled article: ${articleId}`
  );

  const job = await articleQueue.getJob(articleId);

  if (!job) {
    console.log(`[Scheduler] No scheduled job found for article: ${articleId}`);
    return false;
  }

  await job.remove();
  console.log(
    `[Scheduler] Successfully cancelled scheduled article: ${articleId}`
  );

  return true;
}

/**
 * Reschedule an article to a new publish time
 * @param articleId - The ID of the article to reschedule
 * @param newScheduledFor - The new date/time when the article should be published
 * @returns The job ID (same as articleId)
 */
export async function rescheduleArticlePublish(
  articleId: string,
  newScheduledFor: Date
): Promise<string> {
  console.log(
    `[Scheduler] Rescheduling article ${articleId} to ${newScheduledFor.toISOString()}`
  );

  // Cancel existing job
  await cancelScheduledArticle(articleId);

  // Schedule new job
  return await scheduleArticlePublish(articleId, newScheduledFor);
}
