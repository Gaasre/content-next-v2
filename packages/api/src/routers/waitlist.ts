import { publicProcedure } from "../index";
import { z } from "zod";
import { eq, db, waitlist, generateId } from "@content-next-v2/db";
import { ORPCError } from "@orpc/server";

const joinWaitlistSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const waitlistRouter = {
  join: publicProcedure.input(joinWaitlistSchema).handler(async ({ input }) => {
    // Check if email already exists
    const [existing] = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.email, input.email));

    if (existing) {
      throw new ORPCError("CONFLICT", {
        message: "This email is already on the waitlist",
      });
    }

    // Add email to waitlist
    const id = generateId();
    await db
      .insert(waitlist)
      .values({
        id,
        email: input.email,
        createdAt: new Date(),
      })
      .returning();

    return {
      success: true,
      message: "Successfully joined the waitlist!",
    };
  }),
};
