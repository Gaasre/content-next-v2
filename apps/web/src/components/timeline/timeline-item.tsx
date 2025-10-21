"use client";

import { useState, useRef, useEffect } from "react";
import { Eye, Clock, TrendingUp, Award, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TrendSparkline } from "@/components/ui/trend-sparkline";
import { ArticleDetailedStats } from "./article-detailed-stats";
import { EditArticleForm } from "../forms/edit-article-form";
import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";

interface Article {
  id: string;
  websiteId: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  status: "draft" | "published" | "scheduled";
  scheduledFor: Date | null;
  publishedAt: Date | null;
  readTime: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface TimelineItemProps {
  article: Article;
}

export function TimelineItem({ article }: TimelineItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isScheduled = article.status === "scheduled";
  const isDeactivated = article.status === "draft";
  const leftoutTags = article.tags.length > 0 ? article.tags.length - 2 : null;

  // Fetch article stats when expanded (lazy load)
  const { data: articleStats, isLoading: isStatsLoading } = useQuery({
    ...orpc.analytics.getArticleStats.queryOptions({
      input: {
        articleId: article.id,
        timeRange: "7d",
      },
    }),
    enabled: isExpanded && !isScheduled,
  });

  // Calculate stats from API data
  const totalViews =
    articleStats?.stats?.reduce(
      (sum, stat) => sum + (stat.totalViews || 0),
      0
    ) || 0;
  const avgCompletionRate = articleStats?.stats?.length
    ? articleStats.stats.reduce(
        (sum, stat) => sum + (stat.avgCompletionRate || 0),
        0
      ) / articleStats.stats.length
    : 0;
  const viewsTrend = articleStats?.stats?.map(
    (stat) => stat.totalViews || 0
  ) || [0, 0, 0, 0, 0, 0, 0];

  // Determine if article is trending (high views and completion)
  const isTrending =
    !isScheduled &&
    !isDeactivated &&
    totalViews > 15000 &&
    avgCompletionRate > 85;

  // Determine if article is high performer (excellent completion rate)
  const isHighPerformer =
    !isScheduled && !isDeactivated && !isTrending && avgCompletionRate >= 90;

  // Smooth scroll to center on expand
  useEffect(() => {
    if (isExpanded && cardRef.current) {
      const card = cardRef.current;
      const cardRect = card.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;

      // Calculate position to center the card
      const targetScroll =
        scrollTop + cardRect.top - viewportHeight / 2 + cardRect.height / 2;

      // Smooth scroll
      window.scrollTo({
        top: targetScroll,
        behavior: "smooth",
      });
    }
  }, [isExpanded]);

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative"
    >
      <div
        className={cn(
          "relative rounded-lg border bg-card transition-all duration-300 overflow-hidden",
          !isExpanded && "hover:shadow-lg hover:scale-[1.01]",
          !isTrending &&
            !isHighPerformer &&
            !isExpanded &&
            "hover:border-primary/50",
          isTrending && !isExpanded && "hover:border-orange-500/50",
          isHighPerformer && !isExpanded && "hover:border-emerald-500/50",
          isScheduled && "opacity-50 bg-muted/50 border-muted",
          isDeactivated &&
            !isExpanded &&
            "opacity-40 bg-muted/30 border-muted grayscale",
          isExpanded && "shadow-xl border-primary/50",
          isTrending &&
            !isExpanded &&
            "ring-1 ring-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]",
          isHighPerformer &&
            !isExpanded &&
            "ring-1 ring-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
        )}
      >
        {/* Gradient overlay on hover */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 pointer-events-none",
            isHovered &&
              !isDeactivated &&
              !isScheduled &&
              !isExpanded &&
              "opacity-100"
          )}
        />

        {/* Trending glow effect */}
        {isTrending && !isExpanded && (
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-red-500/5 to-transparent pointer-events-none" />
        )}

        {/* High Performer glow effect */}
        {isHighPerformer && !isExpanded && (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-green-500/5 to-transparent pointer-events-none" />
        )}

        {/* Compact 2-line layout - clickable when not expanded */}
        {!isExpanded ? (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="w-full text-left p-3 space-y-2 relative z-10 cursor-pointer group/card"
          >
            {/* Line 1: Title and Tags */}
            <div className="flex items-center gap-2">
              {/* Status dot indicator - subtle and non-intrusive */}
              {!isScheduled && !isExpanded && (
                <div
                  className={cn(
                    "size-2 rounded-full shrink-0 transition-all",
                    isDeactivated
                      ? "bg-muted-foreground/40"
                      : "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                  )}
                />
              )}

              <h3
                className={cn(
                  "font-bold text-base leading-tight flex-1 tracking-tight",
                  !isExpanded && "truncate"
                )}
              >
                {article.title}
              </h3>

              {/* Tags */}
              <div className="flex items-center gap-1.5 shrink-0">
                {article.tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4"
                  >
                    {tag}
                  </Badge>
                ))}
                {leftoutTags ? (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4"
                  >
                    +{leftoutTags}
                  </Badge>
                ) : null}
              </div>
            </div>

            {/* Line 2: Description */}
            <p
              className={cn(
                "text-sm text-muted-foreground leading-relaxed",
                !isExpanded && "line-clamp-1"
              )}
            >
              {article.description}
            </p>

            {/* Simple Metrics Row */}
            {!isExpanded && !isDeactivated && !isScheduled && (
              <div className="flex items-center justify-between pt-2 mt-1 border-t border-border/50">
                {/* Views with sparkline */}
                <div className="flex items-center gap-2">
                  <Eye
                    className={cn(
                      "size-3 transition-colors",
                      isTrending
                        ? "text-orange-600 dark:text-orange-400"
                        : "text-muted-foreground"
                    )}
                  />
                  {isStatsLoading ? (
                    <div className="h-3 w-8 bg-muted animate-pulse rounded" />
                  ) : (
                    <span
                      className={cn(
                        "text-xs font-medium transition-colors",
                        isTrending && "text-orange-600 dark:text-orange-400"
                      )}
                    >
                      {totalViews.toLocaleString()}
                    </span>
                  )}
                  {isStatsLoading ? (
                    <div className="h-4 w-10 bg-muted animate-pulse rounded" />
                  ) : (
                    <TrendSparkline
                      data={viewsTrend}
                      color={isTrending ? "hsl(var(--orange))" : "currentColor"}
                    />
                  )}
                  {isTrending && (
                    <div className="flex items-center gap-0.5 animate-in fade-in slide-in-from-right-1 duration-300">
                      <span className="text-[9px] font-bold">🔥</span>
                      <span className="text-[9px] font-semibold text-orange-600 dark:text-orange-400">
                        Trending
                      </span>
                    </div>
                  )}
                </div>

                {/* Read Time & Completion */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="size-3" />
                    <span>{article.readTime} min</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp
                      className={cn(
                        "size-3 transition-colors",
                        isHighPerformer
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-muted-foreground"
                      )}
                    />
                    {isStatsLoading ? (
                      <div className="h-3 w-6 bg-muted animate-pulse rounded" />
                    ) : (
                      <span
                        className={cn(
                          "transition-colors",
                          isHighPerformer &&
                            "text-emerald-700 dark:text-emerald-300 font-medium"
                        )}
                      >
                        {Math.round(avgCompletionRate)}%
                      </span>
                    )}
                    {isHighPerformer && (
                      <div className="flex items-center gap-0.5 animate-in fade-in slide-in-from-left-1 duration-300">
                        <Award className="size-2.5 text-emerald-700 dark:text-emerald-300" />
                        <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-300">
                          Top Rated
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </button>
        ) : (
          /* Expanded Content */
          <motion.div
            className="pt-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Close Button */}
            <div className="absolute top-3 right-3 z-20">
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-md hover:bg-muted/80 transition-colors bg-background/80 backdrop-blur-sm shadow-sm"
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>

            {/* Title and Description Fields */}
            <EditArticleForm
              article={article}
              onSuccess={() => setIsExpanded(false)}
            />

            {/* Detailed Stats - only show for published articles */}
            {!isScheduled ? (
              <ArticleDetailedStats articleId={article.id} />
            ) : (
              <div className="px-4 pb-4 pt-4 border-t text-center">
                <p className="text-sm text-muted-foreground">
                  This article is scheduled for publication and doesn't have
                  stats yet.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
