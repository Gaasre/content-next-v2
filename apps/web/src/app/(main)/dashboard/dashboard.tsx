"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { FileText, BarChart3, Calendar, TrendingUp } from "lucide-react";

export default function Dashboard({
	customerState,
	session,
}: {
	customerState: ReturnType<typeof authClient.customer.state>;
	session: typeof authClient.$Infer.Session;
}) {
	const privateData = useQuery(orpc.privateData.queryOptions());

	const hasProSubscription = customerState?.activeSubscriptions?.length! > 0;

	return (
		<div className="flex flex-col gap-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					Welcome back, {session.user.name}!
				</h1>
				<p className="text-muted-foreground mt-2">
					Here's what's happening with your content today.
				</p>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">Total Articles</CardTitle>
						<FileText className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">0</div>
						<p className="text-xs text-muted-foreground">
							No articles yet
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">Total Views</CardTitle>
						<BarChart3 className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">0</div>
						<p className="text-xs text-muted-foreground">
							Start publishing to track views
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">Scheduled</CardTitle>
						<Calendar className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">0</div>
						<p className="text-xs text-muted-foreground">
							No scheduled articles
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium">Engagement</CardTitle>
						<TrendingUp className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">0%</div>
						<p className="text-xs text-muted-foreground">
							Average completion rate
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Subscription Card */}
			<Card>
				<CardHeader>
					<CardTitle>Subscription</CardTitle>
					<CardDescription>
						{hasProSubscription
							? "You're on a paid plan. Manage your subscription below."
							: "You're on the Free plan. Upgrade to unlock more features."}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium">Current Plan</p>
							<p className="text-2xl font-bold">
								{hasProSubscription ? "Starter" : "Free"}
							</p>
						</div>
						{hasProSubscription ? (
							<Button onClick={async () => await authClient.customer.portal()}>
								Manage Subscription
							</Button>
						) : (
							<Button
								onClick={async () =>
									await authClient.checkout({ slug: "Starter-Monthly" })
								}
							>
								Upgrade to Starter
							</Button>
						)}
					</div>
					{!hasProSubscription && (
						<div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
							<h4 className="font-medium text-sm mb-2">
								Upgrade to unlock:
							</h4>
							<ul className="text-sm space-y-1 text-muted-foreground">
								<li>• Unlimited articles</li>
								<li>• Full analytics suite</li>
								<li>• Multiple projects</li>
								<li>• Remove branding</li>
							</ul>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Quick Actions */}
			<Card>
				<CardHeader>
					<CardTitle>Quick Start</CardTitle>
					<CardDescription>
						Get started with Content-Next in a few simple steps.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-2">
					<Button variant="outline" className="w-full justify-start" disabled>
						<FileText className="size-4 mr-2" />
						Create your first article
					</Button>
					<Button variant="outline" className="w-full justify-start" disabled>
						<TrendingUp className="size-4 mr-2" />
						Set up a project
					</Button>
					<Button variant="outline" className="w-full justify-start" disabled>
						<BarChart3 className="size-4 mr-2" />
						Get your API key
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
