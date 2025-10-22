"use client";

import { Plus, Type, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { useWebsite } from "@/contexts/website-context";
import { toast } from "sonner";
import { useForm } from "@tanstack/react-form";
import { Field, FieldError } from "@/components/ui/field";
import z from "zod";

const addSiteSchema = z.object({
  name: z
    .string()
    .min(1, "Site name is required")
    .max(100, "Site name is too long"),
  domain: z
    .string()
    .min(1, "Domain is required")
    .max(255, "Domain is too long"),
});

interface AddSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSiteDialog({ open, onOpenChange }: AddSiteDialogProps) {
  const { setCurrentWebsite } = useWebsite();
  const queryClient = useQueryClient();

  const createMutation = useMutation(
    orpc.website.create.mutationOptions({
      onSuccess: (newWebsite) => {
        toast.success("Site created successfully!");
        setCurrentWebsite(newWebsite);
        queryClient.invalidateQueries({
          queryKey: orpc.website.list.key({ input: undefined, type: "query" }),
        });
        form.reset();
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(`Failed to create site: ${error.message}`);
      },
    })
  );

  const form = useForm({
    defaultValues: {
      name: "",
      domain: "",
    },
    validators: {
      onChange: addSiteSchema,
    },
    onSubmit: async ({ value }) => {
      createMutation.mutate({
        name: value.name.trim(),
        domain: value.domain.trim(),
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[340px] p-5">
        {/* Title */}
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <Plus className="size-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Add site</h2>
            <p className="text-[10px] text-muted-foreground">
              Create a new site to publish articles
            </p>
          </div>
        </div>

        {/* Form */}
        <form className="space-y-3 pt-1">
          {/* Name Field */}
          <form.Field
            name="name"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <div className="space-y-1.5">
                    <label
                      htmlFor={field.name}
                      className={cn(
                        "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1",
                        isInvalid && "text-destructive"
                      )}
                    >
                      <Type className="size-3" />
                      Name
                    </label>
                    <input
                      id={field.name}
                      name={field.name}
                      type="text"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="My Blog"
                      autoComplete="off"
                      className={cn(
                        "w-full px-3 py-2 text-sm leading-relaxed rounded-md",
                        "bg-muted/30 hover:bg-muted/50 focus:bg-muted/40",
                        "border-none outline-none focus:ring-0",
                        "text-foreground placeholder:text-muted-foreground/40",
                        "transition-all duration-200",
                        isInvalid &&
                          "bg-destructive/10 border text-destructive placeholder:text-destructive/40 focus:bg-destructive/10 hover:bg-destructive/10"
                      )}
                      autoFocus
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </div>
                </Field>
              );
            }}
          />

          {/* Domain Field */}
          <form.Field
            name="domain"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <div className="space-y-1.5">
                    <label
                      htmlFor={field.name}
                      className={cn(
                        "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1",
                        isInvalid && "text-destructive"
                      )}
                    >
                      <Globe className="size-3" />
                      Domain
                    </label>
                    <input
                      id={field.name}
                      name={field.name}
                      type="text"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="myblog.com"
                      autoComplete="off"
                      className={cn(
                        "w-full px-3 py-2 text-sm leading-relaxed rounded-md",
                        "bg-muted/30 hover:bg-muted/50 focus:bg-muted/40",
                        "border-none outline-none focus:ring-0",
                        "text-foreground placeholder:text-muted-foreground/40",
                        "transition-all duration-200",
                        isInvalid &&
                          "bg-destructive/10 border text-destructive placeholder:text-destructive/40 focus:bg-destructive/10 hover:bg-destructive/10"
                      )}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </div>
                </Field>
              );
            }}
          />
        </form>

        {/* Actions */}
        <form.Subscribe
          selector={(state) => [state.isValid]}
          children={([isValid]) => {
            const isDisabled = !isValid || createMutation.isPending;
            return (
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    form.reset();
                    onOpenChange(false);
                  }}
                  className="px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  disabled={createMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => form.handleSubmit()}
                  disabled={isDisabled}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    !isDisabled
                      ? "bg-foreground text-background hover:bg-foreground/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {createMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="size-3 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            );
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
