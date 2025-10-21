import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { article } from "./content";
import { website } from "./content";

export const articleViewEvents = pgTable(
  "article_view_events",
  {
    id: text("id").primaryKey(),
    articleId: text("article_id")
      .notNull()
      .references(() => article.id, { onDelete: "cascade" }),
    websiteId: text("website_id")
      .notNull()
      .references(() => website.id, { onDelete: "cascade" }),
    visitorId: text("visitor_id").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("article_view_events_article_timestamp_idx").on(
      table.articleId,
      table.timestamp
    ),
    index("article_view_events_website_timestamp_idx").on(
      table.websiteId,
      table.timestamp
    ),
    index("article_view_events_visitor_idx").on(table.visitorId),
  ]
);

export const articleReadEvents = pgTable(
  "article_read_events",
  {
    id: text("id").primaryKey(),
    articleId: text("article_id")
      .notNull()
      .references(() => article.id, { onDelete: "cascade" }),
    websiteId: text("website_id")
      .notNull()
      .references(() => website.id, { onDelete: "cascade" }),
    visitorId: text("visitor_id").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
    scrollDepth: integer("scroll_depth").notNull(), // 0-100 percentage
    timeSpent: integer("time_spent").notNull(), // seconds spent reading
  },
  (table) => [
    index("article_read_events_article_timestamp_idx").on(
      table.articleId,
      table.timestamp
    ),
    index("article_read_events_website_timestamp_idx").on(
      table.websiteId,
      table.timestamp
    ),
  ]
);

export const articleStatsDaily = pgTable(
  "article_stats_daily",
  {
    id: text("id").primaryKey(),
    date: date("date").notNull(),
    articleId: text("article_id")
      .notNull()
      .references(() => article.id, { onDelete: "cascade" }),
    websiteId: text("website_id")
      .notNull()
      .references(() => website.id, { onDelete: "cascade" }),
    totalViews: integer("total_views").notNull(),
    uniqueVisitors: integer("unique_visitors").notNull(),
    avgReadTime: real("avg_read_time").notNull(), // minutes
    avgCompletionRate: real("avg_completion_rate").notNull(), // percentage 0-100
    healthScore: real("health_score").notNull(), // 0-100 combined score
  },
  (table) => [
    uniqueIndex("article_stats_daily_date_article_idx").on(
      table.date,
      table.articleId
    ),
    index("article_stats_daily_article_date_idx").on(
      table.articleId,
      table.date
    ),
    index("article_stats_daily_website_date_idx").on(
      table.websiteId,
      table.date
    ),
  ]
);
