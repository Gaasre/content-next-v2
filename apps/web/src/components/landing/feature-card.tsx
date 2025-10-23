"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
  featured?: boolean;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  delay = 0,
  featured = false,
}: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group h-full"
    >
      {/* Subtle glow on hover */}
      <div
        className={cn(
          "absolute -inset-0.5 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 rounded-xl blur-sm",
          "opacity-0 group-hover:opacity-100 transition-all duration-500"
        )}
      />

      {/* Main card */}
      <motion.div
        className={cn(
          "relative h-full rounded-xl border bg-card backdrop-blur-sm",
          "transition-all duration-300",
          featured ? "p-8" : "p-6"
        )}
        animate={{
          scale: isHovered ? 1.02 : 1,
          y: isHovered ? -4 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
      >
        {/* Gradient overlay on hover */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent rounded-xl",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          )}
        />

        {/* Ring glow on hover */}
        <div
          className={cn(
            "absolute inset-0 rounded-xl ring-1 ring-primary/20",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          )}
        />

        {/* Content */}
        <div className="relative flex flex-col h-full">
          {/* Icon */}
          <div
            className={cn(
              "rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mb-4",
              "ring-1 ring-primary/20 transition-all duration-300",
              "group-hover:ring-primary/30 group-hover:bg-primary/15",
              featured ? "size-14" : "size-12"
            )}
          >
            <Icon
              className={cn("text-primary", featured ? "size-7" : "size-6")}
            />
          </div>

          {/* Text content */}
          <div className="flex-1">
            <h3
              className={cn(
                "font-bold tracking-tight mb-2",
                featured ? "text-xl" : "text-base"
              )}
            >
              {title}
            </h3>
            <p
              className={cn(
                "text-muted-foreground leading-relaxed",
                featured ? "text-base" : "text-sm"
              )}
            >
              {description}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
