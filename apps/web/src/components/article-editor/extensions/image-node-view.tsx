"use client";

import React from "react";
import { NodeViewWrapper } from "@tiptap/react";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/dropzone";
import { Loader2, Trash2, Upload, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { client } from "@/utils/orpc";
import { toast } from "sonner";

export const ImageNodeView = ({
  node,
  updateAttributes,
  deleteNode,
  articleId,
  selected,
}: any) => {
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [altText, setAltText] = React.useState(node.attrs.alt || "");
  const [isEditingAlt, setIsEditingAlt] = React.useState(false);

  // Update local alt text when node attrs change
  React.useEffect(() => {
    setAltText(node.attrs.alt || "");
  }, [node.attrs.alt]);

  const handleDrop = async (files: File[]) => {
    if (!files[0] || !articleId) {
      toast.error("Article ID is required to upload images");
      return;
    }

    const file = files[0];
    setIsUploading(true);
    setUploadError(null);

    try {
      // Get presigned URL
      const { presignedUrl, image } =
        await client.article.generateImageUploadUrl({
          articleId,
          imageType: "content",
          contentType: file.type,
        });

      // Upload to S3
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      // Update node with final URL and image ID
      updateAttributes({
        src: image.url,
        alt: file.name,
        imageId: image.id,
      });

      toast.success("Image uploaded successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload image";
      setUploadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReplace = async (files: File[]) => {
    if (node.attrs.src && node.attrs.imageId) {
      // Delete old image from S3
      try {
        await client.article.deleteImage({
          imageId: node.attrs.imageId,
        });
      } catch (error) {
        console.error("Failed to delete old image:", error);
      }
    }
    updateAttributes({ src: undefined, alt: undefined, imageId: undefined });
    await handleDrop(files);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // If there's an image ID, delete from S3
    if (node.attrs.imageId && articleId) {
      try {
        await client.article.deleteImage({
          imageId: node.attrs.imageId,
        });
        toast.success("Image deleted successfully");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete image";
        toast.error(errorMessage);
      }
    }

    deleteNode();
  };

  const handleAltTextSave = () => {
    updateAttributes({ alt: altText });
    setIsEditingAlt(false);
    toast.success("Alt text updated");
  };

  const handleAltTextCancel = () => {
    setAltText(node.attrs.alt || "");
    setIsEditingAlt(false);
  };

  // If no article ID, show error message
  if (!articleId) {
    return (
      <NodeViewWrapper className="my-4" contentEditable={false}>
        <div className="flex items-center justify-center rounded-lg border border-dashed border-destructive bg-destructive/10 p-8">
          <p className="text-center text-sm text-destructive">
            Article ID is required to upload images
          </p>
        </div>
      </NodeViewWrapper>
    );
  }

  // Show image if already uploaded
  if (node.attrs.src) {
    return (
      <NodeViewWrapper className="my-6" contentEditable={false}>
        <div className="flex justify-center">
          <div className="relative group inline-block max-w-full">
            {/* Image container with border and padding */}
            <div
              className={cn(
                "relative rounded-lg border bg-accent p-2 transition-colors",
                selected && "border-primary"
              )}
            >
              <img
                src={node.attrs.src}
                alt={node.attrs.alt || ""}
                className={cn(
                  "max-h-[500px] w-auto rounded-md",
                  isUploading && "opacity-50"
                )}
              />

              {/* Loading overlay */}
              {isUploading && (
                <div className="absolute inset-2 flex items-center justify-center rounded-md bg-black/50">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}

              {/* Alt text badge - bottom right corner */}
              {!isUploading && node.attrs.alt && (
                <div className="absolute bottom-3 right-3">
                  <div className="flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-xs text-white backdrop-blur-sm">
                    <span className="max-w-[200px] truncate">
                      {node.attrs.alt}
                    </span>
                    <Popover open={isEditingAlt} onOpenChange={setIsEditingAlt}>
                      <PopoverTrigger asChild>
                        <button
                          className="ml-1 rounded p-0.5 hover:bg-white/20 transition-colors"
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="end">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">
                              Edit Alt Text
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Add descriptive text for accessibility and SEO
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="alt-text" className="text-xs">
                              Alt Text
                            </Label>
                            <Input
                              id="alt-text"
                              value={altText}
                              onChange={(e) => setAltText(e.target.value)}
                              placeholder="Describe the image..."
                              className="h-9"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAltTextSave();
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  handleAltTextCancel();
                                }
                              }}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleAltTextCancel}
                              type="button"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleAltTextSave}
                              type="button"
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {/* Action buttons - top right, minimal design */}
              {!isUploading && (
                <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {/* Edit alt text button - only show if no alt text exists */}
                  {!node.attrs.alt && (
                    <Popover open={isEditingAlt} onOpenChange={setIsEditingAlt}>
                      <PopoverTrigger asChild>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-6 w-6 rounded-full shadow-sm"
                          type="button"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="end">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">
                              Edit Alt Text
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Add descriptive text for accessibility and SEO
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="alt-text" className="text-xs">
                              Alt Text
                            </Label>
                            <Input
                              id="alt-text"
                              value={altText}
                              onChange={(e) => setAltText(e.target.value)}
                              placeholder="Describe the image..."
                              className="h-9"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAltTextSave();
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  handleAltTextCancel();
                                }
                              }}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleAltTextCancel}
                              type="button"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleAltTextSave}
                              type="button"
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}

                  {/* Replace image button */}
                  <Dropzone
                    accept={{
                      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
                    }}
                    maxSize={5 * 1024 * 1024}
                    onDrop={handleReplace}
                    onError={(error) => {
                      setUploadError(error.message);
                      toast.error(error.message);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-6 w-6 rounded-full shadow-sm"
                      type="button"
                    >
                      <Upload className="h-3 w-3" />
                    </Button>
                  </Dropzone>

                  {/* Delete button */}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-6 w-6 rounded-full shadow-sm"
                    onClick={handleDelete}
                    type="button"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        {uploadError && (
          <p className="mt-2 text-center text-sm text-destructive">
            {uploadError}
          </p>
        )}
      </NodeViewWrapper>
    );
  }

  // Show dropzone if no image
  return (
    <NodeViewWrapper className="my-4" contentEditable={false}>
      <Dropzone
        accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"] }}
        maxSize={5 * 1024 * 1024}
        onDrop={handleDrop}
        onError={(error) => {
          setUploadError(error.message);
          toast.error(error.message);
        }}
        className="h-32"
      >
        <DropzoneEmptyState>
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground mb-2">
              {isUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {isUploading ? "Uploading..." : "Upload an image"}
            </p>
            <p className="text-xs text-muted-foreground">
              Drag and drop or click to upload
            </p>
          </div>
        </DropzoneEmptyState>
        {uploadError && (
          <p className="mt-2 text-center text-sm text-destructive">
            {uploadError}
          </p>
        )}
      </Dropzone>
    </NodeViewWrapper>
  );
};
