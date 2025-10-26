"use client";

import { Image as ImageIcon } from "lucide-react";
import React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToolbar } from "./toolbar-provider";

const ImageToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, onClick, children, ...props }, ref) => {
    const { editor } = useToolbar();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Insert an empty image node (no src attribute)
      editor
        ?.chain()
        .focus()
        .insertContent({
          type: "customImage",
          attrs: {
            src: null,
            alt: "",
          },
        })
        .run();
      onClick?.(e);
    };

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 p-0 sm:h-9 sm:w-9", className)}
            onClick={handleClick}
            ref={ref}
            {...props}
          >
            {children ?? <ImageIcon className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span>Insert image</span>
        </TooltipContent>
      </Tooltip>
    );
  }
);

ImageToolbar.displayName = "ImageToolbar";

export { ImageToolbar };
