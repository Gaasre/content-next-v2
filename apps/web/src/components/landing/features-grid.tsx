"use client";

import { Zap, BarChart3, Calendar, Palette } from "lucide-react";
import { FeatureCard } from "./feature-card";

const features = [
  {
    icon: Zap,
    title: "Integration in 60 seconds",
    description:
      "Install SDK, fetch content, ship. No complex setup or migrations required.",
  },
  {
    icon: BarChart3,
    title: "Engagement Analytics",
    description:
      "Track completion rates, read time, and real engagement—not just views.",
    featured: true,
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description:
      "Plan your content pipeline with timeline-style organization and auto-publishing.",
    featured: true,
  },
  {
    icon: Palette,
    title: "Headless Freedom",
    description:
      "Full control over your frontend design. We handle the content backend.",
  },
];

export function FeaturesGrid() {
  return (
    <div className="w-full">
      {/* Asymmetric bento grid - matching the reference layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Left - Regular size */}
        <div>
          <FeatureCard
            icon={features[0].icon}
            title={features[0].title}
            description={features[0].description}
            delay={0.2}
          />
        </div>

        {/* Top Right - Featured/Tall */}
        <div className="md:row-span-2">
          <FeatureCard
            icon={features[1].icon}
            title={features[1].title}
            description={features[1].description}
            delay={0.3}
            featured={true}
          />
        </div>

        {/* Bottom Left - Featured/Large */}
        <div className="md:row-span-2">
          <FeatureCard
            icon={features[2].icon}
            title={features[2].title}
            description={features[2].description}
            delay={0.4}
            featured={true}
          />
        </div>

        {/* Bottom Right - Regular size */}
        <div>
          <FeatureCard
            icon={features[3].icon}
            title={features[3].title}
            description={features[3].description}
            delay={0.5}
          />
        </div>
      </div>
    </div>
  );
}
