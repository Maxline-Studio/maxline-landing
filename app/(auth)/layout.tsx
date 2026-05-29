import Link from "next/link";

/**
 * Layout pour les pages d'authentification (login, signup, reset).
 * Pas de header landing — juste un logo simple en haut et un footer minimal.
 * Le contenu est centré, format carte ivory sur fond ivory-100.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-ivory-100 relative overflow-hidden">
      {/* Filet rouge top */}
      <div className="h-[3px] bg-rouge-500 w-full" aria-hidden />

      {/* Grain papier */}
      <div className="absolute inset-0 paper-grain pointer-events-none" aria-hidden />

      {/* Header minimal */}
      <header className="relative px-6 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-3 group"
          aria-label="Maxline Studio — accueil"
        >
          <div className="relative flex items-center">
            <span className="font-display font-black text-2xl tracking-tight text-ink-900 leading-none">
              Maxline
            </span>
            <span
              className="absolute -right-2.5 -top-0.5 h-2 w-2 rounded-full bg-rouge-500 group-hover:animate-pulse-soft"
              aria-hidden
            />
          </div>
          <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-[0.25em] text-ink-500 border-l border-ivory-300 pl-3">
            studio
          </span>
        </Link>
      </header>

      {/* Contenu centré */}
      <main
        id="main-content"
        className="relative flex-1 flex items-center justify-center px-4 py-12"
      >
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer minimal */}
      <footer className="relative text-center pb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
          © 2026 Maxline Studio &middot; <Link href="/legal/mentions" className="hover:text-rouge-500 transition-colors">Mentions légales</Link> &middot; <Link href="/legal/confidentialite" className="hover:text-rouge-500 transition-colors">Confidentialité</Link>
        </p>
      </footer>
    </div>
  );
}
