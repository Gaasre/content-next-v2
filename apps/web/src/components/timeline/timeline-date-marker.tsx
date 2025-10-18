"use client";

import { format } from "date-fns";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineDateMarkerProps {
	date: Date;
	isScheduled?: boolean;
}

export function TimelineDateMarker({
	date,
	isScheduled = false,
}: TimelineDateMarkerProps) {
	return (
		<div className="flex items-center relative z-10 group">
			{/* Date Label - refined typography */}
			<div className="w-[120px] text-right">
				<div className="inline-flex flex-col items-end gap-0.5">
					<span
						className={cn(
							"text-[11px] font-semibold tracking-tight transition-colors",
							isScheduled
								? "text-muted-foreground/70"
								: "text-foreground group-hover:text-primary",
						)}
					>
						{format(date, "MMM d")}
					</span>
					<span
						className={cn(
							"text-[10px] tracking-wide transition-colors",
							isScheduled ? "text-muted-foreground/50" : "text-muted-foreground",
						)}
					>
						{format(date, "yyyy")}
					</span>
					
					{/* Time for scheduled articles */}
					{isScheduled && (
						<div className="flex items-center gap-1 mt-0.5">
							<Clock className="size-2.5 text-muted-foreground/60" />
							<span className="text-[9px] text-muted-foreground/60 tracking-wide">
								{format(date, "h:mm a")}
							</span>
						</div>
					)}
				</div>
			</div>

			{/* Circle Marker - elevated design */}
			<div className="w-[20px] flex items-center justify-center">
				<div className="relative">
					{/* Outer glow ring for published */}
					{!isScheduled && (
						<div className="absolute inset-0 size-2.5 rounded-full bg-primary/30 blur-[2px] animate-pulse" />
					)}
					
					{/* Main circle */}
					<div
						className={cn(
							"relative size-2.5 rounded-full transition-all duration-300",
							isScheduled
								? "bg-background border-[1.5px] border-muted-foreground/40 group-hover:border-muted-foreground/60 group-hover:scale-110"
								: "bg-primary ring-2 ring-primary/20 group-hover:ring-4 group-hover:ring-primary/30 group-hover:scale-125",
						)}
					/>
				</div>
			</div>
		</div>
	);
}

