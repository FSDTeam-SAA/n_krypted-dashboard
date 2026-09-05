"use client";

import React, { useEffect, useCallback } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-3xl",
}: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden sm:items-center sm:p-4 md:p-6"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className={`relative z-10 flex h-[96dvh] w-full ${maxWidth} flex-col overflow-hidden rounded-t-3xl border border-[#E8EDF2] bg-white shadow-2xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 sm:h-auto sm:max-h-[92dvh] sm:rounded-3xl sm:zoom-in-95`}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-slate-200 sm:hidden" />
        {/* Header */}
        {(title || description) && (
          <div className="flex shrink-0 items-start justify-between border-b border-[#E8EDF2] bg-gradient-to-r from-white to-[#F5FCFD] px-5 py-4 sm:px-8 sm:py-5">
            <div className="min-w-0 space-y-1 pr-4">
              {title && (
                <h2 className="truncate text-lg font-bold text-[#1E1E1E] sm:text-xl">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs text-[#718096] sm:text-sm">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl border border-transparent p-2 text-gray-400 transition-colors hover:border-[#DCEEF1] hover:bg-white hover:text-[#007E93] focus:outline-none focus:ring-2 focus:ring-[#0097A7]"
              title="Schließen"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="min-h-0 flex-1 overscroll-contain overflow-y-auto p-5 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
