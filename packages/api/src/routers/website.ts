import { protectedProcedure } from "../index";
import {
  db,
  website,
  article,
  articleImage,
  generateId,
  generateApiKey,
} from "@content-next-v2/db";
import { z } from "zod";
import { eq, and, inArray } from "@content-next-v2/db";
import { ORPCError } from "@orpc/server";
import { deleteObjects } from "@content-next-v2/s3";

const createWebsiteSchema = z.object({
  name: z.string().min(1).max(100),
  domain: z.string().min(1).max(255),
});

const updateWebsiteSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  domain: z.string().min(1).max(255).optional(),
});

const getByIdSchema = z.object({
  id: z.string(),
});

const deleteSchema = z.object({
  id: z.string(),
});

const regenerateApiKeySchema = z.object({
  id: z.string(),
});

export const websiteRouter = {
  create: protectedProcedure
    .input(createWebsiteSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;
      const id = generateId();
      const apiKey = generateApiKey();

      const [newWebsite] = await db
        .insert(website)
        .values({
          id,
          userId,
          name: input.name,
          domain: input.domain,
          apiKey,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return newWebsite;
    }),

  list: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;
    const websites = await db
      .select()
      .from(website)
      .where(eq(website.userId, userId));
    return websites;
  }),

  getById: protectedProcedure
    .input(getByIdSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;
      const [site] = await db
        .select()
        .from(website)
        .where(and(eq(website.id, input.id), eq(website.userId, userId)));

      if (!site) {
        throw new ORPCError("NOT_FOUND");
      }

      return site;
    }),

  update: protectedProcedure
    .input(updateWebsiteSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      const [updated] = await db
        .update(website)
        .set({
          ...(input.name && { name: input.name }),
          ...(input.domain && { domain: input.domain }),
          updatedAt: new Date(),
        })
        .where(and(eq(website.id, input.id), eq(website.userId, userId)))
        .returning();

      if (!updated) {
        throw new ORPCError("NOT_FOUND");
      }

      return updated;
    }),

  delete: protectedProcedure
    .input(deleteSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      // Get all articles for this website
      const articles = await db
        .select({ id: article.id })
        .from(article)
        .where(eq(article.websiteId, input.id));

      // Get all images for these articles
      if (articles.length > 0) {
        const articleIds = articles.map((a) => a.id);
        const images = await db
          .select({ key: articleImage.key })
          .from(articleImage)
          .where(inArray(articleImage.articleId, articleIds));

        // Delete all images from S3
        if (images.length > 0) {
          const imageKeys = images.map((img) => img.key);
          await deleteObjects(imageKeys);
        }
      }

      const [deleted] = await db
        .delete(website)
        .where(and(eq(website.id, input.id), eq(website.userId, userId)))
        .returning();

      if (!deleted) {
        throw new ORPCError("NOT_FOUND");
      }

      return { success: true };
    }),

  regenerateApiKey: protectedProcedure
    .input(regenerateApiKeySchema)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;
      const newApiKey = generateApiKey();

      const [updated] = await db
        .update(website)
        .set({
          apiKey: newApiKey,
          updatedAt: new Date(),
        })
        .where(and(eq(website.id, input.id), eq(website.userId, userId)))
        .returning();

      if (!updated) {
        throw new ORPCError("NOT_FOUND");
      }

      return updated;
    }),
};
