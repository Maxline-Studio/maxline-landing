import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-neutral-900 text-cream-50" role="contentinfo">
      <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-lg bg-primary-400 flex items-center justify-center">
                <span className="text-neutral-900 font-extrabold text-lg tracking-tight">M</span>
              </div>
              <span className="flex items-baseline gap-1.5 text-lg">
                <span className="font-extrabold tracking-tight text-cream-50">MAXLINE</span>
                <span className="font-light italic text-primary-400">studio</span>
              </span>
            </div>
            <p className="text-sm text-neutral-400 max-w-xs">
              Vos vidéos françaises, sous-titrées en anglais en 10 minutes.
            </p>
          </div>

          {/* Produit */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-cream-50">Produit</h3>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>
                <a href="/#how-it-works" className="hover:text-cream-50 transition-colors">
                  Comment ça marche
                </a>
              </li>
              <li>
                <a href="/#pricing" className="hover:text-cream-50 transition-colors">
                  Tarifs
                </a>
              </li>
              <li>
                <a href="/#faq" className="hover:text-cream-50 transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <Link href="/blog" className="hover:text-cream-50 transition-colors">
                  Journal
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-cream-50">Légal</h3>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>
                <Link
                  href="/legal/mentions"
                  className="hover:text-cream-50 transition-colors"
                >
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/confidentialite"
                  className="hover:text-cream-50 transition-colors"
                >
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/cookies"
                  className="hover:text-cream-50 transition-colors"
                >
                  Cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-cream-50">Contact</h3>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>
                <a
                  href="mailto:contact@maxlinestudio.fr"
                  className="hover:text-cream-50 transition-colors"
                >
                  contact@maxlinestudio.fr
                </a>
              </li>
              <li className="text-neutral-500 italic">
                Réseaux à venir
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-700 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-neutral-500">
          <p>© 2026 Maxline Studio. Tous droits réservés.</p>
          <p>Fait avec ☕ en France · Hébergé en Europe</p>
        </div>
      </div>
    </footer>
  );
}
