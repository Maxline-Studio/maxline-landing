"use client";

import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import {
  requestPasswordResetAction,
  type AuthState,
} from "@/lib/auth-actions";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function ResetPasswordForm({ step }: { step: 1 | 2 }) {
  if (step === 1) {
    return <RequestForm />;
  }
  return <NewPasswordForm />;
}

function RequestForm() {
  const [state, formAction, pending] = useActionState<
    AuthState | undefined,
    FormData
  >(requestPasswordResetAction, undefined);

  if (state?.success) {
    return (
      <div
        role="status"
        className="bg-rouge-50 border border-rouge-200 rounded-sm p-5 flex items-start gap-3"
      >
        <CheckCircle2
          className="h-6 w-6 text-rouge-600 flex-shrink-0 mt-0.5"
          aria-hidden
        />
        <p className="text-sm text-ink-700 leading-relaxed">{state.success}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label
          htmlFor="email"
          className="block font-mono text-[10px] uppercase tracking-widest text-ink-700 mb-2"
        >
          Email
        </label>
        <div className="relative">
          <Mail
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 pointer-events-none"
            aria-hidden
          />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="votre@email.fr"
            className="pl-10"
          />
        </div>
      </div>

      {state?.error && (
        <div
          role="alert"
          className="flex items-start gap-2 p-3 bg-rouge-50 border border-rouge-200 rounded-sm text-sm text-rouge-700"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden />
          <span>{state.error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-pen w-full disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Envoi…" : "Envoyer le lien de réinitialisation"}
      </button>
    </form>
  );
}

function NewPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const passwordConfirm = formData.get("password_confirm") as string;

    if (password.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères.");
      setPending(false);
      return;
    }
    if (password !== passwordConfirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      setPending(false);
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(`Erreur : ${updateError.message}`);
      setPending(false);
      return;
    }

    router.push("/app/dashboard");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="password"
          className="block font-mono text-[10px] uppercase tracking-widest text-ink-700 mb-2"
        >
          Nouveau mot de passe
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="••••••••"
        />
      </div>

      <div>
        <label
          htmlFor="password_confirm"
          className="block font-mono text-[10px] uppercase tracking-widest text-ink-700 mb-2"
        >
          Confirmer
        </label>
        <Input
          id="password_confirm"
          name="password_confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="••••••••"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 p-3 bg-rouge-50 border border-rouge-200 rounded-sm text-sm text-rouge-700"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-pen w-full disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Mise à jour…" : "Mettre à jour mon mot de passe"}
      </button>
    </form>
  );
}
