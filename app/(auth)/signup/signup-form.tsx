"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Mail, User } from "lucide-react";
import {
  signUpAction,
  signInWithGoogleAction,
  type AuthState,
} from "@/lib/auth-actions";
import { Input } from "@/components/ui/input";

export function SignupForm() {
  const [state, formAction, pending] = useActionState<
    AuthState | undefined,
    FormData
  >(signUpAction, undefined);

  // Si succès, montrer le message dédié plutôt que le formulaire
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
        <div>
          <h3 className="font-display font-bold text-lg text-ink-900 mb-2">
            Vérifiez votre boîte mail
          </h3>
          <p className="text-sm text-ink-700 leading-relaxed">
            {state.success}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Google OAuth */}
      <form action={signInWithGoogleAction}>
        <button
          type="submit"
          className="w-full h-11 inline-flex items-center justify-center gap-3 bg-white border-2 border-ink-900 text-ink-900 rounded-sm hover:bg-ink-900 hover:text-ivory-50 transition-colors font-semibold"
        >
          <GoogleLogo />
          Continuer avec Google
        </button>
      </form>

      <div className="relative flex items-center gap-3 my-6">
        <span className="flex-1 h-px bg-ivory-300" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
          ou par email
        </span>
        <span className="flex-1 h-px bg-ivory-300" />
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="display_name"
            className="block font-mono text-[10px] uppercase tracking-widest text-ink-700 mb-2"
          >
            Comment vous appeler ?
          </label>
          <div className="relative">
            <User
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 pointer-events-none"
              aria-hidden
            />
            <Input
              id="display_name"
              name="display_name"
              type="text"
              autoComplete="name"
              placeholder="Prénom ou pseudo"
              className="pl-10"
            />
          </div>
        </div>

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

        <div>
          <label
            htmlFor="password"
            className="block font-mono text-[10px] uppercase tracking-widest text-ink-700 mb-2"
          >
            Mot de passe
            <span className="ml-2 text-ink-400 normal-case tracking-normal">
              (8 caractères min.)
            </span>
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
          {pending ? "Création…" : "Créer mon atelier"}
        </button>

        <p className="text-xs text-ink-500 leading-relaxed">
          En créant votre compte, vous acceptez les{" "}
          <a href="/legal/mentions" className="link-pen">
            mentions légales
          </a>{" "}
          et notre{" "}
          <a href="/legal/confidentialite" className="link-pen">
            politique de confidentialité
          </a>
          .
        </p>
      </form>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
