import { pgTable, text, timestamp, integer, index, uniqueIndex, pgEnum } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const articleStatusEnum = pgEnum("article_status", ["draft", "published", "scheduled"]);

export const website = pgTable("website", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	domain: text("domain").notNull(),
	apiKey: text("api_key").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
}, (table) => [
	index("website_api_key_idx").on(table.apiKey),
	index("website_user_id_idx").on(table.userId),
]);

export const article = pgTable("article", {
	id: text("id").primaryKey(),
	websiteId: text("website_id")
		.notNull()
		.references(() => website.id, { onDelete: "cascade" }),
	slug: text("slug").notNull(),
	title: text("title").notNull(),
	description: text("description").notNull(),
	content: text("content").notNull(),
	tags: text("tags").array().notNull().default([]),
	status: articleStatusEnum("status").notNull().default("draft"),
	scheduledFor: timestamp("scheduled_for"),
	publishedAt: timestamp("published_at"),
	readTime: integer("read_time").notNull().default(0),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	deletedAt: timestamp("deleted_at"),
}, (table) => [
	index("article_website_id_idx").on(table.websiteId),
	uniqueIndex("article_slug_website_idx").on(table.slug, table.websiteId),
	index("article_status_idx").on(table.status),
	index("article_deleted_at_idx").on(table.deletedAt),
]);

