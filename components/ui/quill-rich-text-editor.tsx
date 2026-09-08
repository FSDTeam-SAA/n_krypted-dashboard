"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import ReactQuill, { Quill } from "react-quill-new";

interface QuillRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  minHeight?: number;
}

interface ToolbarHandlerContext {
  quill: {
    history: {
      undo: () => void;
      redo: () => void;
    };
  };
}

const icons = Quill.import("ui/icons") as Record<string, string>;
icons.undo =
  '<svg viewBox="0 0 18 18"><polyline class="ql-stroke" points="6 10 3 7 6 4"/><path class="ql-stroke" d="M4,7h6a4,4 0 0 1 4,4v1"/></svg>';
icons.redo =
  '<svg viewBox="0 0 18 18"><polyline class="ql-stroke" points="12 10 15 7 12 4"/><path class="ql-stroke" d="M14,7H8a4,4 0 0 0-4,4v1"/></svg>';

const modules = {
  toolbar: {
    container: [
      [{ header: [false, 1, 2, 3, 4, 5, 6] }],
      ["bold", "italic", "underline"],
      [{ list: "bullet" }, { list: "ordered" }],
      ["blockquote", "link"],
      ["undo", "redo"],
      ["clean"],
    ],
    handlers: {
      undo(this: ToolbarHandlerContext) {
        this.quill.history.undo();
      },
      redo(this: ToolbarHandlerContext) {
        this.quill.history.redo();
      },
    },
  },
  history: {
    delay: 500,
    maxStack: 100,
    userOnly: true,
  },
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "list",
  "blockquote",
  "link",
];

const toolbarLabels: Record<string, string> = {
  ".ql-bold": "Fett",
  ".ql-italic": "Kursiv",
  ".ql-underline": "Unterstrichen",
  '.ql-list[value="bullet"]': "Aufzählung",
  '.ql-list[value="ordered"]': "Nummerierte Liste",
  ".ql-blockquote": "Zitat",
  ".ql-link": "Link einfügen",
  ".ql-undo": "Rückgängig",
  ".ql-redo": "Wiederholen",
  ".ql-clean": "Formatierung entfernen",
};

export function QuillRichTextEditor({
  value,
  onChange,
  disabled = false,
  minHeight = 260,
}: QuillRichTextEditorProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<ReactQuill | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    for (const [selector, label] of Object.entries(toolbarLabels)) {
      const control = wrapper.querySelector<HTMLElement>(selector);
      control?.setAttribute("title", label);
      control?.setAttribute("aria-label", label);
    }

    wrapper
      .querySelectorAll<HTMLButtonElement | HTMLSelectElement>(
        ".ql-toolbar button, .ql-toolbar select",
      )
      .forEach((control) => {
        control.disabled = disabled;
      });

    const headerPicker = wrapper.querySelector<HTMLElement>(
      ".ql-picker.ql-header .ql-picker-label",
    );
    headerPicker?.setAttribute("title", "Textformat");
    headerPicker?.setAttribute("aria-label", "Textformat");
    headerPicker?.setAttribute("aria-disabled", disabled.toString());
    if (headerPicker) headerPicker.tabIndex = disabled ? -1 : 0;

    editorRef.current
      ?.getEditor()
      .root.setAttribute("aria-label", "Rechtlichen Inhalt bearbeiten");
  }, [disabled]);

  const editorStyle = {
    "--editor-min-height": `${minHeight}px`,
  } as CSSProperties;

  return (
    <div
      ref={wrapperRef}
      className={`rich-text-editor ${disabled ? "is-disabled" : ""}`}
      style={editorStyle}
    >
      <ReactQuill
        ref={editorRef}
        theme="snow"
        value={value}
        onChange={(html, _delta, source) => {
          if (source === "user") {
            onChange(html === "<p><br></p>" ? "" : html);
          }
        }}
        modules={modules}
        formats={formats}
        readOnly={disabled}
        useSemanticHTML
      />
    </div>
  );
}
