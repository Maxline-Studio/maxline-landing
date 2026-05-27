"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full transition-all duration-200",
        scrolled
          ? "bg-cream-50/90 backdrop-blur-md border-b border-neutral-200"
          : "bg-transparent",
      )}
    >
      <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="flex h-14 md:h-16 items-center justify-between">
          {/* Logo — encadré comme un slate de tournage */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            aria-label="Maxline Studio - accueil"
          >
            <div className="h-9 w-9 bg-neutral-900 border-2 border-primary-400 rounded-sm flex items-center justify-center transition-transform group-hover:rotate-3">
              <span className="text-primary-400 font-display font-extrabold text-xl tracking-tight leading-none">
                M
              </span>
            </div>
            <span className="flex items-baseline gap-1.5">
              <span className="font-display font-extrabold tracking-tight text-neutral-900 text-lg uppercase">
                Maxline
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mt-0.5">
                studio
              </span>
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="/#how-it-works"
              className="text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
            >
              Comment ça marche
            </a>
            <a
              href="/#pricing"
              className="text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
            >
              Tarifs
            </a>
            <a
              href="/#faq"
              className="text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
            >
              FAQ
            </a>
            <Link
              href="/blog"
              className="text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
            >
              Journal
            </Link>
          </nav>

          {/* CTAs desktop */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="/#subscribe"
              className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
            >
              Être prévenu du lancement
            </a>
          </div>

          {/* Bouton burger mobile */}
          <button
            className="md:hidden p-2 -mr-2 text-neutral-700"
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden />
            ) : (
              <Menu className="h-6 w-6" aria-hidden />
            )}
          </button>
        </div>

        {/* Menu mobile */}
        {mobileMenuOpen && (
          <nav
            className="md:hidden border-t border-neutral-200 py-4 space-y-1"
            aria-label="Navigation principale"
          >
            <a
              href="/#how-it-works"
              className="block px-2 py-3 text-base font-medium text-neutral-700 hover:bg-neutral-100 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Comment ça marche
            </a>
            <a
              href="/#pricing"
              className="block px-2 py-3 text-base font-medium text-neutral-700 hover:bg-neutral-100 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tarifs
            </a>
            <a
              href="/#faq"
              className="block px-2 py-3 text-base font-medium text-neutral-700 hover:bg-neutral-100 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </a>
            <Link
              href="/blog"
              className="block px-2 py-3 text-base font-medium text-neutral-700 hover:bg-neutral-100 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Journal
            </Link>
            <div className="pt-4 px-2">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => {
                  setMobileMenuOpen(false);
                  document
                    .getElementById("subscribe")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Être prévenu du lancement
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
