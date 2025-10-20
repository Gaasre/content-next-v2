import { ORPCError, os } from "@orpc/server";
import type { Context } from "./context";
import { db, website } from "@content-next-v2/db";
import { eq } from "@content-next-v2/db";

export const o = os.$context<Context>();

export const publicProcedure = o;

const requireAuth = o.middleware(async ({ context, next }) => {
	if (!context.session?.user) {
		throw new ORPCError("UNAUTHORIZED");
	}
	return next({
		context: {
			session: context.session,
		},
	});
});

export const protectedProcedure = publicProcedure.use(requireAuth);

const requireApiKey = o.middleware(async ({ context, next }) => {
	const apiKey = context.headers?.get("x-api-key");
	
	if (!apiKey) {
		throw new ORPCError("UNAUTHORIZED");
	}

	const [site] = await db.select().from(website).where(eq(website.apiKey, apiKey));

	if (!site) {
		throw new ORPCError("UNAUTHORIZED");
	}

	return next({
		context: {
			websiteId: site.id,
		},
	});
});

export const apiKeyProcedure = publicProcedure.use(requireApiKey);
