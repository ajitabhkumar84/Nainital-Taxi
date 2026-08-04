"use client";

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Heading2 } from "lucide-react";

interface SeoRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

// Loaded via next/dynamic({ ssr: false }) from MultiDayRentalForm so
// TipTap's JS is only fetched once this section of the form is reached,
// instead of gating the whole (already large) admin form behind it.
export default function SeoRichTextEditor({ value, onChange }: SeoRichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        // No @tailwindcss/typography plugin installed in this project, so
        // heading/list spacing is set explicitly here instead of via `prose`.
        class:
          "min-h-[160px] px-4 py-3 focus:outline-none font-body text-sm " +
          "[&_h2]:text-lg [&_h2]:font-display [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1 " +
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2",
      },
    },
  });

  if (!editor) return null;

  const buttonClass = (active: boolean) =>
    `p-2 rounded-lg border-2 ${active ? "bg-teal/20 border-teal text-teal" : "border-transparent text-ink/60 hover:bg-ink/5"}`;

  return (
    <div className="border-2 border-ink/20 rounded-lg overflow-hidden">
      <div className="flex items-center gap-1 border-b-2 border-ink/10 p-2 bg-ink/5">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={buttonClass(editor.isActive("bold"))}>
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={buttonClass(editor.isActive("italic"))}>
          <Italic className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={buttonClass(editor.isActive("heading", { level: 2 }))}>
          <Heading2 className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={buttonClass(editor.isActive("bulletList"))}>
          <List className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={buttonClass(editor.isActive("orderedList"))}>
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
