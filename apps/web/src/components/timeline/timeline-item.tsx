"use client";

import { useState, useRef, useEffect } from "react";
import { Eye, Clock, TrendingUp, Award, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ArticleDetailedStats } from "./article-detailed-stats";
import { ArticleEditor } from "./article-editor";
import { ArticleControlBar } from "./article-control-bar";

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
	views?: number; // Optional for now
	completionRate?: number; // Optional for now
}

interface TimelineItemProps {
	article: Article;
}

// Mini sparkline component
function MiniSparkline({ views, seed, color }: { views: number; seed: string; color?: string }) {
	// Deterministic pseudo-random generator based on seed
	const seededRandom = (index: number) => {
		const x = Math.sin(seed.charCodeAt(0) * index + views) * 10000;
		return x - Math.floor(x);
	};

	// Generate consistent trend data (7 points)
	const points = Array.from({ length: 7 }, (_, i) => {
		const variance = seededRandom(i) * 0.4 + 0.8; // 0.8 to 1.2
		return Math.floor(views / 30) * variance * (1 + i * 0.1);
	});

	const max = Math.max(...points);
	const normalized = points.map((p) => (p / max) * 100);

	// Create SVG path
	const width = 40;
	const height = 16;
	const step = width / (points.length - 1);

	const pathData = normalized
		.map((point, i) => {
			const x = i * step;
			const y = height - (point / 100) * height;
			return `${i === 0 ? "M" : "L"} ${x},${y}`;
		})
		.join(" ");

	return (
		<svg
			width={width}
			height={height}
			className={cn("opacity-60 transition-colors", color)}
			viewBox={`0 0 ${width} ${height}`}
		>
			<path
				d={pathData}
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export function TimelineItem({ article }: TimelineItemProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const [isActive, setIsActive] = useState(article.status !== "draft");
	const [title, setTitle] = useState(article.title);
	const [description, setDescription] = useState(article.description);
	const [content, setContent] = useState("");
	const cardRef = useRef<HTMLDivElement>(null);
	const isScheduled = article.status === "scheduled";
	const isDeactivated = article.status === "draft"; // Using draft as deactivated for now
	
	// Determine if article is trending (high views and completion)
	const isTrending = !isScheduled && !isDeactivated && (article.views ?? 0) > 15000 && (article.completionRate ?? 0) > 85;
	
	// Determine if article is high performer (excellent completion rate)
	const isHighPerformer = !isScheduled && !isDeactivated && !isTrending && (article.completionRate ?? 0) >= 90;

	// Smooth scroll to center on expand
	useEffect(() => {
		if (isExpanded && cardRef.current) {
			const card = cardRef.current;
			const cardRect = card.getBoundingClientRect();
			const viewportHeight = window.innerHeight;
			const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
			
			// Calculate position to center the card
			const targetScroll = scrollTop + cardRect.top - (viewportHeight / 2) + (cardRect.height / 2);
			
			// Smooth scroll
			window.scrollTo({
				top: targetScroll,
				behavior: "smooth",
			});
		}
	}, [isExpanded]);

	// Initialize editor content with mock markdown data (without title/description)
	const initialContent = `## Introduction

This is a detailed article preview that would normally be loaded from your CMS or database. The content is displayed in a clean, readable format with proper typography and spacing.

## Key Points

- **Point 1**: Important concept that readers need to understand
- **Point 2**: Another crucial aspect of the topic
- **Point 3**: Practical application examples

## Code Example

\`\`\`typescript
const example = "This would be a code snippet";
console.log(example);
\`\`\`

## Conclusion

This article provides valuable insights into the topic and helps readers understand the concepts better.`.trim();

	const handleContentUpdate = (newContent: string) => {
		setContent(newContent);
		// TODO: Save markdown content to backend
		console.log("Markdown content updated:", newContent);
	};

	const handleToggleActive = (active: boolean) => {
		setIsActive(active);
		// TODO: Update article status in backend
		console.log("Article active status changed:", active);
	};

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
					!isTrending && !isHighPerformer && !isExpanded && "hover:border-primary/50",
					isTrending && !isExpanded && "hover:border-orange-500/50",
					isHighPerformer && !isExpanded && "hover:border-emerald-500/50",
					isScheduled && "opacity-50 bg-muted/50 border-muted",
					isDeactivated && "opacity-40 bg-muted/30 border-muted grayscale",
					isExpanded && "shadow-xl border-primary/50",
					isTrending && !isExpanded && "ring-1 ring-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]",
					isHighPerformer && !isExpanded && "ring-1 ring-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]",
				)}
			>
					{/* Gradient overlay on hover */}
					<div 
						className={cn(
							"absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 pointer-events-none",
							isHovered && !isDeactivated && !isScheduled && !isExpanded && "opacity-100"
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
							<div className={cn(
								"size-2 rounded-full shrink-0 transition-all",
								isDeactivated ? "bg-muted-foreground/40" : "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"
							)} />
						)}
						
						<h3
							className={cn(
								"font-bold text-base leading-tight flex-1 tracking-tight",
								!isExpanded && "truncate",
								isDeactivated && "line-through decoration-muted-foreground/40",
							)}
						>
							{title}
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
						</div>
					</div>

					{/* Line 2: Description */}
					<p
						className={cn(
							"text-sm text-muted-foreground leading-relaxed",
							!isExpanded && "line-clamp-1",
						)}
					>
						{description}
					</p>
					
					{/* Simple Metrics Row */}
					{!isExpanded && !isDeactivated && !isScheduled && (
						<div className="flex items-center justify-between pt-2 mt-1 border-t border-border/50">
							{/* Views with sparkline */}
							<div className="flex items-center gap-2">
								<Eye className={cn(
									"size-3 transition-colors",
									isTrending ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"
								)} />
								<span className={cn(
									"text-xs font-medium transition-colors",
									isTrending && "text-orange-600 dark:text-orange-400"
								)}>
									{(article.views ?? 0).toLocaleString()}
								</span>
								<MiniSparkline 
									views={article.views ?? 0} 
									seed={article.id}
									color={isTrending ? "text-orange-600 dark:text-orange-400" : undefined}
								/>
								{isTrending && (
									<div className="flex items-center gap-0.5 animate-in fade-in slide-in-from-right-1 duration-300">
										<span className="text-[9px] font-bold">🔥</span>
										<span className="text-[9px] font-semibold text-orange-600 dark:text-orange-400">Trending</span>
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
									<TrendingUp className={cn(
										"size-3 transition-colors",
										isHighPerformer ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"
									)} />
									<span className={cn(
										"transition-colors",
										isHighPerformer && "text-emerald-700 dark:text-emerald-300 font-medium"
									)}>
										{article.completionRate ?? 0}%
									</span>
									{isHighPerformer && (
										<div className="flex items-center gap-0.5 animate-in fade-in slide-in-from-left-1 duration-300">
											<Award className="size-2.5 text-emerald-700 dark:text-emerald-300" />
											<span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-300">Top Rated</span>
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
						<div className="px-4 pb-4 space-y-4 border-b border-border/50 relative z-10">
							{/* Title Field */}
							<div className="space-y-2 group/title">
								<label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
									Title
								</label>
								<input
									type="text"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									className={cn(
										"w-full px-3 py-2 -mx-3 text-2xl font-bold leading-tight tracking-tight rounded-md",
										"bg-transparent hover:bg-muted/30 focus:bg-muted/40",
										"border-none outline-none focus:ring-0",
										"text-foreground placeholder:text-muted-foreground/40",
										"transition-all duration-200"
									)}
									placeholder="Article title..."
								/>
							</div>
							
							{/* Description Field */}
							<div className="space-y-2 group/description">
								<label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
									Description
								</label>
								<textarea
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									rows={2}
									className={cn(
										"w-full px-3 py-2 -mx-3 text-sm leading-relaxed resize-none rounded-md",
										"bg-transparent hover:bg-muted/30 focus:bg-muted/40",
										"border-none outline-none focus:ring-0",
										"text-muted-foreground placeholder:text-muted-foreground/40",
										"transition-all duration-200"
									)}
									placeholder="Brief description of your article..."
								/>
							</div>
						</div>
						
						{/* Article Content Editor */}
						<ArticleEditor
							content={initialContent}
							onUpdate={handleContentUpdate}
							editable={true}
						/>

						{/* Control Bar */}
						<ArticleControlBar
							status={article.status}
							isActive={isActive}
							scheduledFor={article.scheduledFor || undefined}
							onToggleActive={handleToggleActive}
						/>

						{/* Detailed Stats - only show for published articles */}
						{!isScheduled ? (
							<ArticleDetailedStats
								views={article.views ?? 0}
								readTime={article.readTime}
								completionRate={article.completionRate ?? 0}
							/>
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

