"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Loader2, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ArticleEditor } from "./article-editor";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc, client } from "@/utils/orpc";
import { useWebsite } from "@/contexts/website-context";
import { toast } from "sonner";
import { generateSlug, validateSlug } from "@/lib/slug";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import z from "zod";
import { useForm } from "@tanstack/react-form";

const newArticleSchema = z.object({
    title: z
        .string()
        .min(5, "Title must be at least 5 characters."),
    slug: z
        .string(),
    description: z
        .string()
        .min(5, "Description must be at least 5 characters."),
    content: z
        .string()
        .min(5, "The blog content must be at least 5 characters"),
    tags: z.array(
        z.string()
    ).min(1, "At least one tag is required")
        .refine((tags) => new Set(tags).size === tags.length, { message: "Tags must be unique" }),
    scheduledFor: z.iso.datetime().nullable(),
    status: z.enum(["active", "draft"])
})

export function NewArticleComposer() {
    const { currentWebsite } = useWebsite();
    const queryClient = useQueryClient();
    const [isExpanded, setIsExpanded] = useState(false);
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
    const [description, setDescription] = useState("");
    const [content, setContent] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [isDraft, setIsDraft] = useState(true);
    const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);

    const mutation = useMutation(orpc.article.create.mutationOptions())

    const form = useForm({
        defaultValues: {
            title: "",
            slug: "",
            description: "",
            content: "",
            tags: [] as string[],
            scheduledFor: null as string | null,
            status: "active"
        },
        validators: {
            onChange: newArticleSchema,
        },
        onSubmit: async ({ value }) => {
            if (!currentWebsite) {
                toast.error("Please select a website first");
                return;
            }

            mutation.mutate({
                websiteId: currentWebsite.id,
                slug: value.slug,
                title: value.title,
                description: value.description,
                content: value.content,
                tags: value.tags,
                status: value.scheduledFor ? "scheduled" : value.status === "active" ? "published" : "draft",
                scheduledFor: value.scheduledFor ? new Date(value.scheduledFor) : undefined,
            });

            queryClient.invalidateQueries({
                queryKey: orpc.article.list.key(),
            })

            console.log({
                queryKey: orpc.article.list.key(),
            })

            form.reset();

            toast.success("Article created successfully!");
            setIsExpanded(false);
        },
    })

    interface Article {
        id: string;
        websiteId: string;
        slug: string;
        title: string;
        description: string;
        content: string;
        tags: string[];
        status: string;
        scheduledFor: Date | null;
        publishedAt: Date | null;
        readTime: number;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }

    const createMutation = useMutation<Article, Error, {
        websiteId: string;
        slug: string;
        title: string;
        description: string;
        content: string;
        tags: string[];
        status: "draft" | "published" | "scheduled";
        scheduledFor?: Date;
    }>({
        mutationFn: async (input) => {
            return await client.article.create(input);
        },
        onSuccess: () => {
            toast.success("Article created successfully!");
            queryClient.invalidateQueries({ queryKey: ["article", "list"] });
            // Reset form
            setTitle("");
            setSlug("");
            setIsSlugManuallyEdited(false);
            setDescription("");
            setContent("");
            setTags([]);
            setIsDraft(true);
            setScheduledDate(undefined);
            setIsExpanded(false);
        },
        onError: (error) => {
            toast.error(`Failed to create article: ${error.message}`);
        },
    });

    const handleSubmit = () => {
        if (!currentWebsite) {
            toast.error("Please select a website first");
            return;
        }

        if (!title.trim()) {
            toast.error("Title is required");
            return;
        }

        if (!slug.trim() || !validateSlug(slug)) {
            toast.error("Invalid slug. Use only lowercase letters, numbers, and hyphens");
            return;
        }

        // Determine status
        let status: "draft" | "published" | "scheduled" = "draft";
        if (!isDraft) {
            status = scheduledDate ? "scheduled" : "published";
        }

        createMutation.mutate({
            websiteId: currentWebsite.id,
            slug: slug.trim(),
            title: title.trim(),
            description: description.trim(),
            content: content.trim(),
            tags,
            status,
            scheduledFor: scheduledDate,
        });
    };

    if (!isExpanded) {
        return (
            <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="w-full text-left group relative"
            >
                {/* Ghost article card */}
                <div className="relative rounded-lg border border-dashed border-border/40 bg-muted/5 hover:bg-muted/20 hover:border-primary/30 transition-all duration-300 overflow-hidden cursor-pointer">
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="relative p-3 space-y-2">
                        {/* Ghost title */}
                        <div className="flex items-center gap-2">
                            {/* Animated status dot */}
                            <div className="relative">
                                <div className="h-2 w-2 rounded-full bg-muted-foreground/20 group-hover:bg-primary/50 transition-all duration-300" />
                                {/* Pulse ring on hover */}
                                <div className="absolute inset-0 h-2 w-2 rounded-full bg-primary/30 opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500" />
                            </div>

                            <div className="flex-1 space-y-1.5">
                                {/* Title bar with shimmer effect */}
                                <div className="relative h-3 w-3/4 rounded bg-muted-foreground/10 group-hover:bg-muted-foreground/20 transition-colors overflow-hidden">
                                    {/* Shimmer effect */}
                                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
                                </div>
                            </div>

                            <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                <div className="h-4 w-12 rounded bg-muted-foreground/10 group-hover:bg-muted-foreground/15 transition-colors" />
                                <div className="h-4 w-12 rounded bg-muted-foreground/10 group-hover:bg-muted-foreground/15 transition-colors" />
                            </div>
                        </div>

                        {/* Ghost description with shimmer */}
                        <div className="pl-4 space-y-1">
                            <div className="relative h-2 w-full rounded bg-muted-foreground/8 group-hover:bg-muted-foreground/12 transition-colors overflow-hidden">
                                {/* Shimmer effect with delay */}
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 delay-100 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
                            </div>
                        </div>
                    </div>

                    {/* Subtle hint text - fades in center */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 delay-150">
                        <span className="text-xs text-muted-foreground/70 font-medium">
                            Click to write
                        </span>
                    </div>
                </div>
            </button>
        );
    }

    return (
        <div className="rounded-lg border bg-card shadow-lg animate-in fade-in-50 slide-in-from-top-2 duration-300">
            {/* Header */}
            <div className="absolute top-3 right-3 z-20">
                <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="p-1.5 rounded-md hover:bg-muted/80 transition-colors bg-background/80 backdrop-blur-sm shadow-sm"
                >
                    <X className="size-4 text-muted-foreground" />
                </button>
            </div>

            <form>
                <FieldGroup>
                    {/* Form - Title, Slug and Description */}
                    <div className="px-4 pb-2 pt-3 space-y-4 relative z-10">
                        {/* Title Field */}

                        <form.Field
                            name="title"
                            listeners={{
                                onChange: ({ value }) => {
                                    form.setFieldValue("slug", generateSlug(value));
                                }
                            }}
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched && !field.state.meta.isValid
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel className={
                                            cn("text-[10px] font-semibold text-muted-foreground uppercase tracking-wider", isInvalid && "text-destructive")
                                        } htmlFor={field.name}>Title</FieldLabel>
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
                                                "w-full px-3 py-2 -mx-3 text-2xl font-bold leading-tight tracking-tight rounded-md",
                                                "bg-transparent hover:bg-muted/30 focus:bg-muted/40",
                                                "border-none outline-none focus:ring-0",
                                                "text-foreground placeholder:text-muted-foreground/40",
                                                "transition-all duration-200",
                                                isInvalid && "bg-destructive/10 border text-destructive placeholder:text-destructive/40 focus:bg-destructive/10 hover:bg-destructive/10"
                                            )}
                                        />
                                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                    </Field>
                                )
                            }}
                        />

                        {/* Slug Field */}
                        <form.Field
                            name="slug"
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched && !field.state.meta.isValid
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel className={
                                            cn("text-[10px] font-semibold text-muted-foreground uppercase tracking-wider", isInvalid && "text-destructive")
                                        } htmlFor={field.name}>Slug</FieldLabel>
                                        <input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            aria-invalid={isInvalid}
                                            placeholder="article-slug"
                                            autoComplete="off"
                                            className={cn(
                                                "w-full px-3 py-2 -mx-3 text-sm leading-relaxed rounded-md",
                                                "bg-transparent hover:bg-muted/30 focus:bg-muted/40",
                                                "border-none outline-none focus:ring-0",
                                                "text-foreground placeholder:text-muted-foreground/40",
                                                "transition-all duration-200",
                                                isInvalid && "bg-destructive/10 border text-destructive placeholder:text-destructive/40 focus:bg-destructive/10 hover:bg-destructive/10"
                                            )}
                                        />
                                    </Field>
                                )
                            }}
                        />

                        {/* Description Field */}
                        <form.Field
                            name="description"
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched && !field.state.meta.isValid
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel className={
                                            cn("text-[10px] font-semibold text-muted-foreground uppercase tracking-wider", isInvalid && "text-destructive")
                                        } htmlFor={field.name}>Description</FieldLabel>
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
                                                "w-full px-3 py-2 -mx-3 text-sm leading-relaxed resize-none rounded-md",
                                                "bg-transparent hover:bg-muted/30 focus:bg-muted/40",
                                                "border-none outline-none focus:ring-0",
                                                "text-muted-foreground placeholder:text-muted-foreground/40",
                                                "transition-all duration-200",
                                                isInvalid && "bg-destructive/10 border text-destructive placeholder:text-destructive/40 focus:bg-destructive/10 hover:bg-destructive/10"
                                            )}
                                        />
                                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                    </Field>
                                )
                            }}
                        />

                        {/* Tags Field */}
                        <form.Field
                            name="tags"
                            mode="array"
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched && !field.state.meta.isValid
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <div className="flex items-center flex-wrap gap-1.5 min-h-[32px]">
                                            <FieldLabel className={
                                                cn("text-[10px] font-semibold text-muted-foreground uppercase tracking-wider", isInvalid && "text-destructive")
                                            } htmlFor={field.name}>Tags</FieldLabel>
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
                                                placeholder={tags.length === 0 ? "Add tags..." : ""}
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === ",") {
                                                        e.preventDefault();
                                                        field.pushValue(tagInput.trim());
                                                        setTagInput("");
                                                    }
                                                    if (e.key === "Backspace" && !tagInput && field.state.value.length > 0) {
                                                        field.removeValue(tags.length - 1);
                                                    }
                                                }}
                                                className="flex-1 min-w-[100px] px-2 py-1 text-xs bg-transparent border-none outline-none placeholder:text-muted-foreground/40"
                                            />
                                        </div>
                                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                    </Field>
                                )
                            }}
                        />

                    </div>


                    {/* Article Content Editor */}
                    <form.Field
                        name="content"
                        children={(field) => {
                            const isInvalid =
                                field.state.meta.isTouched && !field.state.meta.isValid
                            return (
                                <Field data-invalid={isInvalid} className="py-4">
                                    <ArticleEditor
                                        content=""
                                        onUpdate={(content) => {
                                            field.handleChange(content);
                                            console.log("field.state.value", field.state.value);
                                            console.log("content", content);
                                        }}
                                        editable={true}
                                    />
                                    {isInvalid && <FieldError className="px-4" errors={field.state.meta.errors} />}
                                </Field>
                            )
                        }}
                    />
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
                                        field.state.meta.isTouched && !field.state.meta.isValid
                                    const isDraft = field.state.value === "draft"
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <button
                                                type="button"
                                                onClick={() => field.handleChange(
                                                    field.state.value === "draft" ? "active" : "draft"
                                                )}
                                                className={cn(
                                                    "group relative px-2 py-0.5 rounded text-[10px] font-medium transition-all duration-200",
                                                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1",
                                                    "hover:scale-[1.02] active:scale-95",
                                                    !isDraft
                                                        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 focus-visible:ring-emerald-500/50"
                                                        : "bg-muted/80 text-muted-foreground focus-visible:ring-border",
                                                )}
                                            >
                                                <span className="flex items-center gap-1">
                                                    <span className={cn(
                                                        "size-1 rounded-full transition-all duration-200",
                                                        !isDraft
                                                            ? "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)]"
                                                            : "bg-muted-foreground/40",
                                                    )} />
                                                    <span>{isDraft ? "Draft" : "Live"}</span>
                                                </span>
                                            </button>
                                        </Field>
                                    )
                                }} />

                            {/* Schedule button with Popover Calendar */}
                            <form.Subscribe
                                selector={(state) => state.values.status}
                                children={(status) => status === "active" && (
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
                                                                    : "bg-muted/80 text-muted-foreground focus-visible:ring-border",
                                                            )}
                                                        >
                                                            <span className="flex items-center gap-1">
                                                                <CalendarIcon className="size-2.5" />
                                                                <span>
                                                                    {field.state.value
                                                                        ? `Scheduled for ${format(new Date(field.state.value), "MMM d, h:mm a")}`
                                                                        : "Schedule"}
                                                                </span>
                                                            </span>
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.state.value ? new Date(field.state.value) : undefined}
                                                            onSelect={(date) => field.handleChange(date?.toISOString() ?? null)}
                                                        />
                                                        <div className="p-3 border-t space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                                                    Time
                                                                </label>
                                                                <input
                                                                    type="time"
                                                                    value={field.state.value ? format(new Date(field.state.value), "HH:mm") : "12:00"}
                                                                    onChange={(e) => {
                                                                        const [hours, minutes] = e.target.value.split(":");
                                                                        const newDate = field.state.value ? new Date(field.state.value) : new Date();
                                                                        newDate.setHours(Number.parseInt(hours), Number.parseInt(minutes));
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
                                            )
                                        }} />
                                )}
                            />

                        </div>

                        {/* Right side: Publish button */}
                        <form.Subscribe
                            selector={(state) => [state.isValid]}
                            children={([isValid]) => {
                                return (
                                    <button
                                        type="button"
                                        onClick={() => form.handleSubmit()}
                                        disabled={!isValid || createMutation.isPending}
                                        className={cn(
                                            "flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all duration-200",
                                            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1",
                                            "hover:scale-[1.02] active:scale-95",
                                            !isValid || createMutation.isPending
                                                ? "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
                                                : "bg-primary/20 text-primary focus-visible:ring-primary/50",
                                        )}
                                    >
                                        {createMutation.isPending ? (
                                            <>
                                                <Loader2 className="size-2.5 animate-spin" />
                                                <span>Publishing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send className="size-2.5" />
                                                <span>Publish</span>
                                            </>
                                        )}
                                    </button>
                                )
                            }} />
                    </div>
                </FieldGroup>
            </form>
        </div>
    );
}

