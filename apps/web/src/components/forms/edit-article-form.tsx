"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, Loader2, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ArticleEditor } from "@/components/article-editor/article-editor";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { orpc, queryClient } from "@/utils/orpc";
import { useWebsite } from "@/contexts/website-context";
import { toast } from "sonner";
import { generateSlug } from "@/lib/slug";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { CoverImageField } from "./cover-image-field";
import z from "zod";
import { useForm } from "@tanstack/react-form";

const editArticleSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  slug: z.string(),
  description: z.string().min(5, "Description must be at least 5 characters."),
  content: z.string().min(5, "The blog content must be at least 5 characters"),
  tags: z
    .array(z.string())
    .min(1, "At least one tag is required")
    .refine((tags) => new Set(tags).size === tags.length, {
      message: "Tags must be unique",
    }),
  scheduledFor: z.iso.datetime().nullable(),
  status: z.enum(["active", "draft"]),
  coverImageFile: z.instanceof(File).nullable(),
});

interface Article {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  tags: string[];
  status: "draft" | "published" | "scheduled";
  scheduledFor: Date | null;
  websiteId: string;
  publishedAt: Date | null;
  readTime: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  coverImage?: {
    id: string;
    url: string;
    key: string;
  } | null;
}

interface EditArticleFormProps {
  article: Article;
  onSuccess: () => void;
}

export function EditArticleForm({ article, onSuccess }: EditArticleFormProps) {
  const { currentWebsite } = useWebsite();
  const [tagInput, setTagInput] = useState("");
  const [shouldRemoveCoverImage, setShouldRemoveCoverImage] = useState(false);

  const updateMutation = useMutation(orpc.article.update.mutationOptions());

  const uploadMutation = useMutation(
    orpc.article.generateImageUploadUrl.mutationOptions()
  );

  const deleteImageMutation = useMutation(
    orpc.article.deleteImage.mutationOptions()
  );

  const isPending =
    updateMutation.isPending ||
    uploadMutation.isPending ||
    deleteImageMutation.isPending;

  // Determine initial status and scheduledFor based on article status
  const getInitialStatus = () => {
    if (article.status === "scheduled") {
      return "active"; // Show as "active" when scheduled
    }
    return article.status === "published" ? "active" : "draft";
  };

  const getInitialScheduledFor = () => {
    if (article.status === "scheduled" && article.scheduledFor) {
      return article.scheduledFor.toISOString();
    }
    return null;
  };

  const form = useForm({
    defaultValues: {
      title: article.title,
      slug: article.slug,
      description: article.description,
      content: article.content,
      tags: article.tags,
      scheduledFor: getInitialScheduledFor(),
      status: getInitialStatus(),
      coverImageFile: null as File | null,
    },
    validators: {
      onChange: editArticleSchema,
    },
    onSubmit: async ({ value }) => {
      if (!currentWebsite) {
        toast.error("Please select a website first");
        return;
      }

      try {
        // Delete existing cover image if marked for removal
        if (shouldRemoveCoverImage && article.coverImage?.id) {
          await deleteImageMutation.mutateAsync({
            imageId: article.coverImage.id,
          });
        }

        // Update article
        await updateMutation.mutateAsync({
          id: article.id,
          slug: value.slug,
          title: value.title,
          description: value.description,
          content: value.content,
          tags: value.tags,
          status: value.scheduledFor
            ? ("scheduled" as const)
            : value.status === "active"
            ? ("published" as const)
            : ("draft" as const),
          scheduledFor: value.scheduledFor
            ? new Date(value.scheduledFor)
            : undefined,
        });

        // Upload new cover image if provided
        if (value.coverImageFile) {
          const { presignedUrl } = await uploadMutation.mutateAsync({
            articleId: article.id,
            imageType: "cover",
            contentType: value.coverImageFile.type,
          });

          const uploadResponse = await fetch(presignedUrl, {
            method: "PUT",
            body: value.coverImageFile,
            headers: {
              "Content-Type": value.coverImageFile.type,
            },
          });

          if (!uploadResponse.ok) {
            throw new Error("Failed to upload cover image");
          }
        }

        // Invalidate queries and show success
        queryClient.invalidateQueries({
          queryKey: orpc.article.list.key({
            input: { websiteId: currentWebsite.id },
            type: "infinite",
          }),
        });

        toast.success("Article updated successfully!");
        onSuccess();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update article"
        );
      }
    },
  });

  // Determine if schedule button should be shown
  const shouldShowSchedule = () => {
    const currentStatus = form.getFieldValue("status");
    return currentStatus === "active" && article.status !== "published";
  };

  return (
    <form>
      <FieldGroup>
        {/* Form - Cover Image, Title, Slug and Description */}
        <div className="px-4 pb-2 pt-3 space-y-4 relative z-10">
          {/* Cover Image Field */}
          <form.Field
            name="coverImageFile"
            children={(field) => (
              <CoverImageField
                value={field.state.value}
                onChange={field.handleChange}
                existingImageUrl={article.coverImage?.url}
                shouldRemoveExisting={shouldRemoveCoverImage}
                onRemoveExistingChange={setShouldRemoveCoverImage}
                disabled={isPending}
              />
            )}
          />

          {/* Title Field */}
          <div>
            <form.Field
              name="title"
              listeners={{
                onChange: ({ value }) => {
                  form.setFieldValue("slug", generateSlug(value));
                },
              }}
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel
                      className={cn(
                        "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider",
                        isInvalid && "text-destructive"
                      )}
                      htmlFor={field.name}
                    >
                      Title
                    </FieldLabel>
                    <input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Article title.."
                      autoComplete="off"
                      className={cn(
                        "w-full px-3 py-2 text-2xl font-bold leading-tight tracking-tight rounded-t-md",
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
                  </Field>
                );
              }}
            />

            {/* Slug Field */}
            <form.Field
              name="slug"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <div
                      className={cn(
                        "w-full px-3 py-2 text-sm leading-relaxed rounded-b-md flex items-baseline gap-1",
                        "bg-muted/30 hover:bg-muted/50 focus:bg-muted/40",
                        "border-none outline-none focus:ring-0",
                        "text-foreground placeholder:text-muted-foreground/40",
                        "transition-all duration-200",
                        isInvalid &&
                          "bg-destructive/10 border text-destructive placeholder:text-destructive/40 focus:bg-destructive/10 hover:bg-destructive/10"
                      )}
                    >
                      <span className="text-muted-foreground/30 text-sm">
                        https://{currentWebsite?.domain}/blog/
                      </span>
                      <input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="article-slug"
                        autoComplete="off"
                        className="focus-visible:outline-none flex-1"
                      />
                    </div>
                  </Field>
                );
              }}
            />
          </div>

          {/* Description Field */}
          <form.Field
            name="description"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel
                    className={cn(
                      "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider",
                      isInvalid && "text-destructive"
                    )}
                    htmlFor={field.name}
                  >
                    Description
                  </FieldLabel>
                  <textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Brief description..."
                    autoComplete="off"
                    rows={2}
                    className={cn(
                      "w-full px-3 py-2 text-sm leading-relaxed resize-none rounded-md",
                      "bg-muted/30 hover:bg-muted/50 focus:bg-muted/40",
                      "border-none outline-none focus:ring-0",
                      "text-foreground placeholder:text-muted-foreground/40",
                      "transition-all duration-200",
                      isInvalid &&
                        "bg-destructive/10 border text-destructive placeholder:text-destructive/40 focus:bg-destructive/10 hover:bg-destructive/10"
                    )}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          {/* Tags Field */}
          <form.Field
            name="tags"
            mode="array"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel
                    className={cn(
                      "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider",
                      isInvalid && "text-destructive"
                    )}
                    htmlFor={field.name}
                  >
                    Tags
                  </FieldLabel>
                  <div
                    className={cn(
                      "py-1 px-2 rounded-md bg-muted/30 hover:bg-muted/50 flex items-center gap-1 flex-1 transition-colors",
                      isInvalid &&
                        "bg-destructive/10 text-destructive hover:bg-destructive/10"
                    )}
                  >
                    {field.state.value.map((tag, index) => (
                      <Badge
                        key={`tag-${index}`}
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 h-5 gap-1 group hover:bg-destructive/10 transition-colors"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => field.removeValue(index)}
                          className="hover:text-destructive transition-colors"
                        >
                          <X className="size-2.5" />
                        </button>
                      </Badge>
                    ))}
                    <input
                      type="text"
                      placeholder={
                        field.state.value.length === 0 ? "Add tags..." : ""
                      }
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          field.pushValue(tagInput.trim());
                          setTagInput("");
                        }
                        if (
                          e.key === "Backspace" &&
                          !tagInput &&
                          field.state.value.length > 0
                        ) {
                          field.removeValue(field.state.value.length - 1);
                        }
                      }}
                      className="flex-1 min-w-[100px] px-2 py-1 text-xs bg-transparent border-none outline-none placeholder:text-muted-foreground/40"
                    />
                  </div>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          {/* Article Content Editor */}
          <form.Field
            name="content"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <ArticleEditor
                    content={field.state.value}
                    onUpdate={field.handleChange}
                    editable={true}
                    isInvalid={isInvalid}
                    articleId={article.id}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
        </div>
      </FieldGroup>

      <FieldGroup>
        {/* Control Bar */}
        <div className="flex items-center justify-between px-4 py-1 bg-muted/40 border-t border-border/50">
          {/* Left side: Draft/Live toggle */}
          <div className="flex items-center gap-3">
            <form.Field
              name="status"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                const isDraft = field.state.value === "draft";
                return (
                  <Field data-invalid={isInvalid}>
                    <button
                      type="button"
                      onClick={() =>
                        field.handleChange(
                          field.state.value === "draft" ? "active" : "draft"
                        )
                      }
                      className={cn(
                        "group relative px-2 py-0.5 rounded text-[10px] font-medium transition-all duration-200",
                        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1",
                        "hover:scale-[1.02] active:scale-95",
                        !isDraft
                          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 focus-visible:ring-emerald-500/50"
                          : "bg-muted/80 text-muted-foreground focus-visible:ring-border"
                      )}
                    >
                      <span className="flex items-center gap-1">
                        <span
                          className={cn(
                            "size-1 rounded-full transition-all duration-200",
                            !isDraft
                              ? "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)]"
                              : "bg-muted-foreground/40"
                          )}
                        />
                        <span>{isDraft ? "Draft" : "Live"}</span>
                      </span>
                    </button>
                  </Field>
                );
              }}
            />

            {/* Schedule button with Popover Calendar - only show when appropriate */}
            <form.Subscribe
              selector={(state) => state.values.status}
              children={(status) =>
                status === "active" &&
                shouldShowSchedule() && (
                  <form.Field
                    name="scheduledFor"
                    children={(field) => {
                      return (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className={cn(
                                "group w-auto relative px-2 py-0.5 rounded text-[10px] font-medium transition-all duration-200",
                                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1",
                                "hover:scale-[1.02] active:scale-95",
                                "whitespace-nowrap",
                                field.state.value
                                  ? "bg-primary/20 text-primary focus-visible:ring-primary/50"
                                  : "bg-muted/80 text-muted-foreground focus-visible:ring-border"
                              )}
                            >
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="size-2.5" />
                                <span>
                                  {field.state.value
                                    ? `Scheduled for ${format(
                                        new Date(field.state.value),
                                        "MMM d, h:mm a"
                                      )}`
                                    : "Schedule"}
                                </span>
                              </span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={
                                field.state.value
                                  ? new Date(field.state.value)
                                  : undefined
                              }
                              onSelect={(date) =>
                                field.handleChange(date?.toISOString() ?? null)
                              }
                            />
                            <div className="p-3 border-t space-y-2">
                              <div className="flex items-center gap-2">
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                  Time
                                </label>
                                <input
                                  type="time"
                                  value={
                                    field.state.value
                                      ? format(
                                          new Date(field.state.value),
                                          "HH:mm"
                                        )
                                      : "12:00"
                                  }
                                  onChange={(e) => {
                                    const [hours, minutes] =
                                      e.target.value.split(":");
                                    const newDate = field.state.value
                                      ? new Date(field.state.value)
                                      : new Date();
                                    newDate.setHours(
                                      Number.parseInt(hours),
                                      Number.parseInt(minutes)
                                    );
                                    field.handleChange(newDate.toISOString());
                                  }}
                                  className="flex-1 px-2 py-1 text-xs bg-muted/30 border border-border rounded-md outline-none focus:border-primary/50 transition-colors"
                                />
                              </div>
                              {field.state.value && (
                                <button
                                  type="button"
                                  onClick={() => field.handleChange(null)}
                                  className="w-full px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  Clear date
                                </button>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      );
                    }}
                  />
                )
              }
            />
          </div>

          {/* Right side: Update button */}
          <form.Subscribe
            selector={(state) => [state.isValid]}
            children={([isValid]) => {
              const isDisabled = !isValid || isPending;
              return (
                <button
                  type="button"
                  onClick={() => form.handleSubmit()}
                  disabled={isDisabled}
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1",
                    "hover:scale-[1.02] active:scale-95",
                    isDisabled
                      ? "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
                      : "bg-primary/20 text-primary focus-visible:ring-primary/50"
                  )}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="size-2.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Send className="size-2.5" />
                      <span>Update</span>
                    </>
                  )}
                </button>
              );
            }}
          />
        </div>
      </FieldGroup>
    </form>
  );
}
