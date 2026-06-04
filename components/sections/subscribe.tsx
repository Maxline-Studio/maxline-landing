"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Mail, AlertCircle, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { HandUnderline } from "@/components/hand-underline";
import { createClient } from "@/lib/supabase/client";

const subscribeSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  source: z.string().optional(),
});

type SubscribeForm = z.infer<typeof subscribeSchema>;

export function Subscribe() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Adapte le bloc compte selon l'état de connexion (défaut visiteur, pas de flash).
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setLoggedIn(!!session?.user),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SubscribeForm>({
    resolver: zodResolver(subscribeSchema),
  });

  const onSubmit = async (data: SubscribeForm) => {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          source: "journal",
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Une erreur est survenue");
      }

      setStatus("success");
      reset();
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Une erreur est survenue",
      );
    }
  };

  return (
    <section
      id="subscribe"
      className="relative py-24 md:py-32 bg-ink-900 text-ivory-50 overflow-hidden"
    >
      <div className="absolute inset-0 paper-grain-ink pointer-events-none" aria-hidden />

      <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div>
          <div className="flex items-center gap-3 mb-6">
            <span className="annotation-filled">§10 · Votre atelier</span>
          </div>
          <h2 className="font-display font-medium text-4xl md:text-5xl lg:text-6xl text-ivory-50 leading-[1.05] tracking-[-0.02em]">
            Ouvrez votre
            <br />
            <span className="font-display italic font-light text-rouge-400">
              <HandUnderline variant="ivory" style="straight">
                atelier
              </HandUnderline>
            </span>
            .
          </h2>
          <p className="mt-6 text-lg text-ink-300 max-w-xl">
            {loggedIn
              ? "Votre atelier vous attend. Déposez une vidéo, on s'occupe des sous-titres et des traductions."
              : "Le studio est ouvert. Créez votre compte, sous-titrez votre première vidéo gratuitement — sans carte bancaire. 12 €/mois ensuite, sans engagement."}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            {loggedIn ? (
              <Link href="/app/upload" className="btn-pen group text-base">
                Déposer une vidéo
                <ArrowRight
                  className="h-5 w-5 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </Link>
            ) : (
              <>
                <Link href="/signup" className="btn-pen group text-base">
                  Créer mon atelier
                  <ArrowRight
                    className="h-5 w-5 transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-6 h-12 rounded-sm border border-ink-600 text-ivory-50 font-medium hover:bg-ink-800 transition-colors"
                >
                  J&apos;ai déjà un compte
                </Link>
              </>
            )}
          </div>
          </div>

          <div className="border-t border-ink-700 pt-10 lg:border-t-0 lg:border-l lg:border-ink-700 lg:pt-0 lg:pl-12 xl:pl-16">
            <div className="mb-8">
              <h3 className="font-display text-2xl md:text-3xl text-ivory-50 mb-3">
                Pas encore prêt ? Suivez le{" "}
            <Link href="/blog" className="text-rouge-400 underline-offset-4 hover:underline">
              Journal
            </Link>
            .
          </h3>
          <p className="text-base text-ink-300 max-w-xl mb-6">
            Je construis Maxline en public — décisions, chiffres, coulisses.
            Laissez votre email pour recevoir les nouveautés (rien d&apos;autre).
          </p>
        </div>

        {status === "success" ? (
          <div
            role="status"
            className="bg-rouge-500 text-ivory-50 border-2 border-rouge-500 rounded-sm p-6 md:p-8 max-w-xl"
          >
            <div className="flex items-start gap-4">
              <CheckCircle2
                className="h-10 w-10 text-ivory-50 flex-shrink-0"
                strokeWidth={2.5}
                aria-hidden
              />
              <div>
                <h3 className="font-display font-bold text-2xl text-ivory-50 mb-2">
                  C&apos;est noté.
                </h3>
                <p className="text-ivory-50/90 leading-relaxed">
                  Vous recevrez les nouveautés du Journal Maxline. Pensez à
                  vérifier vos spams pour la confirmation.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="max-w-xl"
            noValidate
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-400 pointer-events-none"
                  aria-hidden
                />
                <label htmlFor="email-subscribe" className="sr-only">
                  Adresse email
                </label>
                <Input
                  id="email-subscribe"
                  type="email"
                  autoComplete="email"
                  placeholder="votre@email.fr"
                  aria-describedby={
                    errors.email
                      ? "email-subscribe-error"
                      : "email-subscribe-help"
                  }
                  error={!!errors.email}
                  className="pl-11 h-12 bg-ink-800 border-ink-700 text-ivory-50 placeholder:text-ink-400"
                  {...register("email")}
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="btn-pen text-base h-12 px-6 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "loading" ? "Envoi…" : "Suivre le Journal"}
              </button>
            </div>

            {errors.email && (
              <p
                id="email-subscribe-error"
                role="alert"
                className="mt-2 text-sm text-rouge-400 flex items-center gap-1.5"
              >
                <AlertCircle className="h-4 w-4" aria-hidden />
                {errors.email.message}
              </p>
            )}

            {!errors.email && status !== "error" && (
              <p
                id="email-subscribe-help"
                className="mt-3 text-xs text-ink-400"
              >
                Aucun spam, désabonnement en 1 clic. Vos données restent en
                Europe.
              </p>
            )}

            {status === "error" && (
              <p
                role="alert"
                className="mt-2 text-sm text-rouge-400 flex items-center gap-1.5"
              >
                <AlertCircle className="h-4 w-4" aria-hidden />
                {errorMessage || "Une erreur est survenue, réessayez."}
              </p>
            )}
          </form>
        )}
          </div>
        </div>
      </div>
    </section>
  );
}
