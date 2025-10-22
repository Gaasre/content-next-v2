"use client";

import { SiteSwitcher } from "./site-switcher";
import { GlobalStats } from "./timeline/global-stats";
import { Separator } from "./ui/separator";

export function SiteControlPanel() {
  return (
    <div className="fixed top-6 left-6 z-50 w-[280px]">
      {/* Unified Control Panel Card */}
      <div className="rounded-lg border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
        {/* Site Switcher Section */}
        <div className="p-2">
          <SiteSwitcher />
        </div>

        {/* Separator */}
        <Separator className="mx-2" />

        {/* Stats Section */}
        <div className="p-2">
          <GlobalStats />
        </div>
      </div>
    </div>
  );
}
