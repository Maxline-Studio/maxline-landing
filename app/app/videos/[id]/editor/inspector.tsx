"use client";

/**
 * Inspecteur contextuel, UNE seule instance, deux habits :
 *  - desktop (lg+) : volet statique docké à droite de l'aperçu ;
 *  - mobile/tablette : feuille du bas (bottom sheet) avec poignée + fond
 *    assombri, ouverte par la barre d'actions ou un tap sur un bloc.
 * Trois onglets : Sélection (texte + timing + actions de la ligne),
 * Style (presets + personnalisation), Exporter (fichiers + MP4 + suppression).
 */
import { useEffect, useState } from "react";
import {
  Download,
  Loader2,
  Play,
  Plus,
  ArrowDownUp,
  RotateCcw,
  Scissors,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import type { SubtitleStyle } from "@/lib/subtitle-style";
import type { BurnStatus } from "@/lib/video-actions";
import { speakerColor, speakerLabel } from "@/lib/speakers";
import { StylePanel } from "./style-panel";
import {
  cps,
  CPS_WARN,
  formatTimecode,
  parseTimecode,
  type Cue,
} from "./types";

export type InspectorTab = "selection" | "style" | "export";

export type SelectionApi = {
  cue: Cue | null;
  index: number;
  total: number;
  sourceText?: string;
  targetRtl?: boolean;
  sourceRtl?: boolean;
  multiSpeaker?: boolean;
  regenerating: boolean;
  canMerge: boolean;
  onText: (value: string) => void;
  onTextFocus: () => void;
  onTiming: (field: "start" | "end", value: number) => void;
  onSeek: () => void;
  onRegenerate: () => void;
  onSplit: () => void;
  onMerge: () => void;
  onAdd: () => void;
  onDelete: () => void;
};

export type ExportApi = {
  canExportPro: boolean;
  isAudio: boolean;
  burnStatus: BurnStatus;
  burnProgress: number;
  metaLine: string;
  targetLangShort: string;
  onExport: (fmt: "srt" | "vtt" | "txt" | "fcpxml") => void;
  onExportAll: () => void;
  onBurn: () => void;
  onDownloadBurned: () => void;
  onCopyTranscript: () => Promise<boolean>;
  onDeleteVideo: () => void;
  deleting: boolean;
};

export function Inspector({
  open,
  tab,
  onTab,
  onClose,
  selection,
  style,
  onStyle,
  exportApi,
}: {
  open: boolean;
  tab: InspectorTab;
  onTab: (t: InspectorTab) => void;
  onClose: () => void;
  selection: SelectionApi;
  style: SubtitleStyle;
  onStyle: (patch: Partial<SubtitleStyle>) => void;
  exportApi: ExportApi;
}) {
  return (
    <>
      {/* Fond assombri (mobile, feuille ouverte) */}
      <div
        aria-hidden
        onClick={onClose}
        className={`lg:hidden fixed inset-0 z-40 bg-ink-900/45 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <div
        role="dialog"
        aria-label="Édition du sous-titre"
        className={`z-50 bg-ivory-50 flex flex-col
          fixed inset-x-0 bottom-0 max-h-[72dvh] rounded-t-2xl border-t border-ivory-300 shadow-2xl
          transition-transform duration-200 ease-out
          ${open ? "translate-y-0" : "translate-y-[105%]"}
          lg:static lg:z-auto lg:translate-y-0 lg:max-h-none lg:h-full lg:min-h-0 lg:w-[380px] xl:w-[420px]
          lg:flex-shrink-0 lg:rounded-none lg:border-t-0 lg:border-l lg:border-ivory-200 lg:shadow-none lg:transition-none`}
      >
        {/* Poignée (mobile) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le panneau"
          className="lg:hidden flex justify-center py-2 flex-shrink-0"
        >
          <span className="w-10 h-1 rounded-full bg-ivory-300" />
        </button>

        {/* Onglets */}
        <div
          role="tablist"
          className="flex gap-1 px-4 border-b border-ivory-200 flex-shrink-0"
        >
          {(
            [
              ["selection", "Sélection"],
              ["style", "Style"],
              ["export", "Exporter"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => onTab(id)}
              className={`min-h-[44px] px-3.5 font-mono text-[10.5px] uppercase tracking-widest -mb-px border-b-2 transition-colors ${
                tab === id
                  ? "text-ink-900 border-rouge-500"
                  : "text-ink-400 border-transparent hover:text-ink-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Corps */}
        <div className="ml-scroll flex-1 min-h-0 overflow-y-auto px-4 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {tab === "selection" && <SelectionTab s={selection} />}
          {tab === "style" && (
            <StylePanel
              style={style}
              onChange={onStyle}
              multiSpeaker={selection.multiSpeaker}
            />
          )}
          {tab === "export" && <ExportTab x={exportApi} />}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Onglet Sélection
// ─────────────────────────────────────────────────────────────────
function SelectionTab({ s }: { s: SelectionApi }) {
  const c = s.cue;
  if (!c) {
    return (
      <div className="text-center py-10 text-ink-500 text-sm">
        <p className="mb-4">Aucune ligne sélectionnée.</p>
        <button
          onClick={s.onAdd}
          className="btn-outline text-sm"
          title="La ligne est créée à la tête de lecture"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Ajouter une ligne ici
        </button>
      </div>
    );
  }
  const speed = cps(c);
  const fast = speed > CPS_WARN;

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap mb-2.5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400 tabular-nums">
          Ligne {String(s.index + 1).padStart(2, "0")} / {s.total}
        </span>
        {s.multiSpeaker && typeof c.speaker === "number" && (
          <span
            className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wide text-ink-600"
            title="Locuteur détecté"
          >
            <span
              className="h-2.5 w-2.5 rounded-full border border-ink-300"
              style={{ backgroundColor: speakerColor(c.speaker) ?? "#C8C2B6" }}
            />
            {speakerLabel(c.speaker)}
          </span>
        )}
        <span
          className={`font-mono text-[9.5px] px-2 py-0.5 rounded-full tabular-nums ${
            fast
              ? "bg-amber-100 text-amber-800"
              : "bg-ivory-200 text-ink-600"
          }`}
          title="Vitesse de lecture (caractères/seconde), au-delà de 17, difficile à lire"
        >
          {speed.toFixed(0)} car/s{fast ? " · rapide" : ""}
        </span>
        <button
          onClick={s.onSeek}
          className="ml-auto inline-flex items-center gap-1 min-h-[36px] px-2 rounded-sm font-mono text-[10px] uppercase tracking-widest text-encre-500 hover:text-rouge-500 hover:bg-rouge-50 transition-colors"
          title="Aller à ce moment dans la vidéo"
        >
          <Play className="h-3 w-3" aria-hidden />
          Lire ici
        </button>
      </div>

      <textarea
        value={c.text}
        onChange={(e) => s.onText(e.target.value)}
        onFocus={s.onTextFocus}
        dir={s.targetRtl ? "rtl" : undefined}
        rows={3}
        className={`ml-scroll w-full min-h-[4.5rem] bg-white border border-ink-200 rounded-sm px-3 py-2.5 text-[15px] text-ink-900 leading-relaxed resize-y focus:outline-none focus:border-rouge-500 focus-visible:ring-2 focus-visible:ring-rouge-500/30 ${
          s.targetRtl ? "text-right" : ""
        }`}
        placeholder="Sous-titre…"
        aria-label="Texte du sous-titre"
      />

      {s.sourceText && (
        <p
          dir={s.sourceRtl ? "rtl" : undefined}
          className={`mt-2 text-sm text-ink-400 italic ${s.sourceRtl ? "text-right" : ""}`}
        >
          {s.sourceText}
        </p>
      )}

      {/* Timing */}
      <div className="flex gap-3 mt-3.5 flex-wrap">
        <TimecodeField
          label="Début"
          value={c.start}
          onCommit={(v) => s.onTiming("start", v)}
        />
        <TimecodeField
          label="Fin"
          value={c.end}
          onCommit={(v) => s.onTiming("end", v)}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-4">
        <RowBtn onClick={s.onRegenerate} disabled={s.regenerating} title="Régénérer la traduction de cette ligne">
          {s.regenerating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          )}
          Régénérer
        </RowBtn>
        <RowBtn onClick={s.onSplit} title="Diviser à la tête de lecture">
          <Scissors className="h-3.5 w-3.5" aria-hidden />
          Diviser
        </RowBtn>
        {s.canMerge && (
          <RowBtn onClick={s.onMerge} title="Fusionner avec la ligne suivante">
            <ArrowDownUp className="h-3.5 w-3.5" aria-hidden />
            Fusionner
          </RowBtn>
        )}
        <RowBtn
          onClick={s.onAdd}
          title="Ajouter une ligne à la tête de lecture (A)"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Ajouter
        </RowBtn>
        <RowBtn onClick={s.onDelete} title="Supprimer cette ligne" danger>
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Supprimer
        </RowBtn>
      </div>
    </div>
  );
}

function RowBtn({
  children,
  onClick,
  disabled,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-sm border text-xs font-semibold transition-colors disabled:opacity-50 ${
        danger
          ? "border-transparent text-ink-500 hover:text-rouge-600 hover:bg-rouge-50"
          : "border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-ivory-50"
      }`}
    >
      {children}
    </button>
  );
}

/** Champ de timecode : saisie libre (mm:ss.cc) + pas de ±0,1 s. */
function TimecodeField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number;
  onCommit: (seconds: number) => void;
}) {
  const [text, setText] = useState(formatTimecode(value));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setText(formatTimecode(value));
  }, [value, editing]);

  const commitText = () => {
    setEditing(false);
    const parsed = parseTimecode(text);
    if (parsed !== null) onCommit(parsed);
    else setText(formatTimecode(value));
  };

  return (
    <div className="flex-1 min-w-[140px]">
      <span className="block font-mono text-[8.5px] uppercase tracking-widest text-ink-400 mb-1">
        {label}
      </span>
      <div className="flex items-stretch border border-ink-200 rounded-sm bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => onCommit(value - 0.1)}
          aria-label={`${label} −0,1 seconde`}
          className="w-10 min-h-[40px] text-ink-500 hover:bg-ivory-100 hover:text-ink-900 text-base font-semibold"
        >
          −
        </button>
        <input
          type="text"
          value={text}
          aria-label={label}
          onFocus={() => setEditing(true)}
          onChange={(e) => setText(e.target.value)}
          onBlur={commitText}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="w-full min-w-0 flex-1 px-1 font-mono text-xs tabular-nums text-ink-900 text-center focus:outline-none"
        />
        <button
          type="button"
          onClick={() => onCommit(value + 0.1)}
          aria-label={`${label} +0,1 seconde`}
          className="w-10 min-h-[40px] text-ink-500 hover:bg-ivory-100 hover:text-ink-900 text-base font-semibold"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Onglet Exporter
// ─────────────────────────────────────────────────────────────────
function ExportTab({ x }: { x: ExportApi }) {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const burnInProgress = x.burnStatus === "queued" || x.burnStatus === "burning";

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-400 mb-3">
        {x.metaLine}
      </p>

      {/* Fichiers de sous-titres */}
      <div className="grid grid-cols-3 gap-2">
        {(["srt", "vtt", "txt"] as const).map((fmt) => (
          <button
            key={fmt}
            onClick={() => x.onExport(fmt)}
            className="min-h-[48px] rounded-sm border-2 border-ink-900 bg-ivory-50 font-mono text-sm font-semibold text-ink-900 hover:bg-ink-900 hover:text-ivory-50 transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />.{fmt}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-2 mt-2">
        {x.canExportPro && (
          <button
            onClick={() => x.onExport("fcpxml")}
            title="Pour DaVinci Resolve, Premiere Pro, Final Cut"
            className="min-h-[48px] rounded-sm border-2 border-encre-500 bg-encre-500 font-mono text-sm font-semibold text-ivory-50 hover:bg-encre-600 transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            .fcpxml, montage
          </button>
        )}
        <button
          onClick={x.onExportAll}
          title="Un .srt + .vtt par langue, regroupés dans un .zip"
          className="min-h-[48px] rounded-sm border-2 border-ink-900 bg-ink-900 font-mono text-sm font-semibold text-ivory-50 hover:bg-ink-800 transition-colors inline-flex items-center justify-center gap-1.5"
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          Toutes les langues (.zip)
        </button>
        <button
          onClick={async () => {
            const ok = await x.onCopyTranscript();
            if (ok) {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }
          }}
          className="min-h-[44px] rounded-sm border border-ivory-300 font-mono text-xs text-ink-600 hover:border-ink-400 hover:text-ink-900 transition-colors inline-flex items-center justify-center gap-1.5"
          title="Copier le texte des sous-titres (pour une description ou une légende)"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-success-600" aria-hidden />
              Copié !
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden />
              Copier le transcript
            </>
          )}
        </button>
      </div>

      {/* MP4 incrusté */}
      {!x.isAudio && (
        <div className="mt-5 pt-4 border-t border-ivory-200">
          <p className="font-mono text-[9px] uppercase tracking-widest text-ink-400 mb-2">
            Vidéo avec sous-titres incrustés
          </p>
          {x.burnStatus === "done" ? (
            <button
              onClick={x.onDownloadBurned}
              className="w-full min-h-[52px] rounded-sm bg-rouge-500 text-ivory-50 font-semibold text-sm hover:bg-rouge-600 transition-colors inline-flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" aria-hidden />
              Télécharger le MP4 sous-titré
            </button>
          ) : burnInProgress ? (
            <div>
              <div className="w-full min-h-[52px] rounded-sm border-2 border-ink-300 text-ink-500 font-semibold text-sm inline-flex items-center justify-center gap-2 tabular-nums">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Génération MP4… {x.burnProgress > 0 ? `${x.burnProgress}%` : ""}
              </div>
              <div className="mt-2.5 h-2 bg-ivory-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rouge-500 transition-all duration-700 ease-out"
                  style={{ width: `${Math.max(3, x.burnProgress)}%` }}
                />
              </div>
              <p className="text-xs text-ink-500 mt-1.5 font-mono">
                Réencodage complet de la vidéo, cela peut prendre quelques
                minutes.
              </p>
            </div>
          ) : (
            <button
              onClick={x.onBurn}
              className="w-full min-h-[52px] rounded-sm border-2 border-ink-900 bg-ivory-50 text-ink-900 font-semibold text-sm hover:bg-ink-900 hover:text-ivory-50 transition-colors inline-flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" aria-hidden />
              {x.burnStatus === "failed"
                ? "Réessayer le MP4"
                : "Générer le MP4 sous-titré"}
            </button>
          )}
          {x.burnStatus === "done" && (
            <p className="text-xs text-ink-500 mt-2 font-mono">
              › le MP4 grave le texte et le style actuels. Régénérez après
              modification pour les répercuter.
            </p>
          )}
        </div>
      )}

      <div className="mt-4 space-y-1">
        <p className="text-xs text-ink-500 font-mono">
          › .srt/.vtt/.txt = la langue affichée ({x.targetLangShort}). Le .zip
          regroupe un fichier par langue.
        </p>
        <p className="text-xs text-ink-500 font-mono">
          › les exports reprennent vos dernières modifications (enregistrées
          automatiquement)
        </p>
        <p className="text-xs text-ink-500 font-mono">
          › le téléchargement ne démarre pas ? Une extension (bloqueur de
          pub/cookies) peut le bloquer, désactivez-la sur cette page, ou
          faites un clic droit → «&nbsp;Enregistrer sous&nbsp;».
        </p>
      </div>

      {/* Suppression */}
      <div className="mt-6 pt-4 border-t border-ivory-200">
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-2 min-h-[40px] text-sm text-ink-500 hover:text-rouge-600 transition-colors"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Supprimer cette vidéo
          </button>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-ink-700">
              Confirmer la suppression ?
            </span>
            <button
              onClick={x.onDeleteVideo}
              disabled={x.deleting}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3 bg-rouge-500 text-ivory-50 rounded-sm text-sm font-semibold hover:bg-rouge-600 disabled:opacity-60"
            >
              {x.deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden />
              )}
              Oui, supprimer
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="min-h-[40px] text-sm text-ink-500 hover:text-ink-900"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
