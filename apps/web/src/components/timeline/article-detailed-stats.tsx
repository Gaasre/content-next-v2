"use client";

import { useState } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, XAxis } from "recharts";
import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";

interface ArticleDetailedStatsProps {
  articleId: string;
}

type TimeRange = "7d" | "30d" | "90d" | "1y";

// Transform API data to chart format
const transformStatsToChartData = (stats: any[], timeRange: TimeRange) => {
  if (!stats || stats.length === 0) {
    // Return array of zeros based on time range with proper date generation
    const length =
      timeRange === "7d"
        ? 7
        : timeRange === "30d"
        ? 30
        : timeRange === "90d"
        ? 90
        : 12;

    const today = new Date();
    return Array.from({ length }, (_, index) => {
      const date = new Date(today);
      if (timeRange === "1y") {
        // For yearly, go back by months
        date.setMonth(date.getMonth() - (length - 1 - index));
      } else {
        // For daily ranges, go back by days
        date.setDate(date.getDate() - (length - 1 - index));
      }
      return {
        day: index + 1,
        views: 0,
        date: date.toISOString().split("T")[0],
      };
    });
  }

  return stats.map((stat, index) => ({
    day: index + 1,
    views: stat.totalViews || 0,
    date: stat.date,
  }));
};

const chartConfig = {
  views: {
    label: "Views",
    color: "var(--color-chart-1)",
  },
};

export function ArticleDetailedStats({ articleId }: ArticleDetailedStatsProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("30d");

  // Fetch article stats
  const { data: articleStats, isLoading } = useQuery({
    ...orpc.analytics.getArticleStats.queryOptions({
      input: {
        articleId,
        timeRange: selectedTimeRange,
      },
    }),
  });

  // Calculate summary stats from API data
  const totalViews =
    articleStats?.stats?.reduce(
      (sum, stat) => sum + (stat.totalViews || 0),
      0
    ) || 0;
  const avgReadTime = articleStats?.stats?.length
    ? articleStats.stats.reduce(
        (sum, stat) => sum + (stat.avgReadTime || 0),
        0
      ) / articleStats.stats.length
    : 0;
  const avgCompletionRate = articleStats?.stats?.length
    ? articleStats.stats.reduce(
        (sum, stat) => sum + (stat.avgCompletionRate || 0),
        0
      ) / articleStats.stats.length
    : 0;

  // Transform data for chart
  const viewsData = articleStats?.stats
    ? transformStatsToChartData(articleStats.stats, selectedTimeRange)
    : transformStatsToChartData([], selectedTimeRange);

  return (
    <div className="space-y-0">
      {/* Time range selector */}
      <div className="px-4 py-2 border-t bg-gradient-to-br from-muted/40 to-muted/20">
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-0.5 bg-muted/20 rounded-md p-0.5">
            {(["7d", "30d", "90d", "1y"] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={`px-2 py-1 text-[10px] font-medium transition-all ${
                  selectedTimeRange === range
                    ? "bg-background/50 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/30"
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Impressive stats row */}
      <div className="px-4 py-3 flex items-center justify-between border-t bg-gradient-to-br from-muted/40 to-muted/20">
        <div className="flex flex-col">
          {isLoading ? (
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          ) : (
            <span className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
              {totalViews.toLocaleString()}
            </span>
          )}
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">
            Total Views
          </span>
        </div>
        <div className="flex gap-6">
          <div className="flex flex-col items-end">
            {isLoading ? (
              <div className="h-6 w-12 bg-muted animate-pulse rounded" />
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">
                  {Math.round(avgReadTime)}
                </span>
                <span className="text-xs text-muted-foreground">min</span>
              </div>
            )}
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">
              Read Time
            </span>
          </div>
          <div className="flex flex-col items-end">
            {isLoading ? (
              <div className="h-6 w-12 bg-muted animate-pulse rounded" />
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">
                  {Math.round(avgCompletionRate)}
                </span>
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            )}
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

        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-32 w-full bg-muted animate-pulse rounded" />
          </div>
        ) : (
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
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                hide
                tickFormatter={(value) => {
                  const date = new Date(value);
                  if (selectedTimeRange === "1y") {
                    return date.toLocaleDateString("en-US", { month: "short" });
                  } else {
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    hideLabel={false}
                    labelFormatter={(value, payload) => {
                      if (payload && payload[0] && payload[0].payload) {
                        const date = payload[0].payload.date;
                        const dateObj = new Date(date);
                        if (selectedTimeRange === "1y") {
                          return dateObj.toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                          });
                        } else {
                          return dateObj.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          });
                        }
                      }
                      return value;
                    }}
                    className="bg-background/95 backdrop-blur-sm border border-border/50 shadow-lg"
                  />
                }
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
        )}
      </div>
    </div>
  );
}
