"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	LayoutDashboard,
	FileText,
	BarChart3,
	FolderKanban,
	Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
	{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
	{ name: "Articles", href: "/dashboard/articles", icon: FileText },
	{ name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
	{ name: "Projects", href: "/dashboard/projects", icon: FolderKanban },
];

export function DashboardNav() {
	const pathname = usePathname();

	return (
		<div className="flex items-center justify-between gap-4 mb-8">
			<nav className="flex items-center gap-3">
				{navigation.map((item) => {
					const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
					return (
						<Link
							key={item.href}
							href={item.href as never}
							className={cn(
								"inline-flex items-center gap-2 px-3.5 h-8 rounded-full text-sm font-medium transition-all",
								isActive
									? "bg-primary text-primary-foreground border border-primary shadow-md scale-105"
									: "bg-accent/50 hover:bg-accent hover:scale-105 hover:shadow-sm"
							)}
						>
							<item.icon className="size-3.5" strokeWidth={2} />
							<span>{item.name}</span>
						</Link>
					);
				})}
			</nav>
			
			<Button
				asChild
				size="sm"
				className="h-8 gap-2 rounded-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-md hover:shadow-lg transition-all hover:scale-105"
			>
				<Link href={"/articles/new" as never}>
					<Plus className="size-3.5" strokeWidth={2.5} />
					<span>New Article</span>
				</Link>
			</Button>
		</div>
	);
}

