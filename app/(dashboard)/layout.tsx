"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen min-w-0 bg-[#FFFBE9]">
      {/* Desktop Sidebar (visible on lg screens) */}
      <Sidebar className="hidden lg:flex shrink-0 sticky top-0 h-screen overflow-y-auto" />

      {/* Mobile Drawer (visible on mobile / tablet when opened) */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FFFBE9]">
        <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        <main className="w-full min-w-0 flex-1 p-3 sm:p-5 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
