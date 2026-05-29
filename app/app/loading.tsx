/**
 * Squelette de chargement affiché instantanément par Next.js (Suspense)
 * pendant le rendu serveur d'une page /app/* — supprime le délai « page figée »
 * de 1-2 s ressenti lors des changements d'onglet.
 */
export default function AppLoading() {
  return (
    <div className="px-6 md:px-10 py-8 md:py-12 max-w-[1500px] animate-pulse">
      {/* Barre d'accent (rappel de la signature rouge) */}
      <div className="h-1 w-16 bg-rouge-200 rounded-full mb-8" />

      {/* En-tête */}
      <div className="mb-12">
        <div className="h-3 w-32 bg-ivory-200 rounded-sm mb-4" />
        <div className="h-10 w-2/3 max-w-md bg-ivory-200 rounded-sm" />
      </div>

      {/* Grille de cartes */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-40 bg-ivory-100 border-2 border-ivory-200 rounded-sm"
          />
        ))}
      </div>

      {/* Liste */}
      <div className="space-y-4">
        <div className="h-6 w-48 bg-ivory-200 rounded-sm" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-28 bg-ivory-100 border-2 border-ivory-200 rounded-sm"
            />
          ))}
        </div>
      </div>

      <span className="sr-only">Chargement…</span>
    </div>
  );
}
