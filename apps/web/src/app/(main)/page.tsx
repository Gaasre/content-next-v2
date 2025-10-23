import { HeroSection } from "@/components/landing/hero-section";
import { WaitlistForm } from "@/components/landing/waitlist-form";
import { FeaturesGrid } from "@/components/landing/features-grid";
import { FooterBadge } from "@/components/landing/footer-badge";

export default function Home() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center py-20 px-4">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1400px]">
        {/* 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column: Hero + Waitlist Form */}
          <div className="flex flex-col space-y-8">
            <HeroSection />
            <WaitlistForm />
            <FooterBadge />
          </div>

          {/* Right Column: Features */}
          <div className="flex items-center justify-center">
            <FeaturesGrid />
          </div>
        </div>
      </div>
    </div>
  );
}
