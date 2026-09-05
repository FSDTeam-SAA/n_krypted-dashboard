"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileCheck2, Loader2, Save, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { contentApi, getApiErrorMessage } from "@/lib/api";

type LegalField = "termsHtml" | "privacyHtml";

interface LegalContentEditorPageProps {
  field: LegalField;
  title: string;
  description: string;
}

export function LegalContentEditorPage({
  field,
  title,
  description,
}: LegalContentEditorPageProps) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<string | null>(null);

  const legalQuery = useQuery({
    queryKey: ["legal-content"],
    queryFn: contentApi.getLegalContent,
    enabled: session?.user?.role === "admin",
  });
  const html = draft ?? legalQuery.data?.[field] ?? "";
  const hasChanges = draft !== null && draft !== (legalQuery.data?.[field] ?? "");

  const mutation = useMutation({
    mutationFn: () => contentApi.updateLegalContent({ [field]: html }),
    onSuccess: (content) => {
      queryClient.setQueryData(["legal-content"], content);
      setDraft(content[field]);
      toast.success(`${title} wurde veröffentlicht.`);
    },
    onError: (error: unknown) =>
      toast.error(
        getApiErrorMessage(error, `${title} konnte nicht gespeichert werden.`),
      ),
  });

  if (status === "loading") {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0097A7]" />
      </div>
    );
  }

  if (session?.user?.role !== "admin") {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center rounded-3xl border border-amber-200 bg-white p-8 text-center">
        <ShieldAlert className="h-10 w-10 text-amber-500" />
        <h2 className="mt-4 text-xl font-bold text-[#1E1E1E]">Kein Zugriff</h2>
        <p className="mt-2 text-sm text-[#718096]">
          Diese Seite ist ausschließlich für Administratoren verfügbar.
        </p>
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-[#F0ECE1] bg-white shadow-xs sm:rounded-3xl">
      <div className="flex flex-col gap-4 border-b border-[#F5F2E8] bg-gradient-to-r from-[#F4FCFC] to-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6 lg:p-8">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <div className="shrink-0 rounded-xl bg-[#E0F7FA] p-2.5 text-[#00838F] sm:rounded-2xl sm:p-3">
            <FileCheck2 className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-[#1E1E1E] sm:text-2xl">{title}</h1>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-[#718096] sm:text-sm">
              {description}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={legalQuery.isLoading || mutation.isPending || !html.trim() || !hasChanges}
          className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0097A7] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00838F] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {mutation.isPending ? "Wird gespeichert..." : "Veröffentlichen"}
        </button>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        {legalQuery.isLoading ? (
          <div className="flex min-h-80 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#0097A7]" />
          </div>
        ) : legalQuery.isError ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-700">
            Der Inhalt konnte nicht geladen werden. Bitte versuchen Sie es erneut.
          </div>
        ) : (
          <>
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[#718096]">
                Formatieren Sie Überschriften, Absätze, Listen, Links und Hervorhebungen.
              </p>
              <span className="text-[11px] font-medium text-[#94A3B8]">
                {html.replace(/<[^>]*>/g, "").trim().length.toLocaleString("de-DE")} Zeichen
              </span>
            </div>
            <RichTextEditor
              value={html}
              onChange={setDraft}
              disabled={mutation.isPending}
              minHeight={380}
            />
            <p className="mt-3 text-xs leading-5 text-[#718096]">
              Nach dem Veröffentlichen wird die aktuelle Version automatisch in der mobilen App angezeigt.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
