import { Job } from "bullmq";
import { db, article, eq, and, isNull } from "@content-next-v2/db";
import type { PublishArticleJobData } from "../queues";

export async function publishArticleJob(job: Job<PublishArticleJobData>) {
  const { articleId } = job.data;

  console.log(`[Scheduler] Processing publish job for article: ${articleId}`);

  try {
    // Fetch the article to check its current status
    const [existingArticle] = await db
      .select()
      .from(article)
      .where(and(eq(article.id, articleId), isNull(article.deletedAt)));

    if (!existingArticle) {
      console.log(
        `[Scheduler] Article ${articleId} not found or deleted, skipping`
      );
      return { success: false, reason: "Article not found or deleted" };
    }

    // Check if article is already published
    if (existingArticle.status === "published") {
      console.log(
        `[Scheduler] Article ${articleId} already published, skipping`
      );
      return { success: true, reason: "Already published" };
    }

    // Check if article is still scheduled
    if (existingArticle.status !== "scheduled") {
      console.log(
        `[Scheduler] Article ${articleId} status is ${existingArticle.status}, not scheduled. Skipping`
      );
      return { success: false, reason: `Status is ${existingArticle.status}` };
    }

    // Publish the article
    const [updatedArticle] = await db
      .update(article)
      .set({
        status: "published",
        publishedAt: new Date(),
        scheduledFor: null,
        updatedAt: new Date(),
      })
      .where(eq(article.id, articleId))
      .returning();

    console.log(`[Scheduler] Successfully published article: ${articleId}`);

    return {
      success: true,
      articleId: updatedArticle?.id,
      publishedAt: updatedArticle?.publishedAt,
    };
  } catch (error) {
    console.error(`[Scheduler] Error publishing article ${articleId}:`, error);
    throw error; // Let BullMQ handle retries
  }
}
