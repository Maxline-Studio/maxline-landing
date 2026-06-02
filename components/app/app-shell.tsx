"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  Video,
  Award,
  Settings,
  CreditCard,
  FileText,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/lib/auth-actions";
import type { Profile, Rank } from "@/lib/supabase/types";
import { Avatar } from "@/components/app/avatar";

const NAV_ITEMS = [
  { href: "/app/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/app/upload", label: "Nouvelle vidéo", icon: Upload },
  { href: "/app/translate-file", label: "Traduire un fichier", icon: FileText },
  { href: "/app/videos", label: "Mes vidéos", icon: Video },
  { href: "/app/atelier", label: "L'Atelier", icon: Award },
  { href: "/app/billing", label: "Facturation", icon: CreditCard },
  { href: "/app/settings", label: "Paramètres", icon: Settings },
];

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ivory-50 flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col bg-ink-900 text-ivory-50 border-r-4 border-rouge-500">
        <SidebarContent
          profile={profile}
          pathname={pathname}
          onNavigate={() => {}}
        />
      </aside>

      {/* Sidebar mobile (drawer) */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-ink-900/50 z-40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 w-72 z-50 bg-ink-900 text-ivory-50 border-r-4 border-rouge-500 flex flex-col">
            <SidebarContent
              profile={profile}
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden sticky top-0 z-30 bg-ivory-50/95 backdrop-blur-sm border-b border-ivory-200 flex items-center justify-between px-4 h-14">
          <Link
            href="/app/dashboard"
            className="flex items-center gap-2"
            aria-label="Maxline Studio"
          >
            <div className="relative flex items-center">
              <span className="font-display font-black text-xl tracking-tight text-ink-900 leading-none">
                Maxline
              </span>
              <span
                className="absolute -right-2 -top-0.5 h-1.5 w-1.5 rounded-full bg-rouge-500"
                aria-hidden
              />
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 -mr-2 text-ink-800"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-6 w-6" aria-hidden />
          </button>
        </header>

        <main id="main-content" className="flex-1 overflow-x-hidden">
          {/* Conteneur unique : largeur/padding cohérents sur toutes les pages app.
              Centré et borné pour rester lisible sur très grand écran, fluide
              sur mobile/tablette. Les pages ne fixent plus leur propre largeur. */}
          <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 py-8 md:py-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  profile,
  pathname,
  onNavigate,
}: {
  profile: Profile;
  pathname: string;
  onNavigate: () => void;
}) {
  const minutesAvailable =
    Math.max(profile.quota_minutes_total - profile.quota_minutes_used, 0) +
    profile.credits_minutes;

  return (
    <>
      {/* Logo header */}
      <div className="px-6 py-6 border-b border-ink-800 flex items-center justify-between">
        <Link
          href="/app/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3 group"
          aria-label="Maxline Studio"
        >
          <div className="relative flex items-center">
            <span className="font-display font-black text-2xl tracking-tight text-ivory-50 leading-none">
              Maxline
            </span>
            <span
              className="absolute -right-2.5 -top-0.5 h-2 w-2 rounded-full bg-rouge-500 group-hover:animate-pulse-soft"
              aria-hidden
            />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-rouge-400 mt-0.5">
            studio
          </span>
        </Link>
        <button
          type="button"
          onClick={onNavigate}
          className="lg:hidden p-1 -mr-1 text-ivory-50"
          aria-label="Fermer le menu"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {/* Profil + rang */}
      <div className="px-6 py-5 border-b border-ink-800">
        <div className="flex items-center gap-3 mb-3">
          <Avatar src={profile.avatar_url} rank={profile.rank as Rank} />
          <div className="min-w-0">
            <div className="text-sm font-medium text-ivory-50 truncate">
              {profile.display_name || profile.email}
            </div>
            <div className="text-xs text-ink-300 font-mono uppercase tracking-widest">
              {formatRank(profile.rank)}
            </div>
          </div>
        </div>

        {/* Quota */}
        <div className="text-xs text-ink-300 mb-2 font-mono uppercase tracking-widest">
          Minutes disponibles
        </div>
        <div className="text-lg font-display font-bold text-rouge-400 tabular-nums">
          {minutesAvailable.toFixed(0)}{" "}
          <span className="text-xs text-ink-300 font-normal">min</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors group",
                isActive
                  ? "bg-rouge-500 text-ivory-50"
                  : "text-ivory-50/80 hover:bg-ink-800 hover:text-ivory-50",
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer sidebar : logout */}
      <div className="px-3 py-4 border-t border-ink-800">
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium text-ivory-50/70 hover:bg-ink-800 hover:text-ivory-50 transition-colors"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} aria-hidden />
            Se déconnecter
          </button>
        </form>
        <Link
          href="/"
          onClick={onNavigate}
          className="block mt-2 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-ink-400 hover:text-rouge-400 transition-colors"
        >
          ← Retour au site public
        </Link>
      </div>
    </>
  );
}

function formatRank(rank: string): string {
  return (
    {
      apprenti: "Apprenti",
      correcteur: "Correcteur",
      editeur_en_chef: "Éditeur en chef",
      maitre_doeuvre: "Maître d'œuvre",
    }[rank] || rank
  );
}
