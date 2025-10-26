"use client";

import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ImageNodeView } from "./image-node-view";

export interface CustomImageOptions {
  articleId?: string;
}

export const CustomImage = Image.extend<CustomImageOptions>({
  name: "customImage",

  addOptions() {
    return {
      ...this.parent?.(),
      articleId: undefined,
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      imageId: {
        default: null,
      },
    };
  },

  addNodeView() {
    const articleId = this.options.articleId;

    return ReactNodeViewRenderer((props) => (
      <ImageNodeView {...props} articleId={articleId} />
    ));
  },

  renderHTML({ HTMLAttributes }) {
    const { src, imageId } = HTMLAttributes;

    // If no src, don't render anything (this makes the dropzone show)
    if (!src) {
      return ["div", { class: "custom-image-empty" }];
    }

    // Include imageId as data attribute for tracking
    const attrs = { ...HTMLAttributes };
    if (imageId) {
      attrs["data-image-id"] = imageId;
    }

    return ["img", attrs];
  },

  parseHTML() {
    return [
      {
        tag: "img[src]",
        getAttrs: (element) => {
          if (typeof element === "string") {
            return false;
          }

          const img = element as HTMLImageElement;
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt"),
          };
        },
      },
    ];
  },
});
