"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi, getApiErrorMessage } from "@/lib/api";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("code") || searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Bitte füllen Sie alle Felder aus.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Die Passwörter stimmen nicht überein.");
      return;
    }

    if (password.length < 6) {
      toast.error("Das Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }

    try {
      setIsLoading(true);
      await authApi.resetPassword({
        email,
        token,
        password,
      });
      toast.success("Passwort erfolgreich geändert! Sie können sich jetzt anmelden.");
      router.push("/signin");
    } catch (err: unknown) {
      toast.error(
        getApiErrorMessage(err, "Das Passwort konnte nicht aktualisiert werden.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-xl sm:text-2xl font-bold text-[#1E1E1E] mb-2">
        Passwort ändern
      </h2>
      <p className="text-xs sm:text-sm text-[#718096] max-w-sm mb-8 leading-relaxed">
        Ihr neues Passwort sollte leicht zu merken und schwer zu erraten sein.
      </p>

      <form onSubmit={handleSubmit} className="w-full space-y-5 text-left">
        <label className="flex flex-col gap-2 text-xs font-semibold text-[#334155]">
          <span>Neues Passwort</span>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Mindestens 6 Zeichen"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              className="h-12 border-[#90CAF9] focus-visible:ring-[#0097A7] pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </label>

        <label className="flex flex-col gap-2 text-xs font-semibold text-[#334155]">
          <span>Passwort bestätigen</span>
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Passwort erneut eingeben"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
              className="h-12 border-[#90CAF9] focus-visible:ring-[#0097A7] pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label={showConfirmPassword ? "Passwort verbergen" : "Passwort anzeigen"}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </label>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-xl bg-[#0097A7] hover:bg-[#00838F] text-white font-medium text-base shadow-sm mt-2"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Wird gespeichert...</span>
            </div>
          ) : (
            "Speichern"
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-sm text-gray-500">Laden...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
