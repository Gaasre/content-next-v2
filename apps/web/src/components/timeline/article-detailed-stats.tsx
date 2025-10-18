"use client";

import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart } from "recharts";

interface ArticleDetailedStatsProps {
	views: number;
	readTime: number;
	completionRate: number;
}

// Mock data for views over time chart
const generateViewsData = (totalViews: number) => {
	const data = [];
	const days = 30;
	let accumulated = 0;

	for (let i = 0; i < days; i++) {
		const dailyViews = Math.floor(
			(totalViews / days) * (0.5 + Math.random() * 1.5),
		);
		accumulated += dailyViews;
		data.push({
			day: i + 1,
			views: Math.min(accumulated, totalViews),
		});
	}

	return data;
};

const chartConfig = {
	views: {
		label: "Views",
		color: "var(--color-chart-1)",
	},
};

export function ArticleDetailedStats({
	views,
	readTime,
	completionRate,
}: ArticleDetailedStatsProps) {
	const viewsData = generateViewsData(views);

	return (
		<div className="space-y-0">
			{/* Impressive stats row */}
			<div className="px-4 py-3 flex items-center justify-between border-t bg-gradient-to-br from-muted/40 to-muted/20">
				<div className="flex flex-col">
					<span className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
						{views.toLocaleString()}
					</span>
					<span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">
						Total Views
					</span>
				</div>
				<div className="flex gap-6">
					<div className="flex flex-col items-end">
						<div className="flex items-baseline gap-1">
							<span className="text-2xl font-bold">{readTime}</span>
							<span className="text-xs text-muted-foreground">min</span>
						</div>
						<span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">
							Read Time
						</span>
					</div>
					<div className="flex flex-col items-end">
						<div className="flex items-baseline gap-1">
							<span className="text-2xl font-bold">{completionRate}</span>
							<span className="text-xs text-muted-foreground">%</span>
						</div>
						<span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">
							Completion
						</span>
					</div>
				</div>
			</div>

			{/* Large impressive chart */}
			<div className="relative h-[200px] w-full overflow-hidden bg-gradient-to-b from-muted/10 to-transparent">
				{/* Subtle grid pattern */}
				<div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
				
				<ChartContainer config={chartConfig} className="h-full w-full">
					<AreaChart
						data={viewsData}
						margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
					>
						<defs>
							<linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="0%"
									stopColor="var(--color-chart-1)"
									stopOpacity={0.4}
								/>
								<stop
									offset="50%"
									stopColor="var(--color-chart-1)"
									stopOpacity={0.2}
								/>
								<stop
									offset="100%"
									stopColor="var(--color-chart-1)"
									stopOpacity={0}
								/>
							</linearGradient>
						</defs>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent indicator="dot" hideLabel />}
						/>
						<Area
							dataKey="views"
							type="monotone"
							fill="url(#fillViews)"
							fillOpacity={1}
							stroke="var(--color-chart-1)"
							strokeWidth={2.5}
						/>
					</AreaChart>
				</ChartContainer>
			</div>
		</div>
	);
}

