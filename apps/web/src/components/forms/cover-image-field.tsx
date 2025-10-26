"use client";

import { useState } from "react";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/dropzone";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface CoverImageFieldProps {
  value: File | null;
  onChange: (file: File | null) => void;
  existingImageUrl?: string;
  shouldRemoveExisting: boolean;
  onRemoveExistingChange: (shouldRemove: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export function CoverImageField({
  value,
  onChange,
  existingImageUrl,
  shouldRemoveExisting,
  onRemoveExistingChange,
  className,
  disabled = false,
}: CoverImageFieldProps) {
  const [filePreview, setFilePreview] = useState<string | undefined>();

  const handleDrop = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      onChange(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === "string") {
          setFilePreview(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (value) {
      // Clear new file selection
      onChange(null);
      setFilePreview(undefined);
    } else if (existingImageUrl) {
      // Mark existing image for deletion
      onRemoveExistingChange(true);
    }
  };

  // Show image if: there's a new file preview, OR there's an existing image that's not marked for deletion
  const displayImage =
    filePreview ||
    (existingImageUrl && !shouldRemoveExisting ? existingImageUrl : undefined);
  const hasImage = value || (existingImageUrl && !shouldRemoveExisting);

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        Cover Image
      </label>
      <Dropzone
        accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp"] }}
        maxSize={5 * 1024 * 1024}
        onDrop={handleDrop}
        onError={(error) => console.error("Upload error:", error)}
        src={hasImage ? (value ? [value] : []) : undefined}
        disabled={disabled}
        className={cn(
          "h-32 p-2 transition-all duration-200",
          hasImage && "h-[400px]"
        )}
      >
        <DropzoneEmptyState>
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground mb-2">
              <svg
                className="size-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              Upload cover image
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, JPEG up to 5MB
            </p>
          </div>
        </DropzoneEmptyState>

        <DropzoneContent>
          {displayImage && (
            <div className="relative h-full w-full group">
              <img
                alt="Cover preview"
                className="absolute inset-0 h-full w-full object-cover rounded-md"
                src={displayImage}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-md" />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
              >
                <X className="size-3" />
              </button>
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-xs text-white bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                  {value ? value.name : "Current cover image"}
                </p>
              </div>
            </div>
          )}
        </DropzoneContent>
      </Dropzone>
    </div>
  );
}
