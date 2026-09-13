"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Menu, User as UserIcon } from "lucide-react";

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  const getPageTitle = () => {
    if (pathname === "/") return "Übersicht";
    if (pathname.startsWith("/users")) return "Benutzerverwaltung";
    if (pathname.startsWith("/restaurants")) return "Restaurantverwaltung";
    if (pathname.startsWith("/reviews")) return "Bewertungen";
    if (pathname.startsWith("/terms-and-conditions")) return "Geschäftsbedingungen";
    if (pathname.startsWith("/privacy-policy")) return "Datenschutzerklärung";
    if (pathname.startsWith("/settings")) return "Einstellungen";
    return "Verwaltungsportal";
  };

  const userName = user?.name ?? "";
  const userRole =
    user?.role === "admin"
      ? "Administrator"
      : user?.role === "restaurant_owner"
        ? "Restaurantbesitzer"
        : user?.role ?? "";
  const userAvatar = user?.avatar || user?.image;

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-[#F0ECE1] bg-white px-3 py-3 shadow-2xs sm:px-5 lg:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none cursor-pointer"
          aria-label="Menü öffnen"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Page title */}
        <h1 className="truncate text-base font-bold tracking-tight text-[#1E1E1E] sm:text-xl lg:text-2xl">
          {getPageTitle()}
        </h1>
      </div>

      {/* Admin Profile indicator at top right */}
      <div className="flex shrink-0 items-center gap-2 bg-transparent sm:gap-3">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-bold text-[#1E1E1E] leading-tight">
            {userName || "\u2014"}
          </div>
          <div className="text-xs text-[#718096] capitalize">
            {userRole || "\u2014"}
          </div>
        </div>

        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#CBD5E1] bg-gray-100 sm:h-10 sm:w-10">
          {userAvatar ? (
            <Image
              src={userAvatar}
              alt={userName}
              fill
              className="object-cover"
              sizes="40px"
              priority
              unoptimized={userAvatar.startsWith("blob:")}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-gray-400" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
