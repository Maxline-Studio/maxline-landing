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
            <span className="annotation annotation-on-ink mt-5 inline-flex">
              Fait main en France
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
                <Link href="/atelier" className="hover:text-rouge-400 transition-colors">
                  L&apos;Atelier
                </Link>
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
                <Link href="/traduire-une-video" className="hover:text-rouge-400 transition-colors">
                  Traduire une vidéo
                </Link>
              </li>
              <li>
                <Link href="/outils" className="hover:text-rouge-400 transition-colors">
                  Outils gratuits
                </Link>
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
              <li>
                <Link
                  href="/legal/cgu"
                  className="hover:text-rouge-400 transition-colors"
                >
                  Conditions générales
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
              <li>
                <a
                  href="https://www.facebook.com/profile.php?id=61581498317108"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Maxline Studio sur Facebook"
                  className="inline-flex items-center gap-2 text-ink-300 hover:text-rouge-400 transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.026 4.388 11.022 10.125 11.927v-8.437H7.078v-3.49h3.047V9.43c0-3.017 1.79-4.683 4.532-4.683 1.313 0 2.686.236 2.686.236v2.953H15.83c-1.49 0-1.955.93-1.955 1.886v2.252h3.328l-.532 3.49h-2.796v8.437C19.612 23.095 24 18.099 24 12.073z" />
                  </svg>
                  <span>Facebook</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-ink-700 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono uppercase tracking-wider text-ink-500">
          <p>© 2026 Maxline Studio · Tous droits réservés</p>
          <p>
            Édité en France ·{" "}
            <Link
              href="/legal/confidentialite"
              className="text-rouge-400 hover:text-rouge-300 transition-colors"
            >
              Conforme RGPD
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
