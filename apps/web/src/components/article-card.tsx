"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	MoreVertical,
	Eye,
	Edit,
	Trash2,
	Calendar,
	Clock,
	TrendingUp,
	ImageIcon,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export type ArticleStatus = "draft" | "published" | "scheduled";

export interface Article {
	id: string;
	title: string;
	description: string;
	status: ArticleStatus;
	createdAt: Date;
	publishedAt?: Date;
	scheduledFor?: Date;
	views: number;
	readTime: number;
	completionRate: number;
	tags: string[];
	coverImage?: string;
}

interface ArticleCardProps {
	article: Article;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
	onView?: (id: string) => void;
}

export { ArticleCardSkeleton } from "./article-card-skeleton";

export function ArticleCard({
	article,
	onEdit,
	onDelete,
	onView,
}: ArticleCardProps) {
	const statusConfig = {
		draft: { variant: "secondary" as const, label: "Draft" },
		published: { variant: "default" as const, label: "Published" },
		scheduled: { variant: "outline" as const, label: "Scheduled" },
	};

	const statusInfo = statusConfig[article.status];

	return (
		<Card className="group hover:shadow-lg transition-all duration-300 w-full overflow-hidden hover:scale-[1.02] p-0">
			{/* Cover Image */}
			<div className="aspect-[21/9] w-full bg-muted overflow-hidden relative">
				{article.coverImage ? (
					<img
						src={article.coverImage}
						alt=""
						className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
						<ImageIcon className="size-6 text-muted-foreground/40" />
					</div>
				)}
				{/* Status Badge Overlay */}
				<div className="absolute top-2 left-2">
					<Badge variant={statusInfo.variant} className="shadow-sm">
						{statusInfo.label}
						{article.scheduledFor ? (
							<>
								{" • "}
								<Calendar className="size-3 inline ml-1" />
								{format(article.scheduledFor, "MMM d")}
							</>
						) : null}
					</Badge>
				</div>
				{/* Dropdown Overlay */}
				<div className="absolute top-2 right-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="size-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm hover:bg-background/90"
							>
								<MoreVertical className="size-4" />
								<span className="sr-only">Open menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() => onView?.(article.id)}
								className="cursor-pointer"
							>
								<Eye className="size-4 mr-2" />
								View
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => onEdit?.(article.id)}
								className="cursor-pointer"
							>
								<Edit className="size-4 mr-2" />
								Edit
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => onDelete?.(article.id)}
								className="cursor-pointer text-destructive focus:text-destructive"
							>
								<Trash2 className="size-4 mr-2" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<CardContent className="pt-4 pb-4">
				{/* Title & Description */}
				<div className="mb-3">
					<h3 className="font-semibold text-base leading-snug truncate mb-1.5">
						{article.title}
					</h3>
					<p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
						{article.description}
					</p>
				</div>

				{/* Metadata Row */}
				<div className="flex items-center gap-2 text-xs text-muted-foreground mb-2.5">
					<div className="flex items-center gap-1">
						<Clock className="size-3" />
						<span>{article.readTime} min</span>
					</div>
					{article.status === "published" ? (
						<>
							<span>•</span>
							<div className="flex items-center gap-1">
								<Eye className="size-3" />
								<span>{article.views.toLocaleString()}</span>
							</div>
						</>
					) : null}
				</div>

				{/* Tags */}
				{article.tags.length > 0 ? (
					<div className="flex flex-wrap gap-1">
						{article.tags.slice(0, 3).map((tag) => (
							<Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
								{tag}
							</Badge>
						))}
						{article.tags.length > 3 ? (
							<Badge variant="outline" className="text-[10px] px-1.5 py-0">
								+{article.tags.length - 3}
							</Badge>
						) : null}
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}

