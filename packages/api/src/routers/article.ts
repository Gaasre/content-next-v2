import { protectedProcedure, apiKeyProcedure } from "../index";
import { db, article, website, generateId } from "@content-next-v2/db";
import { z } from "zod";
import { eq, and, isNull, or, ilike, desc } from "@content-next-v2/db";
import { ORPCError } from "@orpc/server";

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
				.where(and(eq(website.id, input.websiteId), eq(website.userId, userId)));

			if (!site) {
				throw new ORPCError("NOT_FOUND");
			}

			const id = generateId();
			const readTime = calculateReadTime(input.content);

			const [newArticle] = await db.insert(article).values({
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
			}).returning();

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
				.where(and(eq(website.id, input.websiteId), eq(website.userId, userId)));

			if (!site) {
				throw new ORPCError("NOT_FOUND");
			}

			const offset = (input.page - 1) * input.limit;

			const conditions = [
				eq(article.websiteId, input.websiteId),
				isNull(article.deletedAt),
			];

			if (input.status) {
				conditions.push(eq(article.status, input.status));
			}

			if (input.search) {
				conditions.push(
					or(
						ilike(article.title, `%${input.search}%`),
						ilike(article.description, `%${input.search}%`)
					) || eq(article.id, article.id)
				);
			}

			const articles = await db
				.select()
				.from(article)
				.where(and(...conditions))
				.orderBy(desc(article.createdAt))
				.limit(input.limit)
				.offset(offset);

			return {
				articles,
				page: input.page,
				limit: input.limit,
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

			const readTime = input.content
				? calculateReadTime(input.content)
				: existing.article.readTime;

			const [updated] = await db
				.update(article)
				.set({
					...(input.slug && { slug: input.slug }),
					...(input.title && { title: input.title }),
					...(input.description && { description: input.description }),
					...(input.content && { content: input.content }),
					...(input.tags && { tags: input.tags }),
					...(input.status && { status: input.status }),
					...(input.scheduledFor !== undefined && { scheduledFor: input.scheduledFor }),
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

			return updated;
		}),

	public: {
		list: apiKeyProcedure
			.input(publicListSchema)
			.handler(async ({ context, input }) => {
				const offset = (input.page - 1) * input.limit;

				const articles = await db
					.select()
					.from(article)
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
					.select()
					.from(article)
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
};

