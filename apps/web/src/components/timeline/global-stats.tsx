"use client";

import { useState } from "react";
import {
  Eye,
  TrendingUp,
  Clock,
  Users,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrendSparkline } from "@/components/ui/trend-sparkline";
import { CircularProgress } from "@/components/ui/circular-progress";
import { useWebsite } from "@/contexts/website-context";
import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";

type Period = "7d" | "30d" | "90d" | "1y";

export function GlobalStats() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("30d");
  const [isMinimized, setIsMinimized] = useState(true);
  const { currentWebsite } = useWebsite();

  const periods: { value: Period; label: string }[] = [
    { value: "7d", label: "7D" },
    { value: "30d", label: "30D" },
    { value: "90d", label: "90D" },
    { value: "1y", label: "1Y" },
  ];

  // Fetch analytics data from API
  const {
    data: analyticsData,
    isLoading,
    error,
  } = useQuery(
    orpc.analytics.getWebsiteStats.queryOptions({
      input: {
        websiteId: currentWebsite?.id || "",
        timeRange: selectedPeriod,
      },
    })
  );

  // Use API data or fallback to zeros
  const totalViews = analyticsData?.totalViews || 0;
  const avgCompletion = analyticsData?.avgCompletionRate || 0;
  const avgReadTime = analyticsData?.avgReadTime || 0;
  const engagementScore = analyticsData?.healthScore || 0;
  const weeklyReaders = analyticsData?.uniqueVisitors || 0;

  // Use API trend data or fallback to zero arrays for sparklines
  const viewsTrend = analyticsData?.viewsTrend || [0, 0, 0, 0, 0, 0, 0];
  const completionTrend = analyticsData?.completionTrend || [
    0, 0, 0, 0, 0, 0, 0,
  ];
  const readersTrend = analyticsData?.visitorsTrend || [0, 0, 0, 0, 0, 0, 0];

  // Use API percentage changes or fallback to zeros
  const viewsChange = analyticsData?.viewsChange || 0;
  const completionChange = analyticsData?.completionChange || 0;
  const visitorsChange = analyticsData?.visitorsChange || 0;

  // Show error state
  if (error) {
    return (
      <div>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md">
          <div className="text-xs text-red-500">Error loading stats</div>
        </div>
      </div>
    );
  }

  // Minimized view - compact horizontal bar with all stats
  if (isMinimized) {
    return (
      <div>
        <motion.button
          type="button"
          onClick={() => setIsMinimized(false)}
          className={cn(
            "group flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-200",
            "hover:bg-muted/50 w-full"
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
            {isLoading ? (
              <div className="h-3 w-6 bg-muted animate-pulse rounded" />
            ) : (
              <span className="text-xs font-semibold tracking-tight">
                {(totalViews / 1000).toFixed(0)}k
              </span>
            )}
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
            {isLoading ? (
              <div className="h-3 w-8 bg-muted animate-pulse rounded" />
            ) : (
              <span className="text-xs font-semibold tracking-tight">
                {avgCompletion}%
              </span>
            )}
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
            {isLoading ? (
              <div className="h-3 w-6 bg-muted animate-pulse rounded" />
            ) : (
              <span className="text-xs font-semibold tracking-tight">
                {avgReadTime}m
              </span>
            )}
          </motion.div>

          <div className="w-px h-3 bg-border/50" />

          {/* Health */}
          <motion.div
            className="flex items-center gap-1"
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.25 }}
          >
            <Zap
              className={cn(
                "size-3",
                !isLoading && engagementScore >= 70
                  ? "text-emerald-600 dark:text-emerald-400"
                  : !isLoading && engagementScore >= 50
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-muted-foreground"
              )}
            />
            {isLoading ? (
              <div className="h-3 w-6 bg-muted animate-pulse rounded" />
            ) : (
              <span
                className={cn(
                  "text-xs font-semibold tracking-tight",
                  engagementScore >= 70
                    ? "text-emerald-600 dark:text-emerald-400"
                    : engagementScore >= 50
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-foreground"
                )}
              >
                {engagementScore}
              </span>
            )}
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
            {isLoading ? (
              <div className="h-3 w-8 bg-muted animate-pulse rounded" />
            ) : (
              <span className="text-xs font-semibold tracking-tight">
                {(weeklyReaders / 1000).toFixed(1)}k
              </span>
            )}
          </motion.div>

          <ChevronDown className="size-5 text-muted-foreground group-hover:text-foreground transition-colors ml-auto" />
        </motion.button>
      </div>
    );
  }

  return (
    <div>
      <motion.div
        className="flex flex-col rounded-lg w-full overflow-hidden"
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
                {isLoading ? (
                  <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                ) : (
                  <span className="text-base font-bold tracking-tight">
                    {totalViews.toLocaleString()}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  views
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {isLoading ? (
                  <div className="h-4 w-10 bg-muted animate-pulse rounded" />
                ) : (
                  <TrendSparkline data={viewsTrend} color="currentColor" />
                )}
                {isLoading ? (
                  <div className="h-3 w-6 bg-muted animate-pulse rounded" />
                ) : (
                  <span
                    className={`text-[9px] font-medium ${
                      viewsChange > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : viewsChange < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {viewsChange > 0 ? "+" : ""}
                    {viewsChange}%
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="border-t" />

          {/* Completion stat */}
          <div className="relative flex items-start gap-2.5 pr-8">
            <TrendingUp className="size-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                {isLoading ? (
                  <div className="h-5 w-12 bg-muted animate-pulse rounded" />
                ) : (
                  <span className="text-base font-bold tracking-tight">
                    {avgCompletion}%
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  completion
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {isLoading ? (
                  <div className="h-4 w-10 bg-muted animate-pulse rounded" />
                ) : (
                  <TrendSparkline data={completionTrend} color="currentColor" />
                )}
                {isLoading ? (
                  <div className="h-3 w-6 bg-muted animate-pulse rounded" />
                ) : (
                  <span
                    className={`text-[9px] font-medium ${
                      completionChange > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : completionChange < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {completionChange > 0 ? "+" : ""}
                    {completionChange}%
                  </span>
                )}
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="absolute top-0.5 right-0">
                  <Info className="size-3.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[200px]">
                <p>
                  Average percentage of readers who finish reading your articles
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="border-t" />

          {/* Read time stat */}
          <div className="relative flex items-start gap-2.5 pr-8">
            <Clock className="size-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                {isLoading ? (
                  <div className="h-5 w-8 bg-muted animate-pulse rounded" />
                ) : (
                  <span className="text-base font-bold tracking-tight">
                    {avgReadTime}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  min avg
                </span>
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
                color={
                  engagementScore >= 70
                    ? "rgb(34 197 94)"
                    : engagementScore >= 50
                    ? "rgb(234 179 8)"
                    : "currentColor"
                }
              />
              <Zap
                className={cn(
                  "size-3 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
                  engagementScore >= 70
                    ? "text-emerald-600 dark:text-emerald-400"
                    : engagementScore >= 50
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-muted-foreground"
                )}
              />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                {isLoading ? (
                  <div className="h-5 w-8 bg-muted animate-pulse rounded" />
                ) : (
                  <span
                    className={cn(
                      "text-base font-bold tracking-tight",
                      engagementScore >= 70
                        ? "text-emerald-600 dark:text-emerald-400"
                        : engagementScore >= 50
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-foreground"
                    )}
                  >
                    {engagementScore}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  health
                </span>
              </div>
              {isLoading ? (
                <div className="h-3 w-12 bg-muted animate-pulse rounded mt-1" />
              ) : (
                <span className="text-[9px] text-muted-foreground">
                  {engagementScore >= 70
                    ? "Excellent"
                    : engagementScore >= 50
                    ? "Good"
                    : "Fair"}
                </span>
              )}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="absolute top-0.5 right-0">
                  <Info className="size-3.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[200px]">
                <p>
                  Combined score (0-100) measuring views and completion rates
                  across all articles
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="border-t" />

          {/* Weekly readers */}
          <div className="relative flex items-start gap-2.5 pr-8">
            <Users className="size-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                {isLoading ? (
                  <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                ) : (
                  <span className="text-base font-bold tracking-tight">
                    {weeklyReaders.toLocaleString()}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  readers
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {isLoading ? (
                  <div className="h-4 w-10 bg-muted animate-pulse rounded" />
                ) : (
                  <TrendSparkline data={readersTrend} color="currentColor" />
                )}
                {isLoading ? (
                  <div className="h-3 w-6 bg-muted animate-pulse rounded" />
                ) : (
                  <span
                    className={`text-[9px] font-medium ${
                      visitorsChange > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : visitorsChange < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {visitorsChange > 0 ? "+" : ""}
                    {visitorsChange}%
                  </span>
                )}
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
