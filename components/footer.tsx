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
                <Link href="/sous-titres" className="hover:text-rouge-400 transition-colors">
                  Sous-titrer une vidéo
                </Link>
              </li>
              <li>
                <Link href="/traduire-une-video" className="hover:text-rouge-400 transition-colors">
                  Traduire une vidéo
                </Link>
              </li>
              <li>
                <Link href="/alternative" className="hover:text-rouge-400 transition-colors">
                  Comparatifs
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
              <li>
                <a
                  href="https://www.instagram.com/maxlinestudio/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Maxline Studio sur Instagram"
                  className="inline-flex items-center gap-2 text-ink-300 hover:text-rouge-400 transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.311 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.311-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.311-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.336-2.633 1.311-3.608.975-.975 2.242-1.249 3.608-1.311 1.266-.058 1.646-.07 4.85-.07zm0 1.802c-3.155 0-3.522.012-4.764.069-1.025.047-1.583.218-1.953.362-.491.191-.842.42-1.21.788-.368.368-.597.719-.788 1.21-.144.37-.315.928-.362 1.953-.057 1.242-.069 1.609-.069 4.764s.012 3.522.069 4.764c.047 1.025.218 1.583.362 1.953.191.491.42.842.788 1.21.368.368.719.597 1.21.788.37.144.928.315 1.953.362 1.242.057 1.609.069 4.764.069s3.522-.012 4.764-.069c1.025-.047 1.583-.218 1.953-.362.491-.191.842-.42 1.21-.788.368-.368.597-.719.788-1.21.144-.37.315-.928.362-1.953.057-1.242.069-1.609.069-4.764s-.012-3.522-.069-4.764c-.047-1.025-.218-1.583-.362-1.953a3.27 3.27 0 0 0-.788-1.21 3.27 3.27 0 0 0-1.21-.788c-.37-.144-.928-.315-1.953-.362-1.242-.057-1.609-.069-4.764-.069zm0 3.064a4.971 4.971 0 1 1 0 9.942 4.971 4.971 0 0 1 0-9.942zm0 8.199a3.228 3.228 0 1 0 0-6.456 3.228 3.228 0 0 0 0 6.456zm6.336-8.401a1.162 1.162 0 1 1-2.324 0 1.162 1.162 0 0 1 2.324 0z" />
                  </svg>
                  <span>Instagram</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.tiktok.com/@maxlinestudio"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Maxline Studio sur TikTok"
                  className="inline-flex items-center gap-2 text-ink-300 hover:text-rouge-400 transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="M16.6 5.82a4.28 4.28 0 0 1-1.06-2.82h-3.2v12.83a2.45 2.45 0 0 1-2.45 2.45 2.45 2.45 0 1 1 .64-4.81v-3.27a5.66 5.66 0 0 0-.64-.04 5.67 5.67 0 1 0 5.67 5.67V9.01a7.45 7.45 0 0 0 4.36 1.4V7.2a4.28 4.28 0 0 1-3.32-1.38z" />
                  </svg>
                  <span>TikTok</span>
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
