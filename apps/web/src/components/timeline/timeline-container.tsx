"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { TimelineItem } from "./timeline-item";
import { TimelineDateMarker } from "./timeline-date-marker";
import { NewArticleComposer } from "./new-article-composer";
import { TimelineFilters } from "./timeline-filters";
import { useInfiniteQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { useWebsite } from "@/contexts/website-context";
import { Skeleton } from "@/components/ui/skeleton";

type FilterType = "all" | "published" | "scheduled" | "inactive";

export function TimelineContainer() {
  const { currentWebsite } = useWebsite();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Map filter to API status
  const getStatusForFilter = (filter: FilterType) => {
    switch (filter) {
      case "published":
        return "published";
      case "scheduled":
        return "scheduled";
      case "inactive":
        return "draft";
      default:
        return undefined;
    }
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery(
    orpc.article.list.infiniteOptions({
      input: (pageParam: number | undefined) => ({
        websiteId: currentWebsite?.id || "",
        page: pageParam || 1,
        limit: 20,
        status: getStatusForFilter(activeFilter),
        search: searchQuery || undefined,
      }),
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) => {
        if (lastPage.articles.length < 20) return undefined;
        return allPages.length + 1;
      },
      enabled: !!currentWebsite,
    })
  );

  // Flatten pages into single article array
  // Articles are already sorted by the server: Drafts first, then timeline (scheduled + published)
  const articles = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.articles);
  }, [data]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Get counts from API response (first page contains the counts)
  const apiCounts = data?.pages?.[0]?.counts;
  const publishedCount = apiCounts?.published || 0;
  const scheduledCount = apiCounts?.scheduled || 0;
  const deactivatedCount = apiCounts?.draft || 0;
  const allCount = apiCounts?.all || 0;
  const trendingCount = apiCounts?.trending || 0;
  const highlyRatedCount = apiCounts?.highlyRated || 0;

  return (
    <div className="min-h-screen w-full flex flex-col items-center py-12 px-4">
      {/* Filter Bar */}
      <TimelineFilters
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        counts={{
          all: allCount,
          published: publishedCount,
          scheduled: scheduledCount,
          draft: deactivatedCount,
          trending: trendingCount,
          highlyRated: highlyRatedCount,
        }}
      />

      <div className="w-full max-w-[900px] relative">
        {/* New Article Composer - Before Timeline */}
        <div
          className="pl-[160px] mb-12 animate-in fade-in-50 duration-500"
          style={{ animationDelay: "100ms" }}
        >
          <NewArticleComposer />
        </div>

        {/* Timeline vertical line - elegant gradient */}
        <div className="absolute left-[130px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-border via-border to-transparent" />

        {/* Subtle glow effect */}
        <div className="absolute left-[130px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent opacity-50" />

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-10">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="relative pl-[160px]">
                <div className="absolute left-0 top-2">
                  <Skeleton className="h-8 w-28 rounded-md" />
                </div>
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="text-center py-16 ml-32">
            <p className="text-destructive text-sm">Failed to load articles</p>
          </div>
        )}

        {/* No website selected */}
        {!currentWebsite && !isLoading && (
          <div className="text-center py-16 ml-36">
            <p className="text-muted-foreground text-sm">
              Please select a website to view articles
            </p>
          </div>
        )}

        {/* Timeline items */}
        {!isLoading && !isError && currentWebsite && (
          <div className="space-y-10">
            {articles.length === 0 ? (
              <div className="text-center py-16 ml-36">
                <p className="text-muted-foreground text-sm">
                  {searchQuery || activeFilter !== "all"
                    ? "No articles found matching your filters."
                    : "No articles yet. Create your first article above!"}
                </p>
              </div>
            ) : (
              articles.map((article, index) => {
                const isDraft = article.status === "draft";
                const isScheduled = article.status === "scheduled";
                const displayDate = isScheduled
                  ? article.scheduledFor ?? undefined
                  : article.publishedAt ?? undefined;

                return (
                  <div
                    key={article.id}
                    className="relative pl-[160px] animate-in fade-in-50 slide-in-from-left-5 duration-500"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Date Marker - on left side of line */}
                    <div className="absolute left-0 top-2">
                      <TimelineDateMarker
                        date={displayDate}
                        isScheduled={isScheduled}
                        isDraft={isDraft}
                      />
                    </div>

                    {/* Article Card */}
                    <TimelineItem article={article} />
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Infinite scroll trigger */}
        {hasNextPage && !isFetchingNextPage && (
          <div ref={loadMoreRef} className="h-20" />
        )}

        {/* Loading more indicator */}
        {isFetchingNextPage && (
          <div className="relative pl-[160px] mt-10">
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        )}

        {/* End marker */}
        {!isLoading && articles.length > 0 && !hasNextPage && (
          <div className="relative pl-[160px] pt-8">
            <div className="absolute left-[130px] top-8">
              <div className="size-1.5 rounded-full bg-border/60" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
