"use client";

import { useState, useMemo } from "react";
import { ArticleCard, ArticleCardSkeleton, type Article, type ArticleStatus } from "./article-card";
import { EmptyState } from "./empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, FileEdit, Calendar as CalendarIcon } from "lucide-react";

interface ArticlesListProps {
	articles: Article[];
	searchQuery: string;
	sortBy: string;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
	onView?: (id: string) => void;
	onCreate?: () => void;
	isLoading?: boolean;
}

export function ArticlesList({
	articles,
	searchQuery,
	sortBy,
	onEdit,
	onDelete,
	onView,
	onCreate,
	isLoading = false,
}: ArticlesListProps) {
	const [activeTab, setActiveTab] = useState<"all" | ArticleStatus>("all");

	// Filter articles
	const filteredArticles = useMemo(() => {
		let filtered = articles;

		// Filter by status
		if (activeTab !== "all") {
			filtered = filtered.filter((article) => article.status === activeTab);
		}

		// Filter by search query
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(article) =>
					article.title.toLowerCase().includes(query) ||
					article.description.toLowerCase().includes(query) ||
					article.tags.some((tag) => tag.toLowerCase().includes(query)),
			);
		}

		// Sort articles
		const sorted = [...filtered];
		switch (sortBy) {
			case "recent":
				sorted.sort(
					(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
				);
				break;
			case "oldest":
				sorted.sort(
					(a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
				);
				break;
			case "views":
				sorted.sort((a, b) => b.views - a.views);
				break;
			case "title":
				sorted.sort((a, b) => a.title.localeCompare(b.title));
				break;
		}

		return sorted;
	}, [articles, activeTab, searchQuery, sortBy]);

	const counts = useMemo(() => {
		return {
			all: articles.length,
			published: articles.filter((a) => a.status === "published").length,
			draft: articles.filter((a) => a.status === "draft").length,
			scheduled: articles.filter((a) => a.status === "scheduled").length,
		};
	}, [articles]);

	const EmptyStateContent = () => {
		if (searchQuery && filteredArticles.length === 0) {
			return (
				<EmptyState
					icon={FileText}
					title="No articles found"
					description={`No articles match your search for "${searchQuery}". Try a different search term.`}
				/>
			);
		}

		const emptyStates: Record<typeof activeTab, { icon: typeof FileText; title: string; description: string }> = {
			all: {
				icon: FileText,
				title: "No articles yet",
				description:
					"Get started by creating your first article. Share your knowledge with the world.",
			},
			draft: {
				icon: FileEdit,
				title: "No drafts",
				description:
					"You don't have any draft articles. Start writing and save as draft to see them here.",
			},
			published: {
				icon: FileText,
				title: "No published articles",
				description:
					"You haven't published any articles yet. Publish a draft to see it here.",
			},
			scheduled: {
				icon: CalendarIcon,
				title: "No scheduled articles",
				description:
					"No articles are scheduled for future publication. Schedule an article to see it here.",
			},
		};

		const state = emptyStates[activeTab];
		return (
			<EmptyState
				icon={state.icon}
				title={state.title}
				description={state.description}
				actionLabel={activeTab === "all" ? "Create Article" : undefined}
				onAction={activeTab === "all" ? onCreate : undefined}
			/>
		);
	};

	return (
		<div className="space-y-6">
			<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
				<TabsList>
					<TabsTrigger value="all">
						All ({counts.all})
					</TabsTrigger>
					<TabsTrigger value="published">
						Published ({counts.published})
					</TabsTrigger>
					<TabsTrigger value="draft">
						Drafts ({counts.draft})
					</TabsTrigger>
					<TabsTrigger value="scheduled">
						Scheduled ({counts.scheduled})
					</TabsTrigger>
				</TabsList>

				<TabsContent value={activeTab} className="mt-6">
					{isLoading ? (
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{Array.from({ length: 6 }).map((_, i) => (
								<ArticleCardSkeleton key={i} />
							))}
						</div>
					) : filteredArticles.length > 0 ? (
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{filteredArticles.map((article) => (
								<ArticleCard
									key={article.id}
									article={article}
									onEdit={onEdit}
									onDelete={onDelete}
									onView={onView}
								/>
							))}
						</div>
					) : (
						<EmptyStateContent />
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}

