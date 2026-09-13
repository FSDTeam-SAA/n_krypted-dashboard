import Image from "next/image";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden">
      {/* Background Image with Blur and Frosted Glass Overlay matching design */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/design/9ae1a2e55302f2437779582be5076f42d65da65e.jpg"
          alt="Hintergrund der Anmeldeseite"
          fill
          className="object-cover scale-105 filter blur-xs"
          priority
        />
        {/* Soft white/light wash overlay matching Figma */}
        <div className="absolute inset-0 bg-white/70 backdrop-blur-md" />
      </div>

      {/* Main Form Container */}
      <main className="w-full max-w-lg bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-white/60 relative z-10 animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Logo at top */}
        <div className="flex justify-center mb-6">
          <Image
            src="/design/Signature Dish II_Logo 4.png"
            alt="Signature Dish"
            width={140}
            height={90}
            className="object-contain"
            priority
          />
        </div>

        {children}
      </main>
    </div>
  );
}
