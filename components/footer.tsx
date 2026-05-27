import Link from "next/link";

export function Footer() {
  return (
    <footer
      className="bg-ink-900 text-ivory-50 border-t-4 border-rouge-500"
      role="contentinfo"
    >
      <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-14 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <span className="font-display font-black text-3xl text-ivory-50 leading-none">
                  Maxline
                </span>
                <span className="absolute -right-2.5 -top-0.5 h-2 w-2 rounded-full bg-rouge-500" />
              </div>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-rouge-400 mb-4 inline-block">
              studio
            </span>
            <p className="text-sm text-ink-300 leading-relaxed max-w-xs">
              Vos vidéos françaises, sous-titrées en anglais.
              <br />
              Soigné comme par un éditeur.
            </p>
            <span className="annotation mt-5 inline-flex border-rouge-400 text-rouge-400">
              v.0 · pré-lancement
            </span>
          </div>

          {/* Produit */}
          <div>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-ivory-50 mb-5">
              Produit
            </h3>
            <ul className="space-y-3 text-sm text-ink-300">
              <li>
                <a href="/#how-it-works" className="hover:text-rouge-400 transition-colors">
                  Procédé
                </a>
              </li>
              <li>
                <a href="/#pricing" className="hover:text-rouge-400 transition-colors">
                  Tarif
                </a>
              </li>
              <li>
                <a href="/#faq" className="hover:text-rouge-400 transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <Link href="/blog" className="hover:text-rouge-400 transition-colors">
                  Journal
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-ivory-50 mb-5">
              Légal
            </h3>
            <ul className="space-y-3 text-sm text-ink-300">
              <li>
                <Link
                  href="/legal/mentions"
                  className="hover:text-rouge-400 transition-colors"
                >
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/confidentialite"
                  className="hover:text-rouge-400 transition-colors"
                >
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/cookies"
                  className="hover:text-rouge-400 transition-colors"
                >
                  Cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-ivory-50 mb-5">
              Contact
            </h3>
            <ul className="space-y-3 text-sm text-ink-300">
              <li>
                <a
                  href="mailto:contact@maxlinestudio.fr"
                  className="hover:text-rouge-400 transition-colors"
                >
                  contact@maxlinestudio.fr
                </a>
              </li>
              <li className="text-ink-500 italic font-display">
                Réseaux à venir
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-ink-700 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono uppercase tracking-wider text-ink-500">
          <p>© 2026 Maxline Studio · Tous droits réservés</p>
          <p>
            Édité à Paris ·{" "}
            <span className="text-rouge-400">hébergé en Europe</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
