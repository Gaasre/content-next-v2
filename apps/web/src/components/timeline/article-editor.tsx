"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { Markdown } from "tiptap-markdown";
import { cn } from "@/lib/utils";

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
        heading: {
          levels: [1, 2, 3],
        },
        code: {
          HTMLAttributes: {
            class: "bg-muted px-1.5 py-0.5 rounded text-sm font-mono",
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class: "bg-muted p-4 rounded-lg text-sm font-mono my-4",
          },
        },
      }),
      Markdown,
      Placeholder.configure({
        placeholder: "Start writing your article...",
      }),
      Typography,
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none",
          "focus:outline-none",
          "min-h-[400px]",
          "[&_p]:leading-relaxed [&_p]:text-sm [&_p]:text-foreground",
          "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:tracking-tight",
          "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:tracking-tight",
          "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4",
          "[&_ul]:my-3 [&_ul]:space-y-1 [&_ul]:text-sm",
          "[&_ol]:my-3 [&_ol]:space-y-1 [&_ol]:text-sm",
          "[&_li]:text-foreground [&_li]:leading-relaxed",
          "[&_strong]:font-semibold [&_strong]:text-foreground",
          "[&_em]:italic",
          "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition-colors hover:[&_a]:text-primary/80",
          "[&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-4",
          "[&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_code]:text-foreground",
          "[&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-4",
          "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
          className
        ),
      },
    },
    onUpdate: ({ editor }) => {
      // Get markdown content from the editor
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const markdown =
        (editor.storage as any).markdown?.getMarkdown?.() || editor.getText();
      onUpdate?.(markdown);
    },
  });

  return (
    <div>
      <EditorContent editor={editor} aria-invalid={isInvalid} />
    </div>
  );
}
