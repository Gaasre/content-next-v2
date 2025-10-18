import UserMenu from "@/components/user-menu";
import { SiteSwitcher } from "@/components/site-switcher";
import { GlobalStats } from "@/components/timeline/global-stats";
import { mockTimelineArticles } from "@/lib/mock-timeline-data";

export default function MainLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className="min-h-screen w-full">
			{/* Fixed Site Switcher in Top Left */}
			<div className="fixed top-6 left-6 z-50">
				<SiteSwitcher />
			</div>

			{/* Fixed Stats Panel Below Site Switcher */}
			<GlobalStats articles={mockTimelineArticles} />

			{/* Fixed User Avatar in Top Right */}
			<div className="fixed top-6 right-6 z-50">
				<UserMenu />
			</div>

			{/* Main Content - Fullscreen */}
			<main className="w-full">{children}</main>
		</div>
	);
}

