"use client";

import { useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Underline,
  Undo2,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  minHeight?: number;
}

const actions = [
  { command: "bold", label: "Fett", icon: Bold },
  { command: "italic", label: "Kursiv", icon: Italic },
  { command: "underline", label: "Unterstrichen", icon: Underline },
  { command: "insertUnorderedList", label: "Liste", icon: List },
  { command: "insertOrderedList", label: "Nummerierte Liste", icon: ListOrdered },
  { command: "undo", label: "Rückgängig", icon: Undo2 },
  { command: "redo", label: "Wiederholen", icon: Redo2 },
] as const;

export function RichTextEditor({
  value,
  onChange,
  disabled = false,
  minHeight = 260,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const run = (command: string, argument?: string) => {
    if (disabled) return;
    editorRef.current?.focus();
    document.execCommand(command, false, argument);
    onChange(editorRef.current?.innerHTML ?? "");
  };

  const addLink = () => {
    const url = window.prompt("Link-URL eingeben (https://...)");
    if (url?.trim()) run("createLink", url.trim());
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#B2EBF2] bg-white focus-within:border-[#0097A7] focus-within:ring-2 focus-within:ring-[#0097A7]/15">
      <div className="flex flex-wrap items-center gap-1 border-b border-[#E6F4F5] bg-[#F8FCFC] px-2 py-2">
        <select
          aria-label="Textformat"
          disabled={disabled}
          defaultValue="p"
          onChange={(event) => run("formatBlock", event.target.value)}
          className="mr-1 h-8 rounded-lg border border-[#D7EDEE] bg-white px-2 text-xs text-[#334155] outline-none"
        >
          <option value="p">Absatz</option>
          <option value="h2">Titel</option>
          <option value="h3">Untertitel</option>
          <option value="blockquote">Zitat</option>
        </select>
        {actions.map(({ command, label, icon: Icon }) => (
          <button
            key={command}
            type="button"
            title={label}
            aria-label={label}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(command)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#475569] hover:bg-[#E0F7FA] hover:text-[#00838F] disabled:opacity-40"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        <button
          type="button"
          title="Link einfügen"
          aria-label="Link einfügen"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={addLink}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#475569] hover:bg-[#E0F7FA] hover:text-[#00838F] disabled:opacity-40"
        >
          <Link2 className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        style={{ minHeight }}
        className="max-h-[520px] overflow-y-auto px-5 py-4 text-sm leading-7 text-[#4A5568] outline-none [&_a]:text-[#0097A7] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-[#B2EBF2] [&_blockquote]:pl-4 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#1E1E1E] [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-3 [&_ul]:list-disc"
      />
    </div>
  );
}
