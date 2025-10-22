"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AddSiteDialog } from "./add-site-dialog";
import { SiteSettingsDialog } from "./site-settings-dialog";
import { useWebsite } from "@/contexts/website-context";

export function SiteSwitcher() {
  const { currentWebsite, setCurrentWebsite, websites, isLoading } =
    useWebsite();
  const [isOpen, setIsOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Skeleton className="size-6 rounded" />
        <div className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-2 w-16" />
        </div>
      </div>
    );
  }

  if (!currentWebsite || websites.length === 0) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowAddDialog(true)}
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-200",
            "hover:bg-muted/50"
          )}
        >
          <Plus className="size-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Add site</span>
        </button>
        <AddSiteDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "group flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-200 flex-1 justify-between",
                "hover:bg-muted/50",
                isOpen && "bg-muted/50"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* Site Avatar */}
                <div className="size-6 rounded bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0">
                  {currentWebsite.name.charAt(0)}
                </div>

                {/* Site Info */}
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-xs font-semibold tracking-tight truncate max-w-[100px]">
                    {currentWebsite.name}
                  </span>
                  <span className="text-[9px] text-muted-foreground truncate max-w-[100px]">
                    {currentWebsite.domain}
                  </span>
                </div>
              </div>

              {/* Chevron */}
              <ChevronsUpDown className="size-3 text-muted-foreground shrink-0" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-[220px]">
            <DropdownMenuLabel className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
              Your Sites
            </DropdownMenuLabel>
            {websites.map((site) => (
              <DropdownMenuItem
                key={site.id}
                onClick={() => setCurrentWebsite(site)}
                className="flex items-center gap-2 cursor-pointer py-2"
              >
                {/* Site Avatar */}
                <div className="size-6 rounded bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-[10px] shrink-0">
                  {site.name.charAt(0)}
                </div>

                {/* Site Info */}
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="text-xs font-medium truncate w-full">
                    {site.name}
                  </span>
                  <span className="text-[9px] text-muted-foreground truncate w-full">
                    {site.domain}
                  </span>
                </div>

                {/* Check Icon */}
                {currentWebsite.id === site.id && (
                  <Check className="size-3.5 text-primary shrink-0" />
                )}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => {
                setIsOpen(false);
                setShowAddDialog(true);
              }}
              className="cursor-pointer text-muted-foreground hover:text-foreground py-2"
            >
              <Plus className="size-3.5 mr-2" />
              <span className="text-xs">Add new site</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setShowSettingsDialog(true)}
          className="hover:bg-muted/50"
          title="Site settings"
        >
          <Settings className="size-4" />
        </Button>
      </div>

      <AddSiteDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      <SiteSettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
      />
    </>
  );
}
