import UserMenu from "@/components/user-menu";
import { SiteControlPanel } from "@/components/site-control-panel";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen w-full">
      <main className="w-full">{children}</main>
    </div>
  );
}
