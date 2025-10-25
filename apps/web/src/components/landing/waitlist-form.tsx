"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { toast } from "sonner";
import z from "zod";

const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export function WaitlistForm() {
  const [isSuccess, setIsSuccess] = useState(false);

  const mutation = useMutation(
    orpc.waitlist.join.mutationOptions({
      onSuccess: () => {
        form.reset();
        setIsSuccess(true);
        toast.success("Successfully joined the waitlist!");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to join waitlist");
      },
    })
  );

  const form = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onChange: waitlistSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate({
        email: value.email,
      });
    },
  });

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
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="space-y-3"
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <form.Field
                  name="email"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        className={cn(
                          "h-12 px-4 text-base bg-card border-border rounded-lg",
                          "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                          "transition-all duration-200",
                          isInvalid &&
                            "border-destructive focus:ring-destructive/20"
                        )}
                        disabled={mutation.isPending}
                      />
                    );
                  }}
                />
              </div>
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    disabled={!canSubmit || mutation.isPending}
                    className={cn(
                      "h-12 px-8 rounded-lg font-semibold",
                      "bg-linear-to-br from-primary via-primary to-primary/90",
                      "hover:shadow-lg hover:scale-[1.02]",
                      "transition-all duration-200",
                      "ring-1 ring-primary/20"
                    )}
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      "Join Waitlist"
                    )}
                  </Button>
                )}
              />
            </div>
            <form.Field
              name="email"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return isInvalid ? (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive"
                  >
                    {typeof field.state.meta.errors[0] === "string"
                      ? field.state.meta.errors[0]
                      : field.state.meta.errors[0]?.message || "Invalid email"}
                  </motion.p>
                ) : null;
              }}
            />
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
