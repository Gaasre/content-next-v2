"use client";

import { useState } from "react";
import { Eye, TrendingUp, Clock, Users, Zap, Info, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Article } from "@/components/article-card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface GlobalStatsProps {
	articles: Article[];
}

type Period = "7d" | "30d" | "90d" | "1y";

// Mini trend sparkline
function TrendSparkline({ data, color = "currentColor" }: { data: number[]; color?: string }) {
	const max = Math.max(...data);
	const normalized = data.map((val) => (val / max) * 100);
	
	const width = 40;
	const height = 16;
	const step = width / (data.length - 1);
	
	const pathData = normalized
		.map((point, i) => {
			const x = i * step;
			const y = height - (point / 100) * height;
			return `${i === 0 ? "M" : "L"} ${x},${y}`;
		})
		.join(" ");
	
	return (
		<svg width={width} height={height} className="opacity-60" viewBox={`0 0 ${width} ${height}`}>
			<path
				d={pathData}
				fill="none"
				stroke={color}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

// Circular progress indicator
function CircularProgress({ value, size = 40, color = "currentColor" }: { value: number; size?: number; color?: string }) {
	const radius = (size - 4) / 2;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (value / 100) * circumference;
	
	return (
		<svg width={size} height={size} className="transform -rotate-90">
			{/* Background circle */}
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke="currentColor"
				strokeWidth="3"
				className="opacity-10"
			/>
			{/* Progress circle */}
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke={color}
				strokeWidth="3"
				strokeDasharray={circumference}
				strokeDashoffset={offset}
				strokeLinecap="round"
				className="transition-all duration-500"
			/>
		</svg>
	);
}

export function GlobalStats({ articles }: GlobalStatsProps) {
	const [selectedPeriod, setSelectedPeriod] = useState<Period>("30d");
	const [isMinimized, setIsMinimized] = useState(true);

	const periods: { value: Period; label: string }[] = [
		{ value: "7d", label: "7D" },
		{ value: "30d", label: "30D" },
		{ value: "90d", label: "90D" },
		{ value: "1y", label: "1Y" },
	];

	// Calculate aggregate stats
	const publishedArticles = articles.filter((a) => a.status === "published");
	
	const totalViews = publishedArticles.reduce((sum, a) => sum + a.views, 0);
	const avgCompletion = publishedArticles.length > 0
		? Math.round(publishedArticles.reduce((sum, a) => sum + a.completionRate, 0) / publishedArticles.length)
		: 0;
	const avgReadTime = publishedArticles.length > 0
		? Math.round(publishedArticles.reduce((sum, a) => sum + a.readTime, 0) / publishedArticles.length)
		: 0;
	
	// Calculate engagement score (0-100) based on views and completion
	const maxViews = Math.max(...publishedArticles.map(a => a.views));
	const engagementScore = publishedArticles.length > 0
		? Math.round(
			publishedArticles.reduce((sum, a) => {
				const viewScore = (a.views / maxViews) * 50; // 0-50 points
				const completionScore = (a.completionRate / 100) * 50; // 0-50 points
				return sum + viewScore + completionScore;
			}, 0) / publishedArticles.length
		)
		: 0;
	
	// Estimate weekly active readers (views / avg read time * 7)
	const weeklyReaders = Math.round((totalViews / 30) * 7); // Rough estimate based on 30 days of data
	
	// Generate trend data (mock - would be real data in production)
	const viewsTrend = [12000, 13500, 15000, 14200, 16800, 18500, totalViews];
	const completionTrend = [75, 78, 80, 82, 85, avgCompletion - 2, avgCompletion];
	const readersTrend = [weeklyReaders * 0.7, weeklyReaders * 0.8, weeklyReaders * 0.85, weeklyReaders * 0.9, weeklyReaders * 0.95, weeklyReaders * 0.98, weeklyReaders];

	// Minimized view - compact horizontal bar with all stats
	if (isMinimized) {
		return (
			<div className="fixed top-20 left-6 z-40">
				<motion.button
					type="button"
					onClick={() => setIsMinimized(false)}
					className={cn(
						"group flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-200",
						"border bg-card/80 backdrop-blur-sm shadow-sm hover:bg-card"
					)}
					initial={{ opacity: 0, scale: 0.9, y: -10 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.9, y: -10 }}
					transition={{ duration: 0.3, ease: "easeOut" }}
				>
					{/* Views */}
					<motion.div 
						className="flex items-center gap-1"
						initial={{ opacity: 0, x: -5 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.2, delay: 0.1 }}
					>
						<Eye className="size-3 text-muted-foreground" />
						<span className="text-xs font-semibold tracking-tight">{(totalViews / 1000).toFixed(0)}k</span>
					</motion.div>
					
					<div className="w-px h-3 bg-border/50" />
					
					{/* Completion */}
					<motion.div 
						className="flex items-center gap-1"
						initial={{ opacity: 0, x: -5 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.2, delay: 0.15 }}
					>
						<TrendingUp className="size-3 text-muted-foreground" />
						<span className="text-xs font-semibold tracking-tight">{avgCompletion}%</span>
					</motion.div>
					
					<div className="w-px h-3 bg-border/50" />
					
					{/* Read time */}
					<motion.div 
						className="flex items-center gap-1"
						initial={{ opacity: 0, x: -5 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.2, delay: 0.2 }}
					>
						<Clock className="size-3 text-muted-foreground" />
						<span className="text-xs font-semibold tracking-tight">{avgReadTime}m</span>
					</motion.div>
					
					<div className="w-px h-3 bg-border/50" />
					
					{/* Health */}
					<motion.div 
						className="flex items-center gap-1"
						initial={{ opacity: 0, x: -5 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.2, delay: 0.25 }}
					>
						<Zap className={cn(
							"size-3",
							engagementScore >= 70 ? "text-emerald-600 dark:text-emerald-400" : engagementScore >= 50 ? "text-yellow-600 dark:text-yellow-400" : "text-muted-foreground"
						)} />
						<span className={cn(
							"text-xs font-semibold tracking-tight",
							engagementScore >= 70 ? "text-emerald-600 dark:text-emerald-400" : engagementScore >= 50 ? "text-yellow-600 dark:text-yellow-400" : "text-foreground"
						)}>
							{engagementScore}
						</span>
					</motion.div>
					
					<div className="w-px h-3 bg-border/50" />
					
					{/* Readers */}
					<motion.div 
						className="flex items-center gap-1"
						initial={{ opacity: 0, x: -5 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.2, delay: 0.3 }}
					>
						<Users className="size-3 text-muted-foreground" />
						<span className="text-xs font-semibold tracking-tight">{(weeklyReaders / 1000).toFixed(1)}k</span>
					</motion.div>
					
					<ChevronDown className="size-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors ml-1" />
				</motion.button>
			</div>
		);
	}

	return (
		<div className="fixed top-20 left-6 z-40">
			<motion.div 
				className="flex flex-col rounded-lg border bg-card/80 backdrop-blur-sm shadow-sm w-[220px] overflow-hidden"
				initial={{ opacity: 0, scale: 0.95, y: -10 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.95, y: -10 }}
				transition={{ duration: 0.3, ease: "easeOut" }}
			>
				<motion.div 
					className="flex flex-col gap-3.5 p-4 relative"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.2, delay: 0.1 }}
				>
					{/* Views stat */}
					<div className="relative flex items-start gap-2.5 pr-8">
					<Eye className="size-4 text-muted-foreground shrink-0 mt-0.5" />
					<div className="flex flex-col min-w-0 flex-1">
						<div className="flex items-baseline gap-1.5">
							<span className="text-base font-bold tracking-tight">{totalViews.toLocaleString()}</span>
							<span className="text-[10px] text-muted-foreground uppercase tracking-wider">views</span>
						</div>
						<div className="flex items-center gap-2 mt-0.5">
							<TrendSparkline data={viewsTrend} color="currentColor" />
							<span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">+12%</span>
						</div>
					</div>
				</div>

				<div className="border-t" />

				{/* Completion stat */}
				<div className="relative flex items-start gap-2.5 pr-8">
					<TrendingUp className="size-4 text-muted-foreground shrink-0 mt-0.5" />
					<div className="flex flex-col min-w-0 flex-1">
						<div className="flex items-baseline gap-1.5">
							<span className="text-base font-bold tracking-tight">
								{avgCompletion}%
							</span>
							<span className="text-[10px] text-muted-foreground uppercase tracking-wider">completion</span>
						</div>
						<div className="flex items-center gap-2 mt-0.5">
							<TrendSparkline 
								data={completionTrend} 
								color="currentColor" 
							/>
							<span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
								+5%
							</span>
						</div>
					</div>
					<Tooltip>
						<TooltipTrigger asChild>
							<button type="button" className="absolute top-0.5 right-0">
								<Info className="size-3.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
							</button>
						</TooltipTrigger>
						<TooltipContent side="right" className="max-w-[200px]">
							<p>Average percentage of readers who finish reading your articles</p>
						</TooltipContent>
					</Tooltip>
				</div>

				<div className="border-t" />

				{/* Read time stat */}
				<div className="relative flex items-start gap-2.5 pr-8">
					<Clock className="size-4 text-muted-foreground shrink-0 mt-0.5" />
					<div className="flex flex-col min-w-0 flex-1">
						<div className="flex items-baseline gap-1.5">
							<span className="text-base font-bold tracking-tight">{avgReadTime}</span>
							<span className="text-[10px] text-muted-foreground uppercase tracking-wider">min avg</span>
						</div>
					</div>
				</div>

				<div className="border-t" />

				{/* Engagement score */}
				<div className="relative flex items-start gap-2.5 pr-8">
					<div className="relative shrink-0 mt-0.5">
						<CircularProgress 
							value={engagementScore} 
							size={32} 
							color={engagementScore >= 70 ? "rgb(34 197 94)" : engagementScore >= 50 ? "rgb(234 179 8)" : "currentColor"}
						/>
						<Zap className={cn(
							"size-3 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
							engagementScore >= 70 ? "text-emerald-600 dark:text-emerald-400" : engagementScore >= 50 ? "text-yellow-600 dark:text-yellow-400" : "text-muted-foreground"
						)} />
					</div>
					<div className="flex flex-col min-w-0 flex-1">
						<div className="flex items-baseline gap-1.5">
							<span className={cn(
								"text-base font-bold tracking-tight",
								engagementScore >= 70 ? "text-emerald-600 dark:text-emerald-400" : engagementScore >= 50 ? "text-yellow-600 dark:text-yellow-400" : "text-foreground"
							)}>
								{engagementScore}
							</span>
							<span className="text-[10px] text-muted-foreground uppercase tracking-wider">health</span>
						</div>
						<span className="text-[9px] text-muted-foreground">
							{engagementScore >= 70 ? "Excellent" : engagementScore >= 50 ? "Good" : "Fair"}
						</span>
					</div>
					<Tooltip>
						<TooltipTrigger asChild>
							<button type="button" className="absolute top-0.5 right-0">
								<Info className="size-3.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
							</button>
						</TooltipTrigger>
						<TooltipContent side="right" className="max-w-[200px]">
							<p>Combined score (0-100) measuring views and completion rates across all articles</p>
						</TooltipContent>
					</Tooltip>
				</div>

				<div className="border-t" />

				{/* Weekly readers */}
				<div className="relative flex items-start gap-2.5 pr-8">
					<Users className="size-4 text-muted-foreground shrink-0 mt-0.5" />
					<div className="flex flex-col min-w-0 flex-1">
						<div className="flex items-baseline gap-1.5">
							<span className="text-base font-bold tracking-tight">{weeklyReaders.toLocaleString()}</span>
							<span className="text-[10px] text-muted-foreground uppercase tracking-wider">readers</span>
						</div>
						<div className="flex items-center gap-2 mt-0.5">
							<TrendSparkline data={readersTrend} color="currentColor" />
							<span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">+8%</span>
						</div>
					</div>
					<Tooltip>
						<TooltipTrigger asChild>
							<button type="button" className="absolute top-0.5 right-0">
								<Info className="size-3.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
							</button>
						</TooltipTrigger>
						<TooltipContent side="right" className="max-w-[200px]">
							<p>Unique readers this month across all published articles</p>
						</TooltipContent>
					</Tooltip>
				</div>
				
				{/* Minimize Button */}
				<motion.button
					type="button"
					onClick={() => setIsMinimized(true)}
					className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-background/50 hover:bg-background border border-border/50 hover:border-border transition-all group shadow-sm"
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.2, delay: 0.3 }}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
				>
					<ChevronUp className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
				</motion.button>
				</motion.div>

				{/* Period Switcher - Flush with edges */}
				<motion.div 
					className="flex items-center border-t bg-muted/50"
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.2, delay: 0.2 }}
				>
					{periods.map((period) => (
						<button
							key={period.value}
							type="button"
							onClick={() => setSelectedPeriod(period.value)}
							className={cn(
								"flex-1 px-2 py-2 text-[10px] font-medium transition-all",
								selectedPeriod === period.value
									? "bg-background/50 text-foreground"
									: "text-muted-foreground hover:text-foreground hover:bg-background/30"
							)}
						>
							{period.label}
						</button>
					))}
				</motion.div>
			</motion.div>
		</div>
	);
}

