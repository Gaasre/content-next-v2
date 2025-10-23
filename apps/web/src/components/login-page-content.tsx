"use client";

import AuthForm from "@/components/auth-form";
import { motion } from "framer-motion";
import { BorderBeam } from "@/components/ui/border-beam";

export default function LoginPageContent() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden px-4 py-12">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20 pointer-events-none" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Main content container */}
      <div className="relative w-full max-w-md">
        {/* Auth form with card styling */}
        <motion.div
          className="relative overflow-hidden rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Card background with subtle effects */}
          <div className="absolute inset-0 bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent rounded-2xl pointer-events-none" />

          {/* Border beam effect */}
          <BorderBeam
            duration={8}
            size={200}
            borderWidth={2}
            className="from-transparent via-primary to-transparent"
          />

          {/* Content */}
          <div className="relative z-10 p-8 lg:p-12">
            <AuthForm />
          </div>
        </motion.div>
      </div>

      {/* Bottom branding */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        <p className="text-xs text-muted-foreground tracking-wide">
          Content-Next · Minimalist Headless CMS
        </p>
      </motion.div>
    </div>
  );
}
