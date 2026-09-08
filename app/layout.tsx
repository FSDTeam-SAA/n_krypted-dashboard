import type { Metadata } from "next";
import "react-quill-new/dist/quill.snow.css";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import QueryProvider from "@/components/providers/QueryProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Signature Dish - Admin Dashboard",
  description: "N_Krypted / Signature Dish Administrator Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="de"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col font-sans bg-[#FFFBE9] text-[#1E1E1E]"
        suppressHydrationWarning
      >
        <AuthProvider>
          <QueryProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
