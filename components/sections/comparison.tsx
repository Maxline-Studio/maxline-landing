import { Check, X, Minus, Star } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { HandUnderline } from "@/components/hand-underline";

/**
 * Comparatif — Maxline face à 4 concurrents réels. Critères factuels et
 * défendables (on ne dénigre pas, on ne chiffre pas la "précision" des autres).
 * La ligne "Langues" reconnaît honnêtement la largeur des concurrents : un
 * tableau où Maxline gagnerait tout sonnerait faux.
 *
 * Tarifs publics observés en mai 2026 (offres payantes d'entrée) — susceptibles
 * d'évoluer ; à revérifier avant toute campagne.
 */

type Cell = { kind: "yes" | "no" | "partial" } | { kind: "text"; value: string };

const COMPETITORS = ["Submagic", "VEED", "Kapwing", "Maestra"] as const;

type Row = { label: string; maxline: Cell; others: [Cell, Cell, Cell, Cell] };

const yes: Cell = { kind: "yes" };
const no: Cell = { kind: "no" };
const partial: Cell = { kind: "partial" };
const txt = (value: string): Cell => ({ kind: "text", value });

const ROWS: Row[] = [
  {
    label: "Spécialisé créateurs francophones (FR → EN)",
    maxline: yes,
    others: [no, no, no, no],
  },
  {
    label: "Traduit le sens et les expressions FR (pas du mot-à-mot)",
    maxline: yes,
    others: [partial, partial, partial, partial],
  },
  {
    label: "Conçu et opéré par un francophone natif",
    maxline: yes,
    others: [no, no, no, no],
  },
  {
    label: "Hébergé et supporté en France (UE · RGPD)",
    maxline: yes,
    others: [no, no, no, no],
  },
  {
    label: "Support humain, en français",
    maxline: yes,
    others: [no, no, no, no],
  },
  {
    label: "Tarif d'entrée",
    maxline: txt("12 €/mois"),
    others: [txt("dès ~14 $"), txt("dès ~24 $"), txt("dès ~16 $"), txt("dès ~23 $")],
  },
  {
    label: "Langues couvertes",
    maxline: txt("FR → EN, à la perfection"),
    others: [txt("50+"), txt("125+"), txt("100+"), txt("125+")],
  },
  {
    label: "Un artisan indépendant, pas un grand groupe",
    maxline: yes,
    others: [no, no, no, no],
  },
];

function CellView({ cell, highlight }: { cell: Cell; highlight?: boolean }) {
  if (cell.kind === "text") {
    return (
      <span
        className={`font-mono text-xs md:text-sm tabular-nums ${
          highlight ? "text-ink-900 font-bold" : "text-ink-500"
        }`}
      >
        {cell.value}
      </span>
    );
  }
  if (cell.kind === "yes") {
    return (
      <span
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${
          highlight ? "bg-rouge-500 text-ivory-50" : "bg-ivory-200 text-ink-700"
        }`}
        aria-label="Oui"
      >
        <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
      </span>
    );
  }
  if (cell.kind === "partial") {
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-ivory-100 text-ink-400 border border-ivory-300"
        aria-label="Partiel"
      >
        <Minus className="h-4 w-4" aria-hidden />
      </span>
    );
  }
  return (
    <span
      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-ivory-100 text-ink-300"
      aria-label="Non"
    >
      <X className="h-4 w-4" aria-hidden />
    </span>
  );
}

export function Comparison() {
  return (
    <section
      id="comparatif"
      className="relative py-24 md:py-36 bg-ivory-50 border-y border-ivory-200 overflow-hidden"
    >
      <div className="absolute inset-0 paper-grain pointer-events-none" aria-hidden />

      <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8 relative">
        <Reveal>
          <div className="max-w-3xl mb-12 md:mb-16">
            <div className="flex items-center gap-3 mb-6">
              <span className="annotation">§04 · Le comparatif</span>
            </div>
            <h2 className="font-display font-medium text-4xl md:text-5xl lg:text-6xl text-ink-900 leading-[1.05] tracking-[-0.02em]">
              Le match,{" "}
              <span className="font-display italic font-light">
                <HandUnderline variant="rouge" style="straight">
                  en toute transparence
                </HandUnderline>
              </span>
              .
            </h2>
            <p className="mt-6 text-lg text-ink-700 leading-relaxed">
              Les autres outils sont excellents pour faire un peu de tout, dans
              toutes les langues. Maxline fait <em>une</em> chose — traduire le
              français en anglais, vraiment bien — pour les créateurs
              francophones.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          {/* Indice de défilement (mobile) */}
          <p className="md:hidden text-center font-mono text-[10px] uppercase tracking-widest text-ink-400 mb-3">
            ‹ faites défiler le tableau ›
          </p>

          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <table className="w-full min-w-[680px] border-collapse">
              <thead>
                <tr>
                  <th className="w-[34%] text-left align-bottom pb-4" />
                  <th className="align-bottom pb-4 px-2">
                    <div className="flex flex-col items-center gap-2">
                      <span className="inline-flex items-center gap-1 bg-rouge-500 text-ivory-50 px-2.5 py-1 rounded-sm font-mono text-[9px] font-bold uppercase tracking-widest">
                        <Star className="h-3 w-3" aria-hidden /> 1ʳᵉ position
                      </span>
                      <span className="font-display font-black text-xl text-ink-900">
                        Maxline
                      </span>
                    </div>
                  </th>
                  {COMPETITORS.map((c) => (
                    <th key={c} className="align-bottom pb-4 px-2">
                      <span className="font-display font-medium text-base text-ink-500">
                        {c}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, i) => (
                  <tr
                    key={row.label}
                    className={i % 2 === 0 ? "bg-ivory-100/60" : ""}
                  >
                    <td className="py-3.5 pr-4 text-sm md:text-[15px] text-ink-800 font-medium align-middle">
                      {row.label}
                    </td>
                    <td className="py-3.5 px-2 text-center align-middle bg-rouge-50 border-x-2 border-rouge-500/30">
                      <CellView cell={row.maxline} highlight />
                    </td>
                    {row.others.map((cell, j) => (
                      <td key={j} className="py-3.5 px-2 text-center align-middle">
                        <CellView cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <p className="mt-6 text-xs text-ink-400 max-w-3xl leading-relaxed">
            Tarifs publics d&apos;entrée observés en mai 2026 (facturation
            annuelle), susceptibles d&apos;évoluer. Comparatif établi de bonne
            foi sur des critères factuels ; les autres outils restent
            d&apos;excellents produits, simplement pensés pour un autre usage.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
