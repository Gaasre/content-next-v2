import { protectedProcedure, publicProcedure } from "../index";
import type { RouterClient } from "@orpc/server";
import { websiteRouter } from "./website";
import { articleRouter } from "./article";
import { analyticsRouter } from "./analytics";
import { waitlistRouter } from "./waitlist";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  privateData: protectedProcedure.handler(({ context }) => {
    return {
      message: "This is private",
      user: context.session?.user,
    };
  }),
  website: websiteRouter,
  article: articleRouter,
  analytics: analyticsRouter,
  waitlist: waitlistRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
