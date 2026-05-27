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
    <section id="subscribe" className="py-20 md:py-28 bg-neutral-900 text-cream-50">
      <div className="container mx-auto max-w-3xl px-4 md:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            Soyez prévenu du lancement
          </h2>
          <p className="mt-4 text-lg text-neutral-300 max-w-xl mx-auto">
            Nous lançons en bêta privée d&apos;ici quelques semaines.
            Les premiers inscrits auront un accès gratuit prolongé.
          </p>
        </div>

        {status === "success" ? (
          <div
            role="status"
            className="bg-success-500/10 border border-success-500/30 rounded-xl p-6 md:p-8 text-center max-w-xl mx-auto"
          >
            <CheckCircle2
              className="h-12 w-12 text-success-500 mx-auto mb-4"
              aria-hidden
            />
            <h3 className="text-xl font-semibold text-cream-50 mb-2">
              C&apos;est noté ! 👋
            </h3>
            <p className="text-neutral-300">
              Vous recevrez un email dès que la bêta privée s&apos;ouvrira.
              Vérifiez vos spams pour la confirmation.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="max-w-xl mx-auto"
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
