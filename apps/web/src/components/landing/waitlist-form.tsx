"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setIsSuccess(true);
    setEmail("");
  };

  return (
    <motion.div
      className="w-full max-w-[500px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            className="space-y-3"
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "h-12 px-4 text-base bg-card border-border rounded-lg",
                    "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                    "transition-all duration-200",
                    error && "border-destructive focus:ring-destructive/20"
                  )}
                  disabled={isSubmitting}
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "h-12 px-8 rounded-lg font-semibold",
                  "bg-gradient-to-br from-primary via-primary to-primary/90",
                  "hover:shadow-lg hover:scale-[1.02]",
                  "transition-all duration-200",
                  "ring-1 ring-primary/20"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Waitlist"
                )}
              </Button>
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive"
              >
                {error}
              </motion.p>
            )}
          </motion.form>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col items-center justify-center p-8 rounded-lg border bg-card"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="size-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 ring-1 ring-emerald-500/20"
            >
              <Check className="size-8 text-emerald-600 dark:text-emerald-400" />
            </motion.div>
            <h3 className="text-xl font-bold tracking-tight mb-2">
              You're on the list!
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              We'll notify you when we launch. Get ready to ship content fast.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
