"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Search, TrendingUp, Award, X, FileText, Clock, XCircle, Layers, Eye } from "lucide-react";
import type { Article } from "@/components/article-card";
import { TimelineItem } from "./timeline-item";
import { TimelineDateMarker } from "./timeline-date-marker";
import { NewArticleComposer } from "./new-article-composer";
import { GlobalStats } from "./global-stats";
import { cn } from "@/lib/utils";
import { useInfiniteQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { useWebsite } from "@/contexts/website-context";
import { Skeleton } from "@/components/ui/skeleton";

type FilterType = "all" | "published" | "scheduled" | "inactive" | "trending" | "highly-rated";

interface ViewsRange {
	label: string;
	min: number;
	max: number | null; // null means infinity
}

export function TimelineContainer() {
	const { currentWebsite } = useWebsite();
	const [searchQuery, setSearchQuery] = useState("");
	const [activeFilter, setActiveFilter] = useState<FilterType>("all");
	const [isSearchExpanded, setIsSearchExpanded] = useState(false);
	const [viewsRange, setViewsRange] = useState<ViewsRange | null>(null);
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
	const articles = useMemo(() => {
		if (!data?.pages) return [];
		return data.pages.flatMap(page => page.articles);
	}, [data]);

	// Apply client-side filters and sorting
	const filteredAndSortedArticles = useMemo(() => {
		let filtered = articles;

		// Note: trending and highly-rated filters removed (require analytics)
		// These will be added when analytics tables are implemented

		// Sort by date (most recent first)
		return [...filtered].sort((a, b) => {
			const dateA = a.scheduledFor || a.publishedAt || a.createdAt;
			const dateB = b.scheduledFor || b.publishedAt || b.createdAt;
			return dateB.getTime() - dateA.getTime();
		});
	}, [articles]);

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

	const publishedCount = articles.filter((a) => a.status === "published").length;
	const scheduledCount = articles.filter((a) => a.status === "scheduled").length;
	const deactivatedCount = articles.filter((a) => a.status === "draft").length;
	// Trending and highly-rated counts disabled until analytics are implemented
	const trendingCount = 0;
	const highlyRatedCount = 0;

	return (
		<div className="min-h-screen w-full flex flex-col items-center py-12 px-4">
			{/* Filter Bar - Two Rows, Left Aligned */}
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
						<span className={cn(
							"ml-0.5 px-1 py-0.5 rounded text-[10px] font-medium",
							activeFilter === "all" ? "bg-background/20" : "bg-muted"
						)}>
							{articles.length}
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
						<span className={cn(
							"ml-0.5 px-1 py-0.5 rounded text-[10px] font-medium",
							activeFilter === "published" ? "bg-background/20" : "bg-muted"
						)}>
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
						<span className={cn(
							"ml-0.5 px-1 py-0.5 rounded text-[10px] font-medium",
							activeFilter === "scheduled" ? "bg-background/20" : "bg-muted"
						)}>
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
							<span className={cn(
								"ml-0.5 px-1 py-0.5 rounded text-[10px] font-medium",
								activeFilter === "trending" ? "bg-orange-500/20" : "bg-muted"
							)}>
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
							<span className={cn(
								"ml-0.5 px-1 py-0.5 rounded text-[10px] font-medium",
								activeFilter === "highly-rated" ? "bg-emerald-500/20" : "bg-muted"
							)}>
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
							<span className={cn(
								"ml-0.5 px-1 py-0.5 rounded text-[10px] font-medium",
								activeFilter === "inactive" ? "bg-destructive/20" : "bg-muted"
							)}>
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

			<div className="w-full max-w-[900px] relative">
				{/* New Article Composer - Before Timeline */}
				<div className="pl-[160px] mb-12 animate-in fade-in-50 duration-500" style={{ animationDelay: "100ms" }}>
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
					<div className="text-center py-16">
						<p className="text-destructive text-sm">Failed to load articles</p>
					</div>
				)}

				{/* No website selected */}
				{!currentWebsite && !isLoading && (
					<div className="text-center py-16">
						<p className="text-muted-foreground text-sm">Please select a website to view articles</p>
					</div>
				)}

				{/* Timeline items */}
				{!isLoading && !isError && currentWebsite && (
					<div className="space-y-10">
						{filteredAndSortedArticles.length === 0 ? (
							<div className="text-center py-16">
								<p className="text-muted-foreground text-sm">
									{searchQuery || activeFilter !== "all"
										? "No articles found matching your filters."
										: "No articles yet. Create your first article above!"}
								</p>
							</div>
						) : (
							filteredAndSortedArticles.map((article, index) => {
								const displayDate =
									article.scheduledFor || article.publishedAt || article.createdAt;
								const isScheduled = article.status === "scheduled";

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
				{!isLoading && filteredAndSortedArticles.length > 0 && !hasNextPage && (
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

