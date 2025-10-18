import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ArticleCardSkeleton() {
	return (
		<Card className="w-full overflow-hidden p-0">
			{/* Cover Image Skeleton */}
			<div className="aspect-[21/9] w-full bg-muted overflow-hidden relative">
				<Skeleton className="w-full h-full rounded-none" />
				
				{/* Status Badge Skeleton */}
				<div className="absolute top-2 left-2">
					<Skeleton className="h-6 w-20 rounded-md" />
				</div>
				
				{/* Dropdown Button Skeleton */}
				<div className="absolute top-2 right-2">
					<Skeleton className="size-7 rounded-md" />
				</div>
			</div>

			<CardContent className="pt-4 pb-4">
				{/* Title & Description Skeleton */}
				<div className="mb-3">
					<Skeleton className="h-5 w-3/4 mb-1.5" />
					<Skeleton className="h-3 w-full mb-1" />
					<Skeleton className="h-3 w-5/6" />
				</div>

				{/* Metadata Row Skeleton */}
				<div className="flex items-center gap-2 mb-2.5">
					<Skeleton className="h-3 w-12" />
					<Skeleton className="h-3 w-3" />
					<Skeleton className="h-3 w-16" />
				</div>

				{/* Tags Skeleton */}
				<div className="flex flex-wrap gap-1">
					<Skeleton className="h-4 w-16 rounded-sm" />
					<Skeleton className="h-4 w-20 rounded-sm" />
					<Skeleton className="h-4 w-14 rounded-sm" />
				</div>
			</CardContent>
		</Card>
	);
}

