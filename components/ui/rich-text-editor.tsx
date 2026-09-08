"use client";

import dynamic from "next/dynamic";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  minHeight?: number;
}

const QuillRichTextEditor = dynamic(
  () =>
    import("./quill-rich-text-editor").then(
      (module) => module.QuillRichTextEditor,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-65 animate-pulse rounded-2xl border border-[#B2EBF2] bg-[#F8FCFC]" />
    ),
  },
);

export function RichTextEditor(props: RichTextEditorProps) {
  return <QuillRichTextEditor {...props} />;
}
