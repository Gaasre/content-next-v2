import { protectedProcedure, apiKeyProcedure } from "../index";
import {
  db,
  article,
  website,
  generateId,
  articleViewEvents,
  articleReadEvents,
  articleStatsDaily,
  sql,
  eq,
  and,
} from "@content-next-v2/db";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { calculatePercentageChange } from "../utils/analytics";

// Public event tracking schemas
const trackViewSchema = z.object({
  slug: z.string(),
  visitorId: z.string(),
});

const trackReadSchema = z.object({
  slug: z.string(),
  visitorId: z.string(),
  scrollDepth: z.number().min(0).max(100),
  timeSpent: z.number().min(0),
});

// Protected stats retrieval schemas
const getArticleStatsSchema = z.object({
  articleId: z.string(),
  timeRange: z.enum(["7d", "30d", "90d", "1y"]),
});

const getWebsiteStatsSchema = z.object({
  websiteId: z.string(),
  timeRange: z.enum(["7d", "30d", "90d", "1y"]),
});

// Helper function to get date range
function getDateRange(timeRange: string) {
  const now = new Date();
  const days = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "1y": 365,
  };

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days[timeRange as keyof typeof days]);

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: now.toISOString().split("T")[0],
  };
}

// Helper function to resolve slug to article ID
async function resolveSlugToArticleId(slug: string, websiteId: string) {
  const [result] = await db
    .select({ id: article.id })
    .from(article)
    .where(
      and(
        eq(article.slug, slug),
        eq(article.websiteId, websiteId),
        eq(article.status, "published")
      )
    );

  if (!result) {
    throw new ORPCError("NOT_FOUND", {
      message: "Article not found",
    });
  }

  return result.id;
}

export const analyticsRouter = {
  // Public event tracking endpoints
  trackView: apiKeyProcedure
    .input(trackViewSchema)
    .handler(async ({ context, input }) => {
      const { websiteId } = context;

      // Resolve slug to article ID
      const articleId = await resolveSlugToArticleId(input.slug, websiteId);

      // Record view event
      await db.insert(articleViewEvents).values({
        id: generateId(),
        articleId,
        websiteId,
        visitorId: input.visitorId,
        timestamp: new Date(),
      });

      // Update daily stats
      const today = new Date().toISOString().split("T")[0] as string;

      // Get current stats for today
      const currentStats = await db
        .select()
        .from(articleStatsDaily)
        .where(
          and(
            eq(articleStatsDaily.articleId, articleId),
            eq(articleStatsDaily.date, today)
          )
        );

      if (currentStats.length > 0) {
        // Update existing
        const current = currentStats[0];
        if (current) {
          await db
            .update(articleStatsDaily)
            .set({
              totalViews: current.totalViews + 1,
            })
            .where(eq(articleStatsDaily.id, current.id));
        }
      } else {
        // Create new daily stats record
        await db.insert(articleStatsDaily).values({
          id: generateId(),
          articleId,
          websiteId,
          date: today,
          totalViews: 1,
          uniqueVisitors: 1,
          avgReadTime: 0,
          avgCompletionRate: 0,
          healthScore: 0,
        });
      }

      return { success: true };
    }),

  trackRead: apiKeyProcedure
    .input(trackReadSchema)
    .handler(async ({ context, input }) => {
      const { websiteId } = context;

      // Resolve slug to article ID
      const articleId = await resolveSlugToArticleId(input.slug, websiteId);

      // Record read event
      await db.insert(articleReadEvents).values({
        id: generateId(),
        articleId,
        websiteId,
        visitorId: input.visitorId,
        timestamp: new Date(),
        scrollDepth: input.scrollDepth,
        timeSpent: input.timeSpent,
      });

      // Update daily stats with read metrics
      const today = new Date().toISOString().split("T")[0] as string;

      // Get current stats for today
      const currentStats = await db
        .select()
        .from(articleStatsDaily)
        .where(
          and(
            eq(articleStatsDaily.articleId, articleId),
            eq(articleStatsDaily.date, today)
          )
        );

      if (currentStats.length > 0) {
        // Calculate new averages
        const current = currentStats[0];
        if (current) {
          const newAvgReadTime = (current.avgReadTime + input.timeSpent) / 2;
          const newAvgCompletionRate =
            (current.avgCompletionRate + input.scrollDepth) / 2;
          const newHealthScore = (newAvgReadTime + newAvgCompletionRate) / 2;

          await db
            .update(articleStatsDaily)
            .set({
              avgReadTime: newAvgReadTime,
              avgCompletionRate: newAvgCompletionRate,
              healthScore: newHealthScore,
            })
            .where(eq(articleStatsDaily.id, current.id));
        }
      } else {
        // Create new daily stats record
        await db.insert(articleStatsDaily).values({
          id: generateId(),
          articleId,
          websiteId,
          date: today,
          totalViews: 0,
          uniqueVisitors: 0,
          avgReadTime: input.timeSpent,
          avgCompletionRate: input.scrollDepth,
          healthScore: (input.timeSpent + input.scrollDepth) / 2,
        });
      }

      return { success: true };
    }),

  // Protected stats retrieval endpoints
  getArticleStats: protectedProcedure
    .input(getArticleStatsSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      // Verify article belongs to user's website
      const [articleData] = await db
        .select()
        .from(article)
        .innerJoin(website, eq(article.websiteId, website.id))
        .where(
          and(eq(article.id, input.articleId), eq(website.userId, userId))
        );

      if (!articleData) {
        throw new ORPCError("NOT_FOUND");
      }

      const { startDate, endDate } = getDateRange(input.timeRange);

      let stats;
      if (input.timeRange === "1y") {
        // For 1y, aggregate by month instead of daily
        stats = await db
          .select({
            id: sql<string>`concat(${articleStatsDaily.articleId}, '-', extract(year from ${articleStatsDaily.date}), '-', extract(month from ${articleStatsDaily.date}))`,
            date: sql<string>`concat(extract(year from ${articleStatsDaily.date}), '-', lpad(extract(month from ${articleStatsDaily.date})::text, 2, '0'), '-01')`,
            articleId: articleStatsDaily.articleId,
            websiteId: articleStatsDaily.websiteId,
            totalViews: sql<number>`sum(${articleStatsDaily.totalViews})`,
            uniqueVisitors: sql<number>`sum(${articleStatsDaily.uniqueVisitors})`,
            avgReadTime: sql<number>`avg(${articleStatsDaily.avgReadTime})`,
            avgCompletionRate: sql<number>`avg(${articleStatsDaily.avgCompletionRate})`,
            healthScore: sql<number>`avg(${articleStatsDaily.healthScore})`,
          })
          .from(articleStatsDaily)
          .where(
            and(
              eq(articleStatsDaily.articleId, input.articleId),
              sql`${articleStatsDaily.date} >= ${startDate}`,
              sql`${articleStatsDaily.date} <= ${endDate}`
            )
          )
          .groupBy(
            articleStatsDaily.articleId,
            articleStatsDaily.websiteId,
            sql`extract(year from ${articleStatsDaily.date})`,
            sql`extract(month from ${articleStatsDaily.date})`
          )
          .orderBy(
            sql`extract(year from ${articleStatsDaily.date})`,
            sql`extract(month from ${articleStatsDaily.date})`
          );
      } else {
        // For other time ranges, use daily data
        stats = await db
          .select()
          .from(articleStatsDaily)
          .where(
            and(
              eq(articleStatsDaily.articleId, input.articleId),
              sql`${articleStatsDaily.date} >= ${startDate}`,
              sql`${articleStatsDaily.date} <= ${endDate}`
            )
          )
          .orderBy(articleStatsDaily.date);
      }

      return {
        articleId: input.articleId,
        timeRange: input.timeRange,
        stats,
      };
    }),

  getWebsiteStats: protectedProcedure
    .input(getWebsiteStatsSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      // Verify website belongs to user
      const [websiteData] = await db
        .select()
        .from(website)
        .where(
          and(eq(website.id, input.websiteId), eq(website.userId, userId))
        );

      if (!websiteData) {
        throw new ORPCError("NOT_FOUND");
      }

      const { startDate, endDate } = getDateRange(input.timeRange);

      // Aggregate stats across all articles in the website
      const dailyStats = await db
        .select({
          date: articleStatsDaily.date,
          totalViews: sql<number>`sum(${articleStatsDaily.totalViews})`,
          uniqueVisitors: sql<number>`sum(${articleStatsDaily.uniqueVisitors})`,
          avgReadTime: sql<number>`avg(${articleStatsDaily.avgReadTime})`,
          avgCompletionRate: sql<number>`avg(${articleStatsDaily.avgCompletionRate})`,
          healthScore: sql<number>`avg(${articleStatsDaily.healthScore})`,
        })
        .from(articleStatsDaily)
        .where(
          and(
            eq(articleStatsDaily.websiteId, input.websiteId),
            sql`${articleStatsDaily.date} >= ${startDate}`,
            sql`${articleStatsDaily.date} <= ${endDate}`
          )
        )
        .groupBy(articleStatsDaily.date)
        .orderBy(articleStatsDaily.date);

      // Calculate totals and trends for the period
      const totalViews = dailyStats.reduce(
        (sum, day) => sum + (day.totalViews || 0),
        0
      );
      const totalUniqueVisitors = dailyStats.reduce(
        (sum, day) => sum + (day.uniqueVisitors || 0),
        0
      );
      const avgReadTime =
        dailyStats.length > 0
          ? dailyStats.reduce((sum, day) => sum + (day.avgReadTime || 0), 0) /
            dailyStats.length
          : 0;
      const avgCompletionRate =
        dailyStats.length > 0
          ? dailyStats.reduce(
              (sum, day) => sum + (day.avgCompletionRate || 0),
              0
            ) / dailyStats.length
          : 0;
      const avgHealthScore =
        dailyStats.length > 0
          ? dailyStats.reduce((sum, day) => sum + (day.healthScore || 0), 0) /
            dailyStats.length
          : 0;

      // Generate trend data for sparklines
      const viewsTrend = dailyStats.map((day) => day.totalViews || 0);
      const completionTrend = dailyStats.map((day) =>
        Math.round(day.avgCompletionRate || 0)
      );
      const visitorsTrend = dailyStats.map((day) => day.uniqueVisitors || 0);

      // Calculate percentage changes (comparing first half vs second half of period)
      const viewsChange = calculatePercentageChange(viewsTrend);
      const completionChange = calculatePercentageChange(completionTrend);
      const visitorsChange = calculatePercentageChange(visitorsTrend);

      return {
        websiteId: input.websiteId,
        timeRange: input.timeRange,
        // Summary stats
        totalViews,
        uniqueVisitors: totalUniqueVisitors,
        avgReadTime: Math.round(avgReadTime),
        avgCompletionRate: Math.round(avgCompletionRate),
        healthScore: Math.round(avgHealthScore),
        // Trend data for sparklines
        viewsTrend,
        completionTrend,
        visitorsTrend,
        // Percentage changes
        viewsChange,
        completionChange,
        visitorsChange,
        // Daily breakdown
        dailyStats,
      };
    }),
};
