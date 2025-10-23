"use client";

import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";
import Loader from "./loader";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Field, FieldError, FieldGroup, FieldLabel } from "./ui/field";
import { redirect } from "next/navigation";

type AuthMode = "signin" | "signup";

export default function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
    onSubmit: async ({ value }) => {
      if (mode === "signin") {
        await authClient.signIn.email(
          {
            email: value.email,
            password: value.password,
          },
          {
            onSuccess: () => {
              window.location.href = "/dashboard";
            },
            onError: (error) => {
              toast.error(error.error.message || error.error.statusText);
            },
          }
        );
      } else {
        await authClient.signUp.email(
          {
            email: value.email,
            password: value.password,
            name: value.name,
          },
          {
            onSuccess: () => {
              window.location.href = "/dashboard";
            },
            onError: (error) => {
              toast.error(error.error.message || error.error.statusText);
            },
          }
        );
      }
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="w-full max-w-md relative">
      {/* Tab Switcher */}
      <div className="relative mb-8">
        <div className="flex gap-1 p-0.5 bg-muted/20 rounded-lg backdrop-blur-sm border border-border/40 relative">
          {/* Sliding background indicator */}
          <motion.div
            className="absolute top-0.5 bottom-0.5 w-[calc(50%-0.125rem)] bg-gradient-to-br from-primary via-primary to-primary/90 rounded-md shadow-md shadow-primary/10"
            initial={false}
            animate={{
              x: mode === "signin" ? 0 : "calc(100% + 0.25rem)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />

          <button
            type="button"
            onClick={() => setMode("signin")}
            className={cn(
              "flex-1 px-4 py-1.5 rounded-md text-xs font-medium tracking-wide transition-colors duration-200 relative z-10",
              mode === "signin"
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={cn(
              "flex-1 px-4 py-1.5 rounded-md text-xs font-medium tracking-wide transition-colors duration-200 relative z-10",
              mode === "signup"
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Sign Up
          </button>
        </div>

        {/* Decorative line indicator */}
        <div className="absolute -bottom-3 left-0 right-0 flex justify-center">
          <motion.div
            className="h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent"
            initial={{ width: 0 }}
            animate={{ width: "60%" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Form Content */}
      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "signin"
              ? "Enter your credentials to access your dashboard"
              : "Start managing your content with Content-Next"}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            {/* Name field - only for signup */}
            {mode === "signup" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <form.Field
                  name="name"
                  validators={{
                    onChange: z
                      .string()
                      .min(2, "Name must be at least 2 characters"),
                  }}
                >
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel
                          htmlFor={field.name}
                          className={cn(
                            "text-sm font-medium",
                            isInvalid && "text-destructive"
                          )}
                        >
                          Full name
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          placeholder="John Doe"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          className={cn(
                            "h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20",
                            isInvalid &&
                              "border-destructive focus-visible:ring-destructive"
                          )}
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                </form.Field>
              </motion.div>
            )}

            {/* Email field */}
            <form.Field
              name="email"
              validators={{
                onChange: z.string().email("Invalid email address"),
              }}
            >
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel
                      htmlFor={field.name}
                      className={cn(
                        "text-sm font-medium",
                        isInvalid && "text-destructive"
                      )}
                    >
                      Email address
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      placeholder="you@example.com"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      className={cn(
                        "h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20",
                        isInvalid &&
                          "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>

            {/* Password field */}
            <form.Field
              name="password"
              validators={{
                onChange: z
                  .string()
                  .min(8, "Password must be at least 8 characters"),
              }}
            >
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel
                      htmlFor={field.name}
                      className={cn(
                        "text-sm font-medium",
                        isInvalid && "text-destructive"
                      )}
                    >
                      Password
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      placeholder="••••••••"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      className={cn(
                        "h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20",
                        isInvalid &&
                          "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>

            {/* Submit button */}
            <form.Subscribe>
              {(state) => (
                <Button
                  type="submit"
                  className={cn(
                    "w-full h-11 font-medium tracking-tight transition-all duration-300",
                    "hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20",
                    "active:scale-[0.98]"
                  )}
                  disabled={!state.canSubmit || state.isSubmitting}
                >
                  {state.isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      {mode === "signin"
                        ? "Signing in..."
                        : "Creating account..."}
                    </>
                  ) : mode === "signin" ? (
                    "Sign in"
                  ) : (
                    "Create account"
                  )}
                </Button>
              )}
            </form.Subscribe>
          </FieldGroup>
        </form>
      </motion.div>
    </div>
  );
}
