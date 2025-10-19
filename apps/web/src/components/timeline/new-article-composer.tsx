"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { NewArticleForm } from "../forms/new-article-form";

export function NewArticleComposer() {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="w-full text-left group relative"
      >
        {/* Ghost article card */}
        <div className="relative rounded-lg border border-dashed border-border/40 bg-muted/5 hover:bg-muted/20 hover:border-primary/30 transition-all duration-300 overflow-hidden cursor-pointer">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="relative p-3 space-y-2">
            {/* Ghost title */}
            <div className="flex items-center gap-2">
              {/* Animated status dot */}
              <div className="relative">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/20 group-hover:bg-primary/50 transition-all duration-300" />
                {/* Pulse ring on hover */}
                <div className="absolute inset-0 h-2 w-2 rounded-full bg-primary/30 opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500" />
              </div>

              <div className="flex-1 space-y-1.5">
                {/* Title bar with shimmer effect */}
                <div className="relative h-3 w-3/4 rounded bg-muted-foreground/10 group-hover:bg-muted-foreground/20 transition-colors overflow-hidden">
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
                </div>
              </div>

              <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                <div className="h-4 w-12 rounded bg-muted-foreground/10 group-hover:bg-muted-foreground/15 transition-colors" />
                <div className="h-4 w-12 rounded bg-muted-foreground/10 group-hover:bg-muted-foreground/15 transition-colors" />
              </div>
            </div>

            {/* Ghost description with shimmer */}
            <div className="pl-4 space-y-1">
              <div className="relative h-2 w-full rounded bg-muted-foreground/8 group-hover:bg-muted-foreground/12 transition-colors overflow-hidden">
                {/* Shimmer effect with delay */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 delay-100 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
              </div>
            </div>
          </div>

          {/* Subtle hint text - fades in center */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 delay-150">
            <span className="text-xs text-muted-foreground/70 font-medium">
              Click to write
            </span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-lg border bg-card shadow-lg animate-in fade-in-50 slide-in-from-top-2 duration-300">
      {/* Header */}
      <div className="absolute top-3 right-3 z-20">
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="p-1.5 rounded-md hover:bg-muted/80 transition-colors bg-background/80 backdrop-blur-sm shadow-sm"
        >
          <X className="size-4 text-muted-foreground" />
        </button>
      </div>

      <NewArticleForm onSuccess={() => setIsExpanded(false)} />
    </div>
  );
}
