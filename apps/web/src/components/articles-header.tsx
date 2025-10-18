"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";

interface ArticlesHeaderProps {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	onCreateArticle: () => void;
	onSortChange: (sort: string) => void;
	currentSort: string;
}

export function ArticlesHeader({
	searchQuery,
	onSearchChange,
	onCreateArticle,
	onSortChange,
	currentSort,
}: ArticlesHeaderProps) {
	const sortOptions = [
		{ value: "recent", label: "Most Recent" },
		{ value: "oldest", label: "Oldest First" },
		{ value: "views", label: "Most Views" },
		{ value: "title", label: "Title (A-Z)" },
	];

	const currentSortLabel =
		sortOptions.find((opt) => opt.value === currentSort)?.label ||
		"Most Recent";

	return (
		<div className="space-y-4">
			<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Articles</h1>
					<p className="text-muted-foreground mt-1">
						Manage and publish your content
					</p>
				</div>
				<Button type="button" onClick={onCreateArticle}>
					<Plus className="size-4 mr-2" />
					New Article
				</Button>
			</div>

			<div className="flex flex-col sm:flex-row gap-3">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search articles..."
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						className="pl-9"
					/>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button type="button" variant="outline" className="gap-2">
							<ArrowUpDown className="size-4" />
							<span className="hidden sm:inline">{currentSortLabel}</span>
							<span className="sm:hidden">Sort</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{sortOptions.map((option) => (
							<DropdownMenuItem
								key={option.value}
								onClick={() => onSortChange(option.value)}
								className="cursor-pointer"
							>
								{option.label}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}

