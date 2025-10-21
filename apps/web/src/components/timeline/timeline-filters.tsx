"use client";

import {
  Search,
  TrendingUp,
  Award,
  X,
  FileText,
  Clock,
  XCircle,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FilterType =
  | "all"
  | "published"
  | "scheduled"
  | "inactive"
  | "trending"
  | "highly-rated";

interface TimelineFiltersProps {
  activeFilter: FilterType;
  setActiveFilter: (filter: FilterType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchExpanded: boolean;
  setIsSearchExpanded: (expanded: boolean) => void;
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
  isSearchExpanded,
  setIsSearchExpanded,
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
    <div className="w-full max-w-[900px] mb-10 animate-in fade-in-50 duration-500 space-y-3">
      {/* Row 1: Status Filters */}
      <div className="flex items-center gap-1.5 flex-wrap pl-[160px]">
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-all",
            activeFilter === "all"
              ? "bg-foreground text-background font-medium shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <Layers className="size-3.5" />
          <span>All</span>
          <span
            className={cn(
              "ml-0.5 px-1 py-0.5 rounded text-[10px] font-medium",
              activeFilter === "all" ? "bg-background/20" : "bg-muted"
            )}
          >
            {allCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("published")}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-all",
            activeFilter === "published"
              ? "bg-foreground text-background font-medium shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <FileText className="size-3.5" />
          <span>Published</span>
          <span
            className={cn(
              "ml-0.5 px-1 py-0.5 rounded text-[10px] font-medium",
              activeFilter === "published" ? "bg-background/20" : "bg-muted"
            )}
          >
            {publishedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("scheduled")}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-all",
            activeFilter === "scheduled"
              ? "bg-foreground text-background font-medium shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <Clock className="size-3.5" />
          <span>Scheduled</span>
          <span
            className={cn(
              "ml-0.5 px-1 py-0.5 rounded text-[10px] font-medium",
              activeFilter === "scheduled" ? "bg-background/20" : "bg-muted"
            )}
          >
            {scheduledCount}
          </span>
        </button>

        {trendingCount > 0 && (
          <button
            type="button"
            onClick={() => setActiveFilter("trending")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-all",
              activeFilter === "trending"
                ? "bg-gradient-to-r from-orange-500/15 to-red-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 font-semibold shadow-sm"
                : "text-muted-foreground hover:text-orange-600 hover:bg-orange-500/10"
            )}
          >
            <TrendingUp className="size-3.5" />
            <span>Trending</span>
            <span
              className={cn(
                "ml-0.5 px-1 py-0.5 rounded text-[10px] font-medium",
                activeFilter === "trending" ? "bg-orange-500/20" : "bg-muted"
              )}
            >
              {trendingCount}
            </span>
          </button>
        )}

        {highlyRatedCount > 0 && (
          <button
            type="button"
            onClick={() => setActiveFilter("highly-rated")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-all",
              activeFilter === "highly-rated"
                ? "bg-gradient-to-r from-emerald-500/15 to-green-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold shadow-sm"
                : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10"
            )}
          >
            <Award className="size-3.5" />
            <span>Highly Rated</span>
            <span
              className={cn(
                "ml-0.5 px-1 py-0.5 rounded text-[10px] font-medium",
                activeFilter === "highly-rated"
                  ? "bg-emerald-500/20"
                  : "bg-muted"
              )}
            >
              {highlyRatedCount}
            </span>
          </button>
        )}

        {deactivatedCount > 0 && (
          <button
            type="button"
            onClick={() => setActiveFilter("inactive")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-all",
              activeFilter === "inactive"
                ? "bg-destructive/15 border border-destructive/30 text-destructive font-semibold shadow-sm"
                : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            )}
          >
            <XCircle className="size-3.5" />
            <span>Inactive</span>
            <span
              className={cn(
                "ml-0.5 px-1 py-0.5 rounded text-[10px] font-medium",
                activeFilter === "inactive" ? "bg-destructive/20" : "bg-muted"
              )}
            >
              {deactivatedCount}
            </span>
          </button>
        )}
      </div>

      {/* Row 2: Search */}
      <div className="flex items-center gap-3 pl-[160px]">
        {/* Search */}
        {isSearchExpanded ? (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border bg-muted/30">
            <Search className="size-3.5 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[180px] bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                setIsSearchExpanded(false);
                setSearchQuery("");
              }}
              className="shrink-0 p-0.5 hover:bg-muted rounded transition-colors"
            >
              <X className="size-3 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsSearchExpanded(true)}
            className="p-1.5 rounded-md hover:bg-muted/50 transition-colors"
          >
            <Search className="size-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
