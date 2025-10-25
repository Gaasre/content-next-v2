"use client";

import "./tiptap.css";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
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

interface ArticleEditorProps {
  content: string;
  onUpdate?: (content: string) => void;
  editable?: boolean;
  className?: string;
  isInvalid?: boolean;
}

export function ArticleEditor({
  content,
  onUpdate,
  isInvalid = false,
  editable = true,
  className,
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
      Markdown,
    ],
    content,
    contentType: "markdown",
    editable,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none",
          "focus:outline-none",
          "min-h-[400px]",
          className
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const markdown = editor.getMarkdown();
      onUpdate?.(markdown);
    },
  });

  return (
    <div className={className}>
      {editor && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} aria-invalid={isInvalid} />
    </div>
  );
}
