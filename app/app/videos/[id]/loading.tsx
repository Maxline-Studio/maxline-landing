/**
 * Squelette de l'ÉDITEUR (et non du tableau de bord).
 *
 * Avant, la page vidéo héritait du squelette générique de /app : trois grandes
 * cartes, puis d'un coup l'éditeur plein écran. Le saut de mise en page donnait
 * une impression de lenteur supplémentaire, en plus du temps de chargement réel.
 * Ici, la forme annoncée est celle qui arrive : barre du haut, aperçu, timeline.
 */
export default function VideoEditorLoading() {
  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-10 -my-8 md:-my-12 h-[calc(100dvh-3.5rem)] lg:h-dvh flex flex-col bg-ivory-50 overflow-hidden animate-pulse">
      {/* Barre du haut */}
      <div className="flex items-center gap-2 px-2 sm:px-3 min-h-[52px] border-b border-ivory-200 flex-shrink-0">
        <div className="h-10 w-10 rounded-sm bg-ivory-200" />
        <div className="h-4 w-48 max-w-[40%] rounded-sm bg-ivory-200" />
        <div className="ml-auto flex items-center gap-1">
          <div className="h-10 w-10 rounded-sm bg-ivory-200" />
          <div className="h-10 w-10 rounded-sm bg-ivory-200" />
          <div className="h-10 w-24 rounded-sm bg-ivory-200" />
        </div>
      </div>

      {/* Aperçu */}
      <div className="flex-1 min-h-0 bg-ink-900 flex items-center justify-center px-2 py-2 sm:px-4">
        <div className="w-full max-w-[1100px] aspect-video rounded-sm bg-ink-800" />
      </div>

      {/* Outils timeline */}
      <div className="flex items-center gap-2 px-2 min-h-[40px] border-t border-ivory-200 bg-ivory-100 flex-shrink-0">
        <div className="h-3 w-16 rounded-sm bg-ivory-200" />
        <div className="h-8 w-9 rounded-sm bg-ivory-200" />
        <div className="h-8 w-9 rounded-sm bg-ivory-200" />
      </div>

      {/* Timeline */}
      <div className="flex-shrink-0 border-t border-ivory-200 bg-ivory-50 p-2 space-y-2">
        <div className="h-[22px] rounded-sm bg-ivory-100" />
        <div className="h-[26px] rounded-sm bg-ivory-100" />
        <div className="h-[34px] rounded-sm bg-ivory-100" />
        <div className="flex gap-2">
          <div className="h-[62px] w-1/4 rounded-sm bg-ivory-200" />
          <div className="h-[62px] w-1/6 rounded-sm bg-ivory-100" />
          <div className="h-[62px] w-1/3 rounded-sm bg-ivory-100" />
          <div className="h-[62px] w-1/5 rounded-sm bg-ivory-100" />
        </div>
      </div>

      <span className="sr-only">Chargement de l&apos;éditeur…</span>
    </div>
  );
}
