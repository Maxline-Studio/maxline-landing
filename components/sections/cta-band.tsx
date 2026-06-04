import { Reveal } from "@/components/reveal";
import { AuthAwareCta } from "@/components/auth-aware-cta";

/**
 * Bandeau de conversion à mi-page (après le comparatif) : capte le lecteur au
 * pic de conviction, avant qu'il ait à scroller jusqu'au prix. Rouge = couleur
 * signature, accent franc mais sobre (pas de gradient).
 */
export function CtaBand() {
  return (
    <section className="relative py-16 md:py-20 bg-rouge-500 text-ivory-50">
      <div className="container mx-auto max-w-5xl px-4 md:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="font-display font-medium text-2xl md:text-3xl leading-tight">
                Convaincu ? Votre première vidéo est offerte.
              </h2>
              <p className="mt-2 text-ivory-50/90">
                Moins de 5 minutes, sans carte bancaire. Vous jugez sur pièce.
              </p>
            </div>
            <AuthAwareCta
              loggedOutHref="/signup"
              loggedOutLabel="Sous-titrer une vidéo gratuitement"
              loggedInHref="/app/upload"
              loggedInLabel="Déposer une vidéo"
              className="group inline-flex items-center justify-center gap-2 bg-ivory-50 text-ink-900 px-6 h-12 rounded-sm font-semibold hover:bg-ivory-100 transition-colors shrink-0"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
