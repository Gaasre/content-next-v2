import UserMenu from "@/components/user-menu";
import { SiteControlPanel } from "@/components/site-control-panel";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
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
  );
}
