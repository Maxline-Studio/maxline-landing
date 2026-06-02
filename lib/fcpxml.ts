/**
 * Génération d'un fichier FCPXML (Final Cut Pro XML, v1.10) à partir des
 * sous-titres. Format d'interchange importé par DaVinci Resolve, Adobe Premiere
 * Pro et Final Cut Pro — les sous-titres arrivent comme éléments `caption` sur
 * une piste dédiée, calés sur les timecodes.
 *
 * Choix de fiabilité : un seul FCPXML couvre les 3 logiciels (le « .xml »
 * Premiere legacy gère mal les captions). On produit un projet minimal mais
 * valide : ressources (format), une sequence, et un trou (gap) portant les
 * captions aux bons offsets.
 */
import type { SubtitleSegment } from "@/lib/subtitles";

/** Échappe le texte pour XML. */
function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Convertit des secondes en valeur temporelle rationnelle FCPXML ("N/Ds"), sur
 * une base de timebase (défaut 600, compatible la plupart des cadences). FCPXML
 * exige des temps rationnels dont le dénominateur est le timebase.
 */
function fcpTime(seconds: number, timebase = 600): string {
  const frames = Math.round(Math.max(0, seconds) * timebase);
  return `${frames}/${timebase}s`;
}

export function buildFcpxml(
  segments: SubtitleSegment[],
  opts: { title?: string; fps?: number } = {},
): string {
  const timebase = 600;
  const title = xmlEscape(opts.title || "Maxline Studio");
  const fps = opts.fps && opts.fps > 0 ? opts.fps : 25;
  // Durée totale = fin du dernier sous-titre (au moins 1 s).
  const totalSeconds = Math.max(
    1,
    ...segments.map((s) => s.end || 0),
  );
  const totalDur = fcpTime(totalSeconds, timebase);

  // frameDuration du format (ex. 1/25s pour 25 fps).
  const frameDuration = `${Math.round(timebase / fps)}/${timebase}s`;

  const captions = segments
    .filter((s) => s.text && s.text.trim() && s.end > s.start)
    .map((s, i) => {
      const start = fcpTime(s.start, timebase);
      const dur = fcpTime(Math.max(0.1, s.end - s.start), timebase);
      const text = xmlEscape(s.text.replace(/\r?\n/g, "\n"));
      const styleId = `ts${i + 1}`;
      return (
        `        <caption lane="1" offset="${start}" name="${`Sous-titre ${i + 1}`}" duration="${dur}" role="iTT?captionFormat=ITT.fr">\n` +
        `          <text>\n` +
        `            <text-style ref="${styleId}">${text}</text-style>\n` +
        `          </text>\n` +
        `          <text-style-def id="${styleId}">\n` +
        `            <text-style font="Helvetica" fontSize="48" alignment="center"/>\n` +
        `          </text-style-def>\n` +
        `        </caption>`
      );
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.10">
  <resources>
    <format id="r1" name="FFVideoFormat1080p${fps}" frameDuration="${frameDuration}" width="1920" height="1080"/>
  </resources>
  <library>
    <event name="${title}">
      <project name="${title}">
        <sequence format="r1" duration="${totalDur}" tcStart="0/1s" tcFormat="NDF">
          <spine>
            <gap name="Gap" offset="0/1s" duration="${totalDur}" start="0/1s">
${captions}
            </gap>
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>
`;
}
