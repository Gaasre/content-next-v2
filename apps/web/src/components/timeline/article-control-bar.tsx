"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ArticleStatus } from "@/components/article-card";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

interface ArticleControlBarProps {
	status: ArticleStatus;
	isActive: boolean;
	scheduledFor?: Date;
	onToggleActive?: (active: boolean) => void;
	className?: string;
}

export function ArticleControlBar({
	status,
	isActive,
	scheduledFor,
	onToggleActive,
	className,
}: ArticleControlBarProps) {
	const statusConfig = {
		draft: { 
			variant: "secondary" as const, 
			label: "Draft",
		},
		published: { 
			variant: "default" as const, 
			label: "Published",
		},
		scheduled: { 
			variant: "outline" as const, 
			label: "Scheduled",
		},
	};

	const statusInfo = statusConfig[status];

	return (
		<div
			className={cn(
				"flex items-center gap-3 px-4 py-1 bg-muted/40 border-t border-border/50",
				className,
			)}
		>
			{/* Left side: Status badge */}
			<Badge variant={statusInfo.variant} className="text-[10px] h-4 px-1.5">
				{statusInfo.label}
				{scheduledFor && status === "scheduled" ? (
					<>
						{" • "}
						<Calendar className="size-2 inline ml-0.5" />
						{format(scheduledFor, "MMM d")}
					</>
				) : null}
			</Badge>

			{/* Right side: Clickable state badge */}
			<button
				type="button"
				onClick={() => onToggleActive?.(!isActive)}
				className={cn(
					"group relative px-2 py-0.5 rounded text-[10px] font-medium transition-all duration-200",
					"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1",
					"hover:scale-[1.02] active:scale-95",
					isActive 
						? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 focus-visible:ring-emerald-500/50" 
						: "bg-muted/80 text-muted-foreground focus-visible:ring-border",
				)}
			>
				<span className="sr-only">Toggle active status</span>
				<span className="flex items-center gap-1">
					<span className={cn(
						"size-1 rounded-full transition-all duration-200",
						isActive 
							? "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)]" 
							: "bg-muted-foreground/40",
					)} />
					<span>{isActive ? "Active" : "Inactive"}</span>
				</span>
			</button>
		</div>
	);
}

