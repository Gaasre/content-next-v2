import { SiteControlPanel } from "@/components/site-control-panel";
import UserMenu from "@/components/user-menu";
import { WebsiteProvider } from "@/contexts/website-context";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WebsiteProvider>
      <div className="min-h-screen w-full">
        {/* Fixed Site Control Panel in Top Left */}
        <SiteControlPanel />

        {/* Fixed User Avatar in Top Right */}
        <div className="fixed top-6 right-6 z-50">
          <UserMenu />
        </div>

        {/* Main Content - Fullscreen */}
        <main className="w-full">{children}</main>
      </div>
    </WebsiteProvider>
  );
}
