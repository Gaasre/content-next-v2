import { protectedProcedure } from "../index";
import { db, website, generateId, generateApiKey } from "@content-next-v2/db";
import { z } from "zod";
import { eq, and } from "@content-next-v2/db";
import { ORPCError } from "@orpc/server";

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

			const [newWebsite] = await db.insert(website).values({
				id,
				userId,
				name: input.name,
				domain: input.domain,
				apiKey,
				createdAt: new Date(),
				updatedAt: new Date(),
			}).returning();

			return newWebsite;
		}),

	list: protectedProcedure.handler(async ({ context }) => {
		const userId = context.session.user.id;
		const websites = await db.select().from(website).where(eq(website.userId, userId));
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

