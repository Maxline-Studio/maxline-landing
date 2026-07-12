"use client";

/**
 * Onglet « Style » de l'inspecteur : presets un-tap + tous les réglages du
 * style des sous-titres (miroir de lib/subtitle-style.ts — NE PAS diverger du
 * worker). Repris du panneau de l'ancien éditeur, réorganisé pour l'inspecteur.
 */
import {
  subtitleColorHex,
  FONT_OPTIONS,
  COLOR_OPTIONS,
  SIZE_OPTIONS,
  SPEAKER_MODE_OPTIONS,
  POSITION_OPTIONS,
  OUTLINE_WIDTH_OPTIONS,
  BG_OPACITY_OPTIONS,
  ANIMATION_OPTIONS,
  HIGHLIGHT_OPTIONS,
  type SubtitleStyle,
} from "@/lib/subtitle-style";

/**
 * Presets : un tap règle TOUT le style d'un coup (au lieu de 12 réglages).
 * Uniquement des champs du contrat SubtitleStyle existant → rien à répliquer
 * côté worker, le burn MP4 les grave déjà tels quels.
 */
export const STYLE_PRESETS: {
  id: string;
  name: string;
  desc: string;
  patch: Partial<SubtitleStyle>;
}[] = [
  {
    id: "atelier",
    name: "Atelier",
    desc: "fond noir, sobre",
    patch: {
      font: "inter", size: "m", mode: "background", color: "black",
      textColor: "auto", position: "bottom", bold: false, italic: false,
      uppercase: false, bgOpacity: "full", shadow: false,
      animation: "none", highlight: "jaune",
    },
  },
  {
    id: "reels",
    name: "Reels",
    desc: "punchy, mot actif",
    patch: {
      font: "anton", size: "l", mode: "outline", color: "black",
      textColor: "white", position: "center", bold: true, italic: false,
      uppercase: true, outlineWidth: "thick", shadow: true,
      animation: "word", highlight: "jaune",
    },
  },
  {
    id: "cinema",
    name: "Cinéma",
    desc: "contour fin, serif",
    patch: {
      font: "fraunces", size: "m", mode: "outline", color: "black",
      textColor: "white", position: "bottom", bold: false, italic: false,
      uppercase: false, outlineWidth: "thin", shadow: true,
      animation: "none", highlight: "blanc",
    },
  },
  {
    id: "karaoke",
    name: "Karaoké",
    desc: "remplissage fluide",
    patch: {
      font: "montserrat", size: "l", mode: "background", color: "black",
      textColor: "white", position: "bottom", bold: true, italic: false,
      uppercase: false, bgOpacity: "medium", shadow: false,
      animation: "fill", highlight: "jaune",
    },
  },
];

/** Le style courant correspond-il exactement à un preset ? (état actif) */
function presetActive(style: SubtitleStyle, patch: Partial<SubtitleStyle>): boolean {
  return (Object.keys(patch) as (keyof SubtitleStyle)[]).every(
    (k) => style[k] === patch[k],
  );
}

const chipCls = (active: boolean) =>
  `min-h-[38px] px-3 py-1.5 rounded-sm border text-xs font-medium transition-colors ${
    active
      ? "border-rouge-500 bg-rouge-50 text-ink-900"
      : "border-ivory-300 text-ink-600 hover:border-ink-400"
  }`;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block font-mono text-[9px] uppercase tracking-widest text-ink-400 mb-1.5">
      {children}
    </span>
  );
}

function Swatch({
  hex,
  label,
  active,
  onClick,
}: {
  hex: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`h-8 w-8 rounded-full border-2 transition-transform ${
        active ? "border-ink-900 scale-110" : "border-ivory-300 hover:scale-105"
      }`}
      style={{ backgroundColor: hex }}
    />
  );
}

export function StylePanel({
  style,
  onChange,
  multiSpeaker,
}: {
  style: SubtitleStyle;
  onChange: (patch: Partial<SubtitleStyle>) => void;
  multiSpeaker?: boolean;
}) {
  return (
    <div className="space-y-5">
      {/* Presets */}
      <div>
        <FieldLabel>Presets — un tap, tout est réglé</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          {STYLE_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => onChange(p.patch)}
              aria-pressed={presetActive(style, p.patch)}
              className={`rounded-sm border p-2.5 text-left transition-colors ${
                presetActive(style, p.patch)
                  ? "border-rouge-500 bg-rouge-50"
                  : "border-ivory-300 bg-ivory-50 hover:border-ink-400"
              }`}
            >
              <span className="block font-display text-sm text-ink-900">
                {p.name}
              </span>
              <span className="block text-[10px] text-ink-500 mt-0.5">
                {p.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Police */}
      <div>
        <FieldLabel>Police</FieldLabel>
        <div className="flex flex-wrap gap-1.5">
          {FONT_OPTIONS.map((f) => (
            <button
              key={f.id}
              onClick={() => onChange({ font: f.id })}
              style={{ fontFamily: `var(--font-${f.id})` }}
              className={chipCls(style.font === f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-8 flex-wrap">
        <div>
          <FieldLabel>Style</FieldLabel>
          <div className="flex gap-1.5">
            <button
              onClick={() => onChange({ mode: "background" })}
              className={chipCls(style.mode === "background")}
            >
              Fond
            </button>
            <button
              onClick={() => onChange({ mode: "outline" })}
              className={chipCls(style.mode === "outline")}
            >
              Contour
            </button>
          </div>
        </div>
        <div>
          <FieldLabel>Taille</FieldLabel>
          <div className="flex gap-1.5">
            {SIZE_OPTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => onChange({ size: s.id })}
                className={chipCls(style.size === s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Couleur fond/contour */}
      <div>
        <FieldLabel>
          Couleur du {style.mode === "background" ? "fond" : "contour"}
        </FieldLabel>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => (
            <Swatch
              key={c.id}
              hex={subtitleColorHex(c.id)}
              label={c.label}
              active={style.color === c.id}
              onClick={() => onChange({ color: c.id })}
            />
          ))}
        </div>
      </div>

      {/* Couleur du texte */}
      <div>
        <FieldLabel>Couleur du texte</FieldLabel>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onChange({ textColor: "auto" })}
            className={chipCls(style.textColor === "auto")}
          >
            Auto
          </button>
          {COLOR_OPTIONS.map((c) => (
            <Swatch
              key={c.id}
              hex={subtitleColorHex(c.id)}
              label={`Texte ${c.label}`}
              active={style.textColor === c.id}
              onClick={() => onChange({ textColor: c.id })}
            />
          ))}
        </div>
      </div>

      {/* Position + effets */}
      <div className="flex gap-8 flex-wrap">
        <div>
          <FieldLabel>Position</FieldLabel>
          <div className="flex gap-1.5">
            {POSITION_OPTIONS.map((p) => (
              <button
                key={p.id}
                onClick={() => onChange({ position: p.id })}
                className={chipCls(style.position === p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <FieldLabel>Effets</FieldLabel>
          <div className="flex gap-1.5">
            <button
              onClick={() => onChange({ bold: !style.bold })}
              className={chipCls(style.bold)}
              style={{ fontWeight: 800 }}
            >
              Gras
            </button>
            <button
              onClick={() => onChange({ italic: !style.italic })}
              className={chipCls(style.italic)}
              style={{ fontStyle: "italic" }}
            >
              Italique
            </button>
            <button
              onClick={() => onChange({ uppercase: !style.uppercase })}
              className={chipCls(style.uppercase)}
              title="Tout en majuscules"
            >
              ABC
            </button>
          </div>
        </div>
      </div>

      {/* Lisibilité */}
      <div className="flex gap-8 flex-wrap">
        {style.mode === "outline" ? (
          <div>
            <FieldLabel>Épaisseur du contour</FieldLabel>
            <div className="flex gap-1.5">
              {OUTLINE_WIDTH_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => onChange({ outlineWidth: o.id })}
                  className={chipCls(style.outlineWidth === o.id)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <FieldLabel>Opacité du fond</FieldLabel>
            <div className="flex gap-1.5">
              {BG_OPACITY_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => onChange({ bgOpacity: o.id })}
                  className={chipCls(style.bgOpacity === o.id)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <FieldLabel>Ombre</FieldLabel>
          <button
            onClick={() => onChange({ shadow: !style.shadow })}
            className={chipCls(style.shadow)}
          >
            {style.shadow ? "Activée" : "Désactivée"}
          </button>
        </div>
      </div>

      {/* Karaoké */}
      <div>
        <FieldLabel>Animation (karaoké)</FieldLabel>
        <div className="flex flex-wrap gap-1.5">
          {ANIMATION_OPTIONS.map((o) => (
            <button
              key={o.id}
              onClick={() => onChange({ animation: o.id })}
              className={chipCls(style.animation === o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
        {style.animation !== "none" && (
          <div className="mt-2.5">
            <FieldLabel>Couleur de surlignage</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {HIGHLIGHT_OPTIONS.map((c) => (
                <Swatch
                  key={c.id}
                  hex={c.hex}
                  label={`Surlignage ${c.label}`}
                  active={style.highlight === c.id}
                  onClick={() => onChange({ highlight: c.id })}
                />
              ))}
            </div>
            <p className="mt-1.5 font-mono text-[9px] text-ink-400">
              Le mot prononcé est surligné au fil de la lecture · gravé aussi dans le MP4.
            </p>
          </div>
        )}
      </div>

      {/* Distinction des voix */}
      {multiSpeaker && (
        <div>
          <FieldLabel>Distinction des voix</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {SPEAKER_MODE_OPTIONS.map((o) => (
              <button
                key={o.id}
                onClick={() => onChange({ speakerMode: o.id })}
                className={chipCls(style.speakerMode === o.id)}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 font-mono text-[9px] text-ink-400">
            Plusieurs voix détectées · chaque voix est déjà sur sa propre ligne.
          </p>
        </div>
      )}
    </div>
  );
}
