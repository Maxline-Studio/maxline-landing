"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const subscribeSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  source: z.string().optional(),
});

type SubscribeForm = z.infer<typeof subscribeSchema>;

export function Subscribe() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        body: JSON.stringify({ email: data.email, source: "landing-coming-soon" }),
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
    <section id="subscribe" className="py-24 md:py-32 bg-neutral-900 text-cream-50 relative overflow-hidden">
      {/* Tape lines */}
      <div className="absolute inset-0 -z-0 tape-lines pointer-events-none" aria-hidden />

      {/* M géant watermark */}
      <div
        aria-hidden
        className="absolute -left-20 -bottom-20 font-display font-extrabold text-[24rem] text-primary-400 leading-none opacity-[0.04] pointer-events-none select-none"
      >
        M
      </div>

      <div className="container mx-auto max-w-3xl px-4 md:px-6 lg:px-8 relative">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="timecode">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 animate-pulse-soft" />
              CH. 08 · LISTE D&apos;ATTENTE
            </span>
          </div>
          <h2 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl text-cream-50 leading-[1.0] tracking-tighter">
            Soyez prévenu
            <br />
            <span className="slab">du lancement</span>.
          </h2>
          <p className="mt-6 text-lg text-neutral-400 max-w-xl">
            La bêta privée ouvre d&apos;ici quelques semaines. Les premiers
            inscrits auront un accès gratuit prolongé.
          </p>
        </div>

        {status === "success" ? (
          <div
            role="status"
            className="bg-primary-400 text-neutral-900 border-2 border-primary-400 rounded-sm p-6 md:p-8 max-w-xl"
          >
            <div className="flex items-start gap-4">
              <CheckCircle2
                className="h-10 w-10 text-neutral-900 flex-shrink-0"
                strokeWidth={2.5}
                aria-hidden
              />
              <div>
                <h3 className="font-display font-extrabold text-xl text-neutral-900 mb-2">
                  C&apos;est noté.
                </h3>
                <p className="text-neutral-900">
                  Vous recevrez un email dès que la bêta privée s&apos;ouvrira.
                  Pensez à vérifier vos spams pour la confirmation.
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 pointer-events-none"
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
                  className="pl-11 h-12 bg-neutral-800 border-neutral-700 text-cream-50 placeholder:text-neutral-500"
                  {...register("email")}
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={status === "loading"}
                className="sm:w-auto w-full"
              >
                {status === "loading" ? "Envoi..." : "Me prévenir"}
              </Button>
            </div>

            {errors.email && (
              <p
                id="email-subscribe-error"
                role="alert"
                className="mt-2 text-sm text-error-500 flex items-center gap-1.5"
              >
                <AlertCircle className="h-4 w-4" aria-hidden />
                {errors.email.message}
              </p>
            )}

            {!errors.email && status !== "error" && (
              <p
                id="email-subscribe-help"
                className="mt-3 text-xs text-neutral-400"
              >
                Aucun spam, désabonnement en 1 clic. Vos données restent en Europe.
              </p>
            )}

            {status === "error" && (
              <p
                role="alert"
                className="mt-2 text-sm text-error-500 flex items-center gap-1.5"
              >
                <AlertCircle className="h-4 w-4" aria-hidden />
                {errorMessage || "Une erreur est survenue, réessayez."}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
