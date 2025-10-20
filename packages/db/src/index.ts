import dotenv from "dotenv";

dotenv.config({
	path: "../../apps/server/.env",
});

import { drizzle } from "drizzle-orm/node-postgres";

export const db = drizzle(process.env.DATABASE_URL || "");

export * from "./schema/auth";
export * from "./schema/content";

// Re-export drizzle-orm operators for consumers
export { eq, and, or, isNull, isNotNull, ilike, desc, asc, not } from "drizzle-orm";

// Re-export ID generation utilities
export { generateId, generateApiKey } from "./utils/id";
