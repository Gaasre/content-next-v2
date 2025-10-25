"use client";

import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <div className="flex flex-col items-start text-left space-y-6">
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-br from-foreground via-foreground to-foreground/80 bg-clip-text">
          Ship content in under a minute
        </h1>
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-[500px]">
          Headless CMS built for developers. Write, schedule, and publish
          articles to any Next.js app. Built-in analytics that track engagement,
          not just views.
        </p>
      </motion.div>

      {/* Subtle accent line */}
      <motion.div
        className="w-1/2 h-[2px] bg-linear-to-r from-transparent via-primary to-transparent"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      />
    </div>
  );
}
