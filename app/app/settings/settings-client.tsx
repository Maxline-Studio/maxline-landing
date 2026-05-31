"use client";

import { useState, useTransition } from "react";
import {
  Clock,
  Mail,
  Globe,
  Trash2,
  Loader2,
  Check,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  updateRetention,
  updateEmailNotifications,
  deleteAccount,
} from "@/lib/settings-actions";

const RETENTION_OPTIONS = [7, 14, 30] as const;

export function SettingsClient({
  initialRetention,
  initialEmailNotifications,
}: {
  initialRetention: number;
  initialEmailNotifications: boolean;
}) {
  return (
    <div className="max-w-3xl space-y-6">
      <RetentionCard initial={initialRetention} />
      <EmailCard initial={initialEmailNotifications} />
      <LanguageCard />
      <DangerCard />
    </div>
  );
}

/** Cadre de section commun. */
function Card({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-ivory-50 border-2 border-ink-900 rounded-sm p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="flex-shrink-0 h-10 w-10 rounded-sm bg-ink-900 flex items-center justify-center text-rouge-400">
          {icon}
        </div>
        <div>
          <h2 className="font-display font-medium text-lg text-ink-900 leading-tight">
            {title}
          </h2>
          <p className="text-sm text-ink-600 mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function SavedFlash({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-success-600">
      <Check className="h-3.5 w-3.5" aria-hidden />
      Enregistré
    </span>
  );
}

function RetentionCard({ initial }: { initial: number }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const choose = (days: number) => {
    if (days === value) return;
    setValue(days);
    setSaved(false);
    start(async () => {
      const r = await updateRetention(days);
      if (r.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        setValue(initial);
      }
    });
  };

  return (
    <Card
      icon={<Clock className="h-5 w-5" strokeWidth={1.75} aria-hidden />}
      title="Conservation des vidéos"
      description="Vos vidéos et sous-titres sont supprimés automatiquement après ce délai."
    >
      <div className="flex items-center gap-2 flex-wrap">
        {RETENTION_OPTIONS.map((d) => (
          <button
            key={d}
            onClick={() => choose(d)}
            disabled={pending}
            className={`px-4 py-2 rounded-sm border text-sm font-medium transition-colors disabled:opacity-60 ${
              value === d
                ? "border-rouge-500 bg-rouge-50 text-ink-900"
                : "border-ivory-300 text-ink-600 hover:border-ink-400"
            }`}
          >
            {d} jours
          </button>
        ))}
        {pending && (
          <Loader2 className="h-4 w-4 animate-spin text-ink-400" aria-hidden />
        )}
        <SavedFlash show={saved} />
      </div>
      <p className="text-xs text-ink-500 mt-3 font-mono">
        › s&apos;applique aux nouvelles vidéos et recalcule celles déjà en ligne
      </p>
    </Card>
  );
}

function EmailCard({ initial }: { initial: boolean }) {
  const [enabled, setEnabled] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    setSaved(false);
    start(async () => {
      const r = await updateEmailNotifications(next);
      if (r.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        setEnabled(!next);
      }
    });
  };

  return (
    <Card
      icon={<Mail className="h-5 w-5" strokeWidth={1.75} aria-hidden />}
      title="Notifications par email"
      description="Bonus, montée de rang, parrainage. Les emails essentiels (compte, facturation) restent envoyés."
    >
      <div className="flex items-center gap-4">
        <button
          role="switch"
          aria-checked={enabled}
          aria-label="Activer les notifications par email"
          onClick={toggle}
          disabled={pending}
          className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
            enabled ? "bg-rouge-500" : "bg-ink-300"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-ivory-50 shadow transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className="text-sm text-ink-700">
          {enabled ? "Activées" : "Désactivées"}
        </span>
        {pending && (
          <Loader2 className="h-4 w-4 animate-spin text-ink-400" aria-hidden />
        )}
        <SavedFlash show={saved} />
      </div>
    </Card>
  );
}

function LanguageCard() {
  return (
    <Card
      icon={<Globe className="h-5 w-5" strokeWidth={1.75} aria-hidden />}
      title="Langue de l'interface"
      description="La langue de votre espace Maxline Studio."
    >
      <div className="flex items-center gap-2">
        <span className="px-4 py-2 rounded-sm border border-rouge-500 bg-rouge-50 text-sm font-medium text-ink-900">
          Français
        </span>
        <span className="text-xs text-ink-500 font-mono">
          › d&apos;autres langues à venir
        </span>
      </div>
    </Card>
  );
}

function DangerCard() {
  const [confirmText, setConfirmText] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const canDelete = confirmText.trim().toUpperCase() === "SUPPRIMER";

  const handleDelete = () => {
    if (!canDelete) return;
    setError(null);
    start(async () => {
      const r = await deleteAccount();
      if (r.ok) {
        // Le compte est supprimé : on nettoie la session locale et on sort.
        await createClient().auth.signOut();
        window.location.href = "/";
      } else {
        setError(r.error);
      }
    });
  };

  return (
    <section className="bg-rouge-50 border-2 border-rouge-200 rounded-sm p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 h-10 w-10 rounded-sm bg-rouge-500 flex items-center justify-center text-ivory-50">
          <AlertTriangle className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </div>
        <div>
          <h2 className="font-display font-medium text-lg text-ink-900 leading-tight">
            Supprimer mon compte
          </h2>
          <p className="text-sm text-ink-600 mt-0.5">
            Efface définitivement votre compte, vos vidéos, vos sous-titres et
            annule votre abonnement. Cette action est irréversible.
          </p>
        </div>
      </div>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-sm border-2 border-rouge-500 text-sm font-semibold text-rouge-600 hover:bg-rouge-500 hover:text-ivory-50 transition-colors"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          Supprimer mon compte
        </button>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm text-ink-700">
            Pour confirmer, tapez <strong>SUPPRIMER</strong> ci-dessous :
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              className="mt-2 w-full sm:w-64 bg-white border border-ink-300 rounded-sm px-3 py-2 text-ink-900 focus:outline-none focus:border-rouge-500"
              placeholder="SUPPRIMER"
            />
          </label>
          {error && (
            <p className="text-sm text-rouge-700" role="alert">
              {error}
            </p>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              disabled={!canDelete || pending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-rouge-500 text-ivory-50 text-sm font-semibold hover:bg-rouge-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden />
              )}
              Supprimer définitivement
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setConfirmText("");
                setError(null);
              }}
              disabled={pending}
              className="text-sm text-ink-500 hover:text-ink-900"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
