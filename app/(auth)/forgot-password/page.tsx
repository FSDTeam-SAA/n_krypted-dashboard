"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi, getApiErrorMessage } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Bitte geben Sie Ihre E-Mail-Adresse ein.");
      return;
    }

    try {
      setIsLoading(true);
      await authApi.forgotPassword({ email });
      toast.success("Wenn die E-Mail-Adresse registriert ist, wurde ein Link zum Zurücksetzen gesendet.");
      router.push("/signin");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Fehler beim Senden des Codes."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-xl sm:text-2xl font-bold text-[#1E1E1E] mb-2">
        Passwort vergessen?
      </h2>
      <p className="text-xs sm:text-sm text-[#718096] max-w-sm mb-8 leading-relaxed">
        Stellen Sie Ihr Konto sicher wieder her und setzen Sie Ihre kulinarische Reise fort.
      </p>

      <form onSubmit={handleSubmit} className="w-full space-y-5 text-left">
        <label className="flex flex-col gap-2 text-xs font-semibold text-[#334155]">
          <span>E-Mail</span>
          <Input
            type="email"
            placeholder="Ihre registrierte E-Mail-Adresse"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
            className="h-12 border-[#90CAF9] focus-visible:ring-[#0097A7]"
          />
        </label>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-xl bg-[#0097A7] hover:bg-[#00838F] text-white font-medium text-base shadow-sm"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Wird gesendet...</span>
            </div>
          ) : (
            "Bestätigungscode senden"
          )}
        </Button>

        <div className="text-center pt-2">
          <Link
            href="/signin"
            className="inline-flex items-center gap-1 text-xs sm:text-sm text-[#718096] hover:text-[#0097A7]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Zurück zur Anmeldung</span>
          </Link>
        </div>
      </form>
    </div>
  );
}
