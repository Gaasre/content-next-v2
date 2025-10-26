"use client";

import "./tiptap.css";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/lib/utils";
import { EditorToolbar } from "./toolbars/editor-toolbar";

import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import { CustomImage } from "./extensions/image";

interface ArticleEditorProps {
  content: string;
  onUpdate?: (content: string) => void;
  editable?: boolean;
  className?: string;
  isInvalid?: boolean;
  articleId?: string;
}

export function ArticleEditor({
  content,
  onUpdate,
  isInvalid = false,
  editable = true,
  className,
  articleId,
}: ArticleEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal",
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: "list-disc",
          },
        },
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Placeholder.configure({
        emptyNodeClass: "is-editor-empty",
        placeholder: ({ node }) => {
          switch (node.type.name) {
            case "heading":
              return `Heading ${node.attrs.level}`;
            case "detailsSummary":
              return "Section title";
            case "codeBlock":
              // never show the placeholder when editing code
              return "";
            default:
              return "Start writing your article ...";
          }
        },
        includeChildren: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      Subscript,
      Superscript,
      Underline,
      Link,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Typography,
      CustomImage.configure({
        articleId,
      }),
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: cn("editor-content", className),
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onUpdate?.(html);
    },
  });

  return (
    <div className={className}>
      {editor && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} aria-invalid={isInvalid} />
    </div>
  );
}
