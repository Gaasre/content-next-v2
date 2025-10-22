"use client";

import { useState, useEffect } from "react";
import { Copy, Eye, EyeOff, RefreshCw, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { orpc, queryClient } from "@/utils/orpc";
import { useWebsite } from "@/contexts/website-context";
import { useForm } from "@tanstack/react-form";
import { Field, FieldError } from "@/components/ui/field";
import z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const updateSiteSchema = z.object({
  name: z
    .string()
    .min(1, "Site name is required")
    .max(100, "Site name is too long"),
  domain: z
    .string()
    .min(1, "Domain is required")
    .max(255, "Domain is too long"),
});

const deleteSiteSchema = z.object({
  confirmText: z.string(),
});

interface SiteSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SiteSettingsDialog({
  open,
  onOpenChange,
}: SiteSettingsDialogProps) {
  const { currentWebsite, setCurrentWebsite, websites } = useWebsite();
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Update mutation
  const updateMutation = useMutation(
    orpc.website.update.mutationOptions({
      onSuccess: (updated) => {
        setCurrentWebsite(updated);
        queryClient.invalidateQueries({
          queryKey: orpc.website.list.key(),
        });
        toast.success("Site updated successfully");
        onOpenChange(false);
      },
      onError: () => {
        toast.error("Failed to update site");
      },
    })
  );

  // Regenerate API key mutation
  const regenerateApiKeyMutation = useMutation(
    orpc.website.regenerateApiKey.mutationOptions({
      onSuccess: (updated) => {
        setCurrentWebsite(updated);
        queryClient.invalidateQueries({
          queryKey: orpc.website.list.key(),
        });
        toast.success("API key regenerated successfully");
      },
      onError: () => {
        toast.error("Failed to regenerate API key");
      },
    })
  );

  // Delete mutation
  const deleteMutation = useMutation(
    orpc.website.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.website.list.key({ input: undefined, type: "query" }),
        });
        toast.success("Site deleted successfully");
        // Select the first available website or null
        const remainingWebsites = websites.filter(
          (w) => w.id !== currentWebsite?.id
        );
        if (remainingWebsites.length > 0) {
          setCurrentWebsite(remainingWebsites[0]);
        } else {
          setCurrentWebsite(null);
        }
        onOpenChange(false);
        setShowDeleteConfirm(false);
        deleteForm.reset();
      },
      onError: () => {
        toast.error("Failed to delete site");
      },
    })
  );

  // Update site form
  const updateForm = useForm({
    defaultValues: {
      name: currentWebsite?.name || "",
      domain: currentWebsite?.domain || "",
    },
    validators: {
      onChange: updateSiteSchema,
    },
    onSubmit: async ({ value }) => {
      if (!currentWebsite) return;
      updateMutation.mutate({
        id: currentWebsite.id,
        name: value.name.trim(),
        domain: value.domain.trim(),
      });
    },
  });

  // Delete site form
  const deleteForm = useForm({
    defaultValues: {
      confirmText: "",
    },
    validators: {
      onChange: deleteSiteSchema,
    },
    onSubmit: async ({ value }) => {
      if (!currentWebsite) return;
      if (value.confirmText !== currentWebsite.name) {
        toast.error("Site name doesn't match");
        return;
      }
      deleteMutation.mutate({ id: currentWebsite.id });
    },
  });

  // Update form values when switching sites
  useEffect(() => {
    if (currentWebsite) {
      updateForm.setFieldValue("name", currentWebsite.name);
      updateForm.setFieldValue("domain", currentWebsite.domain);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWebsite?.id]);

  if (!currentWebsite) return null;

  const handleCopyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(currentWebsite.apiKey);
      toast.success("API key copied to clipboard");
    } catch {
      toast.error("Failed to copy API key");
    }
  };

  const handleRegenerateApiKey = () => {
    if (
      confirm(
        "Are you sure you want to regenerate the API key? The old key will stop working immediately."
      )
    ) {
      regenerateApiKeyMutation.mutate({ id: currentWebsite.id });
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return `${key.substring(0, 4)}${"*".repeat(key.length - 8)}${key.substring(
      key.length - 4
    )}`;
  };

  // Reset state when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      deleteForm.reset();
      setShowDeleteConfirm(false);
      setIsApiKeyVisible(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            Site Settings
          </DialogTitle>
          <DialogDescription>
            Manage your site configuration, API key, and danger zone options.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="api">API Key</TabsTrigger>
            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4 pt-4">
            <form className="space-y-4">
              <updateForm.Field
                name="name"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <div className="space-y-2">
                        <Label
                          htmlFor={field.name}
                          className={cn(isInvalid && "text-destructive")}
                        >
                          Site Name
                        </Label>
                        <input
                          id={field.name}
                          name={field.name}
                          type="text"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="My Awesome Blog"
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

              <updateForm.Field
                name="domain"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <div className="space-y-2">
                        <Label
                          htmlFor={field.name}
                          className={cn(isInvalid && "text-destructive")}
                        >
                          Domain
                        </Label>
                        <input
                          id={field.name}
                          name={field.name}
                          type="text"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="blog.example.com"
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

              <updateForm.Subscribe
                selector={(state) => [state.isValid]}
                children={([isValid]) => {
                  const isDisabled = !isValid || updateMutation.isPending;
                  return (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={() => updateForm.handleSubmit()}
                        disabled={isDisabled}
                      >
                        {updateMutation.isPending
                          ? "Saving..."
                          : "Save Changes"}
                      </Button>
                    </div>
                  );
                }}
              />
            </form>
          </TabsContent>

          {/* API Key Tab */}
          <TabsContent value="api" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={
                      isApiKeyVisible
                        ? currentWebsite.apiKey
                        : maskApiKey(currentWebsite.apiKey)
                    }
                    readOnly
                    className={cn(
                      "w-full px-3 py-2 text-xs leading-relaxed rounded-md font-mono",
                      "bg-muted/30 hover:bg-muted/50",
                      "border-none outline-none focus:ring-0",
                      "text-foreground placeholder:text-muted-foreground/40",
                      "transition-all duration-200 cursor-default"
                    )}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
                  title={isApiKeyVisible ? "Hide API key" : "Show API key"}
                >
                  {isApiKeyVisible ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyApiKey}
                  title="Copy API key"
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use this API key to authenticate requests to your site.
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Regenerate API Key</Label>
              <p className="text-xs text-muted-foreground">
                Generate a new API key. The old key will stop working
                immediately.
              </p>
              <Button
                variant="destructive"
                onClick={handleRegenerateApiKey}
                disabled={regenerateApiKeyMutation.isPending}
                className="w-full"
              >
                <RefreshCw className="size-4" />
                {regenerateApiKeyMutation.isPending
                  ? "Regenerating..."
                  : "Regenerate API Key"}
              </Button>
            </div>
          </TabsContent>

          {/* Danger Zone Tab */}
          <TabsContent value="danger" className="space-y-4 pt-4">
            <div className="rounded-lg border border-destructive/50 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Trash2 className="size-5 text-destructive mt-0.5" />
                <div className="flex-1 space-y-1">
                  <h4 className="text-sm font-semibold text-destructive">
                    Delete Site
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Once you delete a site, there is no going back. All articles
                    and analytics data will be permanently deleted.
                  </p>
                </div>
              </div>

              {!showDeleteConfirm ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full"
                >
                  <Trash2 className="size-4" />
                  Delete This Site
                </Button>
              ) : (
                <form className="space-y-3">
                  <Separator />
                  <deleteForm.Field
                    name="confirmText"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <div className="space-y-2">
                            <Label htmlFor={field.name}>
                              Type{" "}
                              <span className="font-mono font-bold">
                                {currentWebsite.name}
                              </span>{" "}
                              to confirm
                            </Label>
                            <input
                              id={field.name}
                              name={field.name}
                              type="text"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              aria-invalid={isInvalid}
                              placeholder={currentWebsite.name}
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
                          </div>
                        </Field>
                      );
                    }}
                  />
                  <deleteForm.Subscribe
                    selector={(state) => [state.values.confirmText]}
                    children={([confirmText]) => {
                      const isDisabled =
                        deleteMutation.isPending ||
                        confirmText !== currentWebsite.name;
                      return (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowDeleteConfirm(false);
                              deleteForm.reset();
                            }}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => deleteForm.handleSubmit()}
                            disabled={isDisabled}
                            className="flex-1"
                          >
                            {deleteMutation.isPending
                              ? "Deleting..."
                              : "Delete Forever"}
                          </Button>
                        </div>
                      );
                    }}
                  />
                </form>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
