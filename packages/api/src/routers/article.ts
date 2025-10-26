import { protectedProcedure, apiKeyProcedure } from "../index";

import { z } from "zod";
import {
  eq,
  and,
  isNull,
  or,
  ilike,
  desc,
  not,
  count,
  db,
  article,
  website,
  articleImage,
  generateId,
  articleStatsDaily,
  sql,
} from "@content-next-v2/db";
import { ORPCError } from "@orpc/server";
import {
  scheduleArticlePublish,
  cancelScheduledArticle,
  rescheduleArticlePublish,
} from "@content-next-v2/scheduler";
import {
  generateUploadPresignedUrl,
  deleteObject,
  deleteObjects,
  getImageUrl,
} from "@content-next-v2/s3";

const createArticleSchema = z.object({
  websiteId: z.string(),
  slug: z.string().min(1).max(255),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  content: z.string(),
  tags: z.array(z.string()).default([]),
  status: z.enum(["draft", "published", "scheduled"]).default("draft"),
  scheduledFor: z.date().optional(),
});

const listArticlesSchema = z.object({
  websiteId: z.string(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  status: z.enum(["draft", "published", "scheduled"]).optional(),
  search: z.string().optional(),
});

const getByIdSchema = z.object({
  id: z.string(),
});

const updateArticleSchema = z.object({
  id: z.string(),
  slug: z.string().min(1).max(255).optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "published", "scheduled"]).optional(),
  scheduledFor: z.date().optional(),
});

const deleteSchema = z.object({
  id: z.string(),
});

const publishSchema = z.object({
  id: z.string(),
});

const scheduleSchema = z.object({
  id: z.string(),
  scheduledFor: z.date(),
});

const publicListSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const publicGetBySlugSchema = z.object({
  slug: z.string(),
});

const generateImageUploadUrlSchema = z.object({
  articleId: z.string(),
  imageType: z.enum(["cover", "content"]),
  contentType: z.string(),
});

const deleteImageSchema = z.object({
  imageId: z.string(),
});

function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export const articleRouter = {
  create: protectedProcedure
    .input(createArticleSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      // Verify website belongs to user
      const [site] = await db
        .select()
        .from(website)
        .where(
          and(eq(website.id, input.websiteId), eq(website.userId, userId))
        );

      if (!site) {
        throw new ORPCError("NOT_FOUND");
      }

      // Check if slug already exists in the same website
      const [existingSlug] = await db
        .select()
        .from(article)
        .where(
          and(
            eq(article.websiteId, input.websiteId),
            eq(article.slug, input.slug),
            isNull(article.deletedAt)
          )
        );

      if (existingSlug) {
        throw new ORPCError("CONFLICT", {
          message: "An article with this slug already exists in this website",
        });
      }

      const id = generateId();
      const readTime = calculateReadTime(input.content);

      const [newArticle] = await db
        .insert(article)
        .values({
          id,
          websiteId: input.websiteId,
          slug: input.slug,
          title: input.title,
          description: input.description,
          content: input.content,
          tags: input.tags,
          status: input.status,
          scheduledFor: input.scheduledFor,
          publishedAt: input.status === "published" ? new Date() : null,
          readTime,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        })
        .returning();

      return newArticle;
    }),

  list: protectedProcedure
    .input(listArticlesSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      // Verify website belongs to user
      const [site] = await db
        .select()
        .from(website)
        .where(
          and(eq(website.id, input.websiteId), eq(website.userId, userId))
        );

      if (!site) {
        throw new ORPCError("NOT_FOUND");
      }

      const offset = (input.page - 1) * input.limit;

      // Base conditions for all queries
      const baseConditions = [
        eq(article.websiteId, input.websiteId),
        isNull(article.deletedAt),
      ];

      // Add search condition if provided
      if (input.search) {
        baseConditions.push(
          or(
            ilike(article.title, `%${input.search}%`),
            ilike(article.description, `%${input.search}%`)
          ) || eq(article.id, article.id)
        );
      }

      // Conditions for the main articles query
      const articleConditions = [...baseConditions];
      if (input.status) {
        articleConditions.push(eq(article.status, input.status));
      }

      // Get articles and counts in parallel
      const [
        articles,
        allCount,
        publishedCount,
        scheduledCount,
        draftCount,
        trendingCount,
        highlyRatedCount,
      ] = await Promise.all([
        db
          .select({
            id: article.id,
            websiteId: article.websiteId,
            slug: article.slug,
            title: article.title,
            description: article.description,
            content: article.content,
            tags: article.tags,
            status: article.status,
            scheduledFor: article.scheduledFor,
            publishedAt: article.publishedAt,
            readTime: article.readTime,
            createdAt: article.createdAt,
            updatedAt: article.updatedAt,
            deletedAt: article.deletedAt,
            coverImage: {
              id: articleImage.id,
              url: articleImage.url,
              key: articleImage.key,
            },
          })
          .from(article)
          .leftJoin(
            articleImage,
            and(
              eq(article.id, articleImage.articleId),
              eq(articleImage.type, "cover")
            )
          )
          .where(and(...articleConditions))
          .orderBy(
            // First: Drafts at top (0), then timeline (1)
            sql`CASE WHEN ${article.status} = 'draft' THEN 0 ELSE 1 END`,
            // Second: Within drafts, newest first
            desc(
              sql`CASE WHEN ${article.status} = 'draft' THEN ${article.createdAt} END`
            ),
            // Third: Timeline - scheduled and published by their dates DESC
            desc(
              sql`CASE 
                WHEN ${article.status} = 'scheduled' THEN ${article.scheduledFor}
                WHEN ${article.status} = 'published' THEN ${article.publishedAt}
              END`
            )
          )
          .limit(input.limit)
          .offset(offset),

        // Total count (all articles matching base conditions)
        db
          .select({ count: count() })
          .from(article)
          .where(and(...baseConditions)),

        // Published count
        db
          .select({ count: count() })
          .from(article)
          .where(and(...baseConditions, eq(article.status, "published"))),

        // Scheduled count
        db
          .select({ count: count() })
          .from(article)
          .where(and(...baseConditions, eq(article.status, "scheduled"))),

        // Draft count
        db
          .select({ count: count() })
          .from(article)
          .where(and(...baseConditions, eq(article.status, "draft"))),

        // Trending count: published articles with totalViews > 15000 AND avgCompletionRate > 85
        db
          .select({ count: count() })
          .from(article)
          .innerJoin(
            articleStatsDaily,
            eq(article.id, articleStatsDaily.articleId)
          )
          .where(
            and(
              ...baseConditions,
              eq(article.status, "published"),
              sql`${articleStatsDaily.totalViews} > 15000`,
              sql`${articleStatsDaily.avgCompletionRate} > 85`
            )
          ),

        // Highly-rated count: published articles with avgCompletionRate >= 90 (excluding trending)
        db
          .select({ count: count() })
          .from(article)
          .innerJoin(
            articleStatsDaily,
            eq(article.id, articleStatsDaily.articleId)
          )
          .where(
            and(
              ...baseConditions,
              eq(article.status, "published"),
              sql`${articleStatsDaily.avgCompletionRate} >= 90`,
              // Exclude articles that are already trending
              sql`NOT (${articleStatsDaily.totalViews} > 15000 AND ${articleStatsDaily.avgCompletionRate} > 85)`
            )
          ),
      ]);

      return {
        articles,
        page: input.page,
        limit: input.limit,
        counts: {
          all: allCount[0]?.count || 0,
          published: publishedCount[0]?.count || 0,
          scheduled: scheduledCount[0]?.count || 0,
          draft: draftCount[0]?.count || 0,
          trending: trendingCount[0]?.count || 0,
          highlyRated: highlyRatedCount[0]?.count || 0,
        },
      };
    }),

  getById: protectedProcedure
    .input(getByIdSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      const [result] = await db
        .select()
        .from(article)
        .innerJoin(website, eq(article.websiteId, website.id))
        .where(
          and(
            eq(article.id, input.id),
            eq(website.userId, userId),
            isNull(article.deletedAt)
          )
        );

      if (!result) {
        throw new ORPCError("NOT_FOUND");
      }

      return result.article;
    }),

  update: protectedProcedure
    .input(updateArticleSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      // Verify article belongs to user's website
      const [existing] = await db
        .select()
        .from(article)
        .innerJoin(website, eq(article.websiteId, website.id))
        .where(
          and(
            eq(article.id, input.id),
            eq(website.userId, userId),
            isNull(article.deletedAt)
          )
        );

      if (!existing) {
        throw new ORPCError("NOT_FOUND");
      }

      // Check if slug already exists in the same website (excluding current article)
      if (input.slug) {
        const [existingSlug] = await db
          .select()
          .from(article)
          .where(
            and(
              eq(article.websiteId, existing.article.websiteId),
              eq(article.slug, input.slug),
              isNull(article.deletedAt),
              // Exclude the current article from the check
              not(eq(article.id, input.id))
            )
          );

        if (existingSlug) {
          throw new ORPCError("CONFLICT", {
            message: "An article with this slug already exists in this website",
          });
        }
      }

      const readTime = input.content
        ? calculateReadTime(input.content)
        : existing.article.readTime;

      // Handle scheduler job updates
      const oldStatus = existing.article.status;
      const oldScheduledFor = existing.article.scheduledFor;
      const newStatus = input.status || oldStatus;
      const newScheduledFor =
        input.scheduledFor !== undefined ? input.scheduledFor : oldScheduledFor;

      // Cancel scheduled job if status is changing from "scheduled" to something else
      if (oldStatus === "scheduled" && newStatus !== "scheduled") {
        await cancelScheduledArticle(input.id);
      }

      // Handle scheduling changes
      if (newStatus === "scheduled" && newScheduledFor) {
        // If scheduledFor changed, reschedule the job
        if (oldScheduledFor?.getTime() !== newScheduledFor.getTime()) {
          await rescheduleArticlePublish(input.id, newScheduledFor);
        }
        // If changing to scheduled status for the first time
        else if (oldStatus !== "scheduled") {
          await scheduleArticlePublish(input.id, newScheduledFor);
        }
      }

      const [updated] = await db
        .update(article)
        .set({
          ...(input.slug && { slug: input.slug }),
          ...(input.title && { title: input.title }),
          ...(input.description && { description: input.description }),
          ...(input.content && { content: input.content }),
          ...(input.tags && { tags: input.tags }),
          ...(input.status && { status: input.status }),
          ...(input.scheduledFor !== undefined && {
            scheduledFor: input.scheduledFor,
          }),
          // Set publishedAt when status changes to "published"
          ...(input.status === "published" &&
            !existing.article.publishedAt && {
              publishedAt: new Date(),
            }),
          // Clear scheduledFor when status changes to "published"
          ...(input.status === "published" && {
            scheduledFor: null,
          }),
          readTime,
          updatedAt: new Date(),
        })
        .where(eq(article.id, input.id))
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(deleteSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      const [existing] = await db
        .select()
        .from(article)
        .innerJoin(website, eq(article.websiteId, website.id))
        .where(
          and(
            eq(article.id, input.id),
            eq(website.userId, userId),
            isNull(article.deletedAt)
          )
        );

      if (!existing) {
        throw new ORPCError("NOT_FOUND");
      }

      // Cancel scheduled job if article is scheduled
      if (existing.article.status === "scheduled") {
        await cancelScheduledArticle(input.id);
      }

      // Get all images for this article
      const images = await db
        .select()
        .from(articleImage)
        .where(eq(articleImage.articleId, input.id));

      // Delete all images from S3
      if (images.length > 0) {
        const imageKeys = images.map((img) => img.key);
        await deleteObjects(imageKeys);
      }

      await db
        .update(article)
        .set({ deletedAt: new Date() })
        .where(eq(article.id, input.id));

      return { success: true };
    }),

  publish: protectedProcedure
    .input(publishSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      const [existing] = await db
        .select()
        .from(article)
        .innerJoin(website, eq(article.websiteId, website.id))
        .where(
          and(
            eq(article.id, input.id),
            eq(website.userId, userId),
            isNull(article.deletedAt)
          )
        );

      if (!existing) {
        throw new ORPCError("NOT_FOUND");
      }

      // Cancel scheduled job if article was scheduled
      if (existing.article.status === "scheduled") {
        await cancelScheduledArticle(input.id);
      }

      const [updated] = await db
        .update(article)
        .set({
          status: "published",
          publishedAt: new Date(),
          scheduledFor: null,
          updatedAt: new Date(),
        })
        .where(eq(article.id, input.id))
        .returning();

      return updated;
    }),

  schedule: protectedProcedure
    .input(scheduleSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      const [existing] = await db
        .select()
        .from(article)
        .innerJoin(website, eq(article.websiteId, website.id))
        .where(
          and(
            eq(article.id, input.id),
            eq(website.userId, userId),
            isNull(article.deletedAt)
          )
        );

      if (!existing) {
        throw new ORPCError("NOT_FOUND");
      }

      const [updated] = await db
        .update(article)
        .set({
          status: "scheduled",
          scheduledFor: input.scheduledFor,
          updatedAt: new Date(),
        })
        .where(eq(article.id, input.id))
        .returning();

      // Schedule the job in the queue
      await scheduleArticlePublish(input.id, input.scheduledFor);

      return updated;
    }),

  public: {
    list: apiKeyProcedure
      .input(publicListSchema)
      .handler(async ({ context, input }) => {
        const offset = (input.page - 1) * input.limit;

        const articles = await db
          .select({
            id: article.id,
            websiteId: article.websiteId,
            slug: article.slug,
            title: article.title,
            description: article.description,
            tags: article.tags,
            status: article.status,
            readTime: article.readTime,
            publishedAt: article.publishedAt,
            createdAt: article.createdAt,
            updatedAt: article.updatedAt,
            coverImage: articleImage.url,
          })
          .from(article)
          .leftJoin(
            articleImage,
            and(
              eq(article.id, articleImage.articleId),
              eq(articleImage.type, "cover")
            )
          )
          .where(
            and(
              eq(article.websiteId, context.websiteId),
              eq(article.status, "published"),
              isNull(article.deletedAt)
            )
          )
          .orderBy(desc(article.publishedAt))
          .limit(input.limit)
          .offset(offset);

        return {
          articles,
          page: input.page,
          limit: input.limit,
        };
      }),

    getBySlug: apiKeyProcedure
      .input(publicGetBySlugSchema)
      .handler(async ({ context, input }) => {
        const [result] = await db
          .select({
            id: article.id,
            websiteId: article.websiteId,
            slug: article.slug,
            title: article.title,
            description: article.description,
            content: article.content,
            tags: article.tags,
            status: article.status,
            scheduledFor: article.scheduledFor,
            publishedAt: article.publishedAt,
            readTime: article.readTime,
            createdAt: article.createdAt,
            updatedAt: article.updatedAt,
            deletedAt: article.deletedAt,
            coverImage: articleImage.url,
          })
          .from(article)
          .leftJoin(
            articleImage,
            and(
              eq(article.id, articleImage.articleId),
              eq(articleImage.type, "cover")
            )
          )
          .where(
            and(
              eq(article.websiteId, context.websiteId),
              eq(article.slug, input.slug),
              eq(article.status, "published"),
              isNull(article.deletedAt)
            )
          );

        if (!result) {
          throw new ORPCError("NOT_FOUND");
        }

        return result;
      }),
  },

  generateImageUploadUrl: protectedProcedure
    .input(generateImageUploadUrlSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      // Verify article belongs to user
      const [existing] = await db
        .select()
        .from(article)
        .innerJoin(website, eq(article.websiteId, website.id))
        .where(
          and(
            eq(article.id, input.articleId),
            eq(website.userId, userId),
            isNull(article.deletedAt)
          )
        );

      if (!existing) {
        throw new ORPCError("NOT_FOUND");
      }

      // If uploading a cover image and article already has one, delete the old one
      if (input.imageType === "cover") {
        const [oldCoverImage] = await db
          .select()
          .from(articleImage)
          .where(
            and(
              eq(articleImage.articleId, input.articleId),
              eq(articleImage.type, "cover")
            )
          );

        if (oldCoverImage) {
          await deleteObject(oldCoverImage.key);
          await db
            .delete(articleImage)
            .where(eq(articleImage.id, oldCoverImage.id));
        }
      }

      const imageId = generateId();
      const s3Key = `${existing.article.websiteId}/${imageId}`;
      const imageUrl = getImageUrl(s3Key);

      // Generate presigned URL
      const presignedUrl = await generateUploadPresignedUrl(
        s3Key,
        input.contentType
      );

      // Create article image record
      const [newImage] = await db
        .insert(articleImage)
        .values({
          id: imageId,
          articleId: input.articleId,
          key: s3Key,
          url: imageUrl,
          type: input.imageType,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return {
        presignedUrl,
        image: newImage,
      };
    }),

  deleteImage: protectedProcedure
    .input(deleteImageSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      // Verify image belongs to user's article
      const [existing] = await db
        .select()
        .from(articleImage)
        .innerJoin(article, eq(articleImage.articleId, article.id))
        .innerJoin(website, eq(article.websiteId, website.id))
        .where(
          and(
            eq(articleImage.id, input.imageId),
            eq(website.userId, userId),
            isNull(article.deletedAt)
          )
        );

      if (!existing) {
        throw new ORPCError("NOT_FOUND");
      }

      // Delete from S3
      await deleteObject(existing.article_image.key);

      // Delete from database
      await db.delete(articleImage).where(eq(articleImage.id, input.imageId));

      return { success: true };
    }),
};
