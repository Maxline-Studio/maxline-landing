"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

/**
 * Header — état unique, toujours sur fond ivory.
 * Pas d'état "transparent sur hero" qui rendait tout illisible.
 * Le hero démarre directement sous le header avec une bordure rouge.
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 w-full bg-ivory-50/95 backdrop-blur-sm border-b border-ivory-200 transition-shadow ${
        scrolled ? "shadow-[0_2px_24px_-12px_rgba(26,24,20,0.15)]" : ""
      }`}
    >
      {/* Filet rouge fin permanent au top — signature "manuscrit annoté" */}
      <div className="h-[3px] bg-rouge-500 w-full" aria-hidden />

      <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="flex h-16 md:h-18 items-center justify-between">
          {/* ─── Logo : Maxline + point rouge en exposant ─── */}
          <Link
            href="/"
            className="flex items-center gap-3 group"
            aria-label="Maxline Studio — accueil"
          >
            <div className="relative flex items-center">
              <span className="font-display font-black text-2xl md:text-[1.7rem] tracking-tight text-ink-900 leading-none">
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

          {/* ─── Nav desktop ─── */}
          <nav className="hidden md:flex items-center gap-9">
            {[
              { href: "/#how-it-works", label: "Procédé", external: false },
              { href: "/#atelier", label: "L'Atelier", external: false },
              { href: "/#pricing", label: "Tarif", external: false },
              { href: "/blog", label: "Journal", external: true },
              { href: "/#faq", label: "FAQ", external: false },
            ].map((item) => {
              const className =
                "relative text-sm font-medium text-ink-700 hover:text-ink-900 transition-colors group/link";
              const inner = (
                <>
                  <span>{item.label}</span>
                  <span
                    aria-hidden
                    className="absolute left-0 right-0 -bottom-1.5 h-[2px] bg-rouge-500 origin-left scale-x-0 group-hover/link:scale-x-100 transition-transform duration-300 ease-out"
                  />
                </>
              );
              return item.external ? (
                <Link key={item.href} href={item.href} className={className}>
                  {inner}
                </Link>
              ) : (
                <a key={item.href} href={item.href} className={className}>
                  {inner}
                </a>
              );
            })}
          </nav>

          {/* ─── CTAs desktop ─── */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-ink-700 hover:text-rouge-500 transition-colors"
            >
              Connexion
            </Link>
            <a
              href="/#subscribe"
              className="btn-pen text-sm py-2 px-4"
            >
              Réserver mon accès
            </a>
          </div>

          {/* ─── Burger mobile ─── */}
          <button
            className="md:hidden p-2 -mr-2 text-ink-800"
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-6 w-6" aria-hidden />
            ) : (
              <Menu className="h-6 w-6" aria-hidden />
            )}
          </button>
        </div>

        {/* ─── Menu mobile ─── */}
        {mobileOpen && (
          <nav
            className="md:hidden border-t border-ivory-200 py-4 space-y-1 bg-ivory-50"
            aria-label="Navigation principale"
          >
            {[
              { href: "/#how-it-works", label: "Procédé" },
              { href: "/#atelier", label: "L'Atelier" },
              { href: "/#pricing", label: "Tarif" },
              { href: "/blog", label: "Journal", isLink: true },
              { href: "/#faq", label: "FAQ" },
            ].map((item) => {
              const className =
                "block px-3 py-3 text-base font-medium text-ink-800 hover:bg-ivory-100 rounded-sm transition-colors";
              return item.isLink ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className={className}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  className={className}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </a>
              );
            })}
            <div className="pt-4 px-2 space-y-3">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center w-full px-3 py-3 text-base font-medium text-ink-800 border border-ink-300 rounded-sm hover:bg-ivory-100 transition-colors"
              >
                Connexion
              </Link>
              <a
                href="/#subscribe"
                onClick={() => setMobileOpen(false)}
                className="btn-pen w-full"
              >
                Réserver mon accès
              </a>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
