"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	User,
	CreditCard,
	Settings,
	LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function UserMenu() {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return <Skeleton className="h-8 w-8 rounded-lg" />;
	}

	if (!session) {
		return null;
	}

	const initials = session.user.name
		?.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2) || "U";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="h-8 w-8 rounded-lg p-0 hover:bg-accent/50 transition-colors"
				>
					<div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground text-xs font-semibold shadow-sm ring-1 ring-primary/20">
						{initials}
					</div>
					<span className="sr-only">Open user menu</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-64 bg-popover" sideOffset={8}>
				<DropdownMenuLabel className="font-normal">
					<div className="flex items-center gap-3 px-1 py-1.5">
						<div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground text-sm font-semibold shadow-sm ring-1 ring-primary/20">
							{initials}
						</div>
						<div className="flex flex-col gap-0.5 flex-1 min-w-0">
							<span className="text-sm font-semibold truncate">
								{session.user.name}
							</span>
							<span className="text-xs text-muted-foreground truncate">
								{session.user.email}
							</span>
						</div>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link href={"/dashboard/settings/profile" as never} className="cursor-pointer">
						<User className="size-4 mr-2" />
						<span>Profile Settings</span>
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link href={"/dashboard/settings/billing" as never} className="cursor-pointer">
						<CreditCard className="size-4 mr-2" />
						<span>Billing & Plans</span>
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link href={"/dashboard/settings" as never} className="cursor-pointer">
						<Settings className="size-4 mr-2" />
						<span>Settings</span>
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
					onClick={() => {
						authClient.signOut({
							fetchOptions: {
								onSuccess: () => {
									router.push("/");
								},
							},
						});
					}}
				>
					<LogOut className="size-4 mr-2" />
					<span>Sign Out</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export function DashboardHeader() {
	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container max-w-7xl mx-auto flex h-14 items-center justify-between px-4">
				{/* Logo */}
				<Link href="/dashboard" className="flex items-center gap-2.5">
					<div className="flex items-center justify-center size-8 bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground rounded-xl shadow-sm ring-1 ring-primary/20">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="size-4"
						>
							<title>Content-Next Logo</title>
							<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
							<polyline points="14 2 14 8 20 8" />
							<line x1="16" y1="13" x2="8" y2="13" />
							<line x1="16" y1="17" x2="8" y2="17" />
							<line x1="10" y1="9" x2="8" y2="9" />
						</svg>
					</div>
					<div className="flex flex-col">
						<span className="font-bold text-sm leading-none">Content-Next</span>
					</div>
				</Link>

				{/* Actions */}
				<div className="flex items-center gap-2">
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
		</header>
	);
}

