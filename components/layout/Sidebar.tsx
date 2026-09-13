"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  Settings,
  LogOut,
  MapPinned,
  MessageSquareText,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "Übersicht",
    href: "/",
    icon: LayoutDashboard,
    pattern: /^\/$/,
  },
  {
    name: "Benutzerverwaltung",
    href: "/users",
    icon: Users,
    pattern: /^\/users/,
  },
  {
    name: "Restaurantverwaltung",
    href: "/restaurants",
    icon: UtensilsCrossed,
    pattern: /^\/restaurants/,
  },
  {
    name: "Check-ins",
    href: "/check-ins",
    icon: MapPinned,
    pattern: /^\/check-ins/,
  },
  {
    name: "Bewertungen",
    href: "/reviews",
    icon: MessageSquareText,
    pattern: /^\/reviews/,
  },
  {
    name: "Geschäftsbedingungen",
    href: "/terms-and-conditions",
    icon: ScrollText,
    pattern: /^\/terms-and-conditions/,
  },
  {
    name: "Datenschutzerklärung",
    href: "/privacy-policy",
    icon: ShieldCheck,
    pattern: /^\/privacy-policy/,
  },
  {
    name: "Einstellungen",
    href: "/settings",
    icon: Settings,
    pattern: /^\/settings/,
  },
];

interface SidebarProps {
  onNavClick?: () => void;
  className?: string;
}

export function Sidebar({ onNavClick, className }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const visibleNavigation =
    session?.user?.role === "restaurant_owner"
      ? navigation.filter(
          (item) =>
            item.href === "/restaurants" ||
            item.href === "/check-ins" ||
            item.href === "/reviews" ||
            item.href === "/settings"
        )
      : navigation;

  const handleSignOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("nk_access_token");
      localStorage.removeItem("nk_user");
    }
    await signOut({ callbackUrl: "/signin" });
  };

  return (
    <aside
      className={cn(
        "relative flex min-h-screen w-64 flex-col justify-between border-r border-[#F0ECE1] bg-white px-3 py-4 shadow-xs select-none z-20 sm:px-4 sm:py-6",
        className
      )}
    >
      {/* Decorative top-left yellow/cyan wave */}
      <div className="absolute top-0 left-0 w-24 h-36 pointer-events-none -z-0 overflow-hidden">
        <Image
          src="/design/Group 18.png"
          alt="Dekoration"
          width={100}
          height={150}
          className="object-contain object-top -translate-x-1 -translate-y-1"
          priority
        />
      </div>

      <div>
        {/* Logo */}
        <div className="flex flex-col items-center justify-center pt-2 pb-10 relative z-10">
          <Link href="/" className="flex flex-col items-center">
            <Image
              src="/design/Signature Dish II_Logo 4.png"
              alt="Signature Dish Logo"
              width={130}
              height={80}
              className="object-contain"
              priority
            />
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="relative z-10 flex flex-col gap-1.5">
          {visibleNavigation.map((item) => {
            const isActive = item.pattern.test(pathname);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavClick}
                className={cn(
                  "flex min-w-0 items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-all duration-200 sm:px-4 sm:py-3",
                  isActive
                    ? "bg-[#0097A7] text-white shadow-sm font-semibold translate-x-1"
                    : "text-[#2D3748] hover:bg-[#F8F9FA] hover:text-[#0097A7]"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-white" : "text-[#2D3748]"
                  )}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout button at bottom */}
      <div className="pt-6 border-t border-[#F0ECE1] relative z-10">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-[#EF4444] hover:bg-red-50/80 rounded-full transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5 text-[#EF4444]" />
          <span>Abmelden</span>
        </button>
      </div>
    </aside>
  );
}
