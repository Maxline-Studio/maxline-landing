"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * CTA qui s'adapte à l'état de connexion (même détection que le header).
 * Par défaut (état inconnu), on affiche le CTA visiteor pour éviter tout flash
 * et parce que la majorité des visiteurs de la landing sont déconnectés.
 */
export function AuthAwareCta({
  loggedOutHref,
  loggedOutLabel,
  loggedInHref,
  loggedInLabel,
  className = "btn-pen group text-base",
  withArrow = true,
}: {
  loggedOutHref: string;
  loggedOutLabel: string;
  loggedInHref: string;
  loggedInLabel: string;
  className?: string;
  withArrow?: boolean;
}) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setLoggedIn(!!session?.user),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const isIn = loggedIn === true;
  const href = isIn ? loggedInHref : loggedOutHref;
  const label = isIn ? loggedInLabel : loggedOutLabel;

  return (
    <Link href={href} className={className}>
      {label}
      {withArrow && (
        <ArrowRight
          className="h-5 w-5 transition-transform group-hover:translate-x-1"
          aria-hidden
        />
      )}
    </Link>
  );
}
