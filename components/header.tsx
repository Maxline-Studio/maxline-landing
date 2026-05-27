"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Header avec deux états :
 *   - top de page  : transparent sur ink hero, texte cream, lime accent
 *   - scrolled     : fond cream/blur, texte ink, lime hover underline
 *
 * Les liens portent un underline lime animé au hover (motion signature).
 */
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

  // Couleurs des liens selon l'état
  const linkText = scrolled ? "text-neutral-800" : "text-cream-50";
  const linkHover = scrolled
    ? "hover:text-neutral-900"
    : "hover:text-primary-400";
  const logoTextColor = scrolled ? "text-neutral-900" : "text-cream-50";
  const logoSubColor = scrolled ? "text-neutral-500" : "text-primary-400";
  const burgerColor = scrolled ? "text-neutral-800" : "text-cream-50";

  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full transition-all duration-300",
        scrolled
          ? "bg-cream-50/90 backdrop-blur-md border-b border-neutral-200"
          : "bg-transparent",
      )}
    >
      <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="flex h-16 md:h-18 items-center justify-between">
          {/* Logo — slate de tournage */}
          <Link
            href="/"
            className="flex items-center gap-3 group"
            aria-label="Maxline Studio - accueil"
          >
            <div
              className={cn(
                "h-10 w-10 border-2 border-primary-400 rounded-sm flex items-center justify-center transition-all duration-300 shrink-0",
                "group-hover:rotate-3 group-hover:scale-105",
                scrolled
                  ? "bg-neutral-900"
                  : "bg-neutral-900/40 backdrop-blur-sm",
              )}
            >
              <span className="text-primary-400 font-display font-extrabold text-xl tracking-tighter leading-none">
                M
              </span>
            </div>
            <span className="flex items-baseline gap-1.5">
              <span
                className={cn(
                  "font-display font-extrabold tracking-tight text-lg uppercase transition-colors",
                  logoTextColor,
                )}
              >
                Maxline
              </span>
              <span
                className={cn(
                  "font-mono text-[10px] uppercase tracking-[0.25em] mt-0.5 transition-colors",
                  logoSubColor,
                )}
              >
                studio
              </span>
            </span>
          </Link>

          {/* Nav desktop avec underline lime au hover */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { href: "/#how-it-works", label: "Comment ça marche", isLink: false },
              { href: "/#pricing", label: "Tarifs", isLink: false },
              { href: "/#faq", label: "FAQ", isLink: false },
              { href: "/blog", label: "Journal", isLink: true },
            ].map((item) => {
              const className = cn(
                "relative text-sm font-medium transition-colors group/link",
                linkText,
                linkHover,
              );
              const inner = (
                <>
                  <span>{item.label}</span>
                  <span
                    className="absolute left-0 right-0 -bottom-1.5 h-0.5 bg-primary-400 origin-left scale-x-0 group-hover/link:scale-x-100 transition-transform duration-300 ease-out"
                    aria-hidden
                  />
                </>
              );
              return item.isLink ? (
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

          {/* CTAs desktop */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="/#subscribe"
              className={cn(
                buttonVariants({ variant: "primary", size: "sm" }),
                "font-bold shadow-[0_0_24px_-4px_rgba(199,255,60,0.5)]",
              )}
            >
              Être prévenu
            </a>
          </div>

          {/* Burger mobile */}
          <button
            className={cn("md:hidden p-2 -mr-2 transition-colors", burgerColor)}
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
            className={cn(
              "md:hidden border-t py-4 space-y-1",
              scrolled
                ? "border-neutral-200 bg-cream-50/95 backdrop-blur-md"
                : "border-neutral-800 bg-neutral-900/95 backdrop-blur-md -mx-4 px-4",
            )}
            aria-label="Navigation principale"
          >
            {[
              { href: "/#how-it-works", label: "Comment ça marche", isLink: false },
              { href: "/#pricing", label: "Tarifs", isLink: false },
              { href: "/#faq", label: "FAQ", isLink: false },
              { href: "/blog", label: "Journal", isLink: true },
            ].map((item) => {
              const className = cn(
                "block px-3 py-3 text-base font-medium rounded-sm transition-colors",
                scrolled
                  ? "text-neutral-800 hover:bg-neutral-200"
                  : "text-cream-50 hover:bg-neutral-800",
              );
              return item.isLink ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className={className}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  className={className}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              );
            })}
            <div className="pt-4 px-2">
              <Button
                variant="primary"
                size="md"
                className="w-full font-bold"
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
