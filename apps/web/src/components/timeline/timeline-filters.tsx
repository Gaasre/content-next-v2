"use client";

import { Search, X, FileText, Clock, XCircle, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterType = "all" | "published" | "scheduled" | "inactive";

interface TimelineFiltersProps {
  activeFilter: FilterType;
  setActiveFilter: (filter: FilterType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  counts: {
    all: number;
    published: number;
    scheduled: number;
    draft: number;
    trending: number;
    highlyRated: number;
  };
}

export function TimelineFilters({
  activeFilter,
  setActiveFilter,
  searchQuery,
  setSearchQuery,
  counts,
}: TimelineFiltersProps) {
  const {
    all: allCount,
    published: publishedCount,
    scheduled: scheduledCount,
    draft: deactivatedCount,
    trending: trendingCount,
    highlyRated: highlyRatedCount,
  } = counts;

  return (
    <div className="w-full max-w-[900px] mb-10 animate-in fade-in-50 duration-500">
      <div className="pl-[160px]">
        <div className="bg-muted/20 rounded-lg px-2.5 py-1.5 flex items-center gap-3 border border-border/30 transition-all duration-300">
          {/* Status Filters */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 text-xs rounded-md transition-all",
                activeFilter === "all"
                  ? "bg-foreground text-background font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60"
              )}
            >
              <Layers className="size-3" />
              <span>All</span>
              <span
                className={cn(
                  "ml-0.5 px-1 py-0.5 rounded text-[10px] font-medium",
                  activeFilter === "all"
                    ? "bg-background/20"
                    : "bg-background/60"
                )}
              >
                {allCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("published")}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 text-xs rounded-md transition-all",
                activeFilter === "published"
                  ? "bg-foreground text-background font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60"
              )}
            >
              <FileText className="size-3" />
              <span>Published</span>
              <span
                className={cn(
                  "ml-0.5 px-1 py-0.5 rounded text-[10px] font-medium",
                  activeFilter === "published"
                    ? "bg-background/20"
                    : "bg-background/60"
                )}
              >
                {publishedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("scheduled")}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 text-xs rounded-md transition-all",
                activeFilter === "scheduled"
                  ? "bg-foreground text-background font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60"
              )}
            >
              <Clock className="size-3" />
              <span>Scheduled</span>
              <span
                className={cn(
                  "ml-0.5 px-1 py-0.5 rounded text-[10px] font-medium",
                  activeFilter === "scheduled"
                    ? "bg-background/20"
                    : "bg-background/60"
                )}
              >
                {scheduledCount}
              </span>
            </button>

            {deactivatedCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter("inactive")}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 text-xs rounded-md transition-all",
                  activeFilter === "inactive"
                    ? "bg-destructive/15 border border-destructive/30 text-destructive font-medium shadow-sm"
                    : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                )}
              >
                <XCircle className="size-3" />
                <span>Inactive</span>
                <span
                  className={cn(
                    "ml-0.5 px-1 py-0.5 rounded text-[10px] font-medium",
                    activeFilter === "inactive"
                      ? "bg-destructive/20"
                      : "bg-background/60"
                  )}
                >
                  {deactivatedCount}
                </span>
              </button>
            )}
          </div>

          {/* Search - Always visible, right-aligned */}
          <div className="ml-auto flex items-center gap-2 px-2 py-0.5 rounded-md bg-background/60 border border-border/40">
            <Search className="size-3 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[160px] bg-transparent text-xs outline-none placeholder:text-muted-foreground/70"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="shrink-0 p-0.5 hover:bg-muted rounded transition-colors"
              >
                <X className="size-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
