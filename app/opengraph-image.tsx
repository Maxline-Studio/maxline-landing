import { ImageResponse } from "next/og";

export const alt =
  "Maxline Studio — Vos vidéos françaises, sous-titrées en anglais en 10 minutes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0E1110";
const LIME = "#C7FF3C";
const PAPER = "#F1ECDF";
const NEUTRAL_400 = "#777771";
const NEUTRAL_700 = "#25251F";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px 80px",
          background: INK,
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: PAPER,
          position: "relative",
        }}
      >
        {/* Subtile grille en fond */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.08,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            display: "flex",
          }}
        />

        {/* Bande timecode supérieure */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          {/* Logo slate */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 64,
                height: 64,
                background: INK,
                border: `3px solid ${LIME}`,
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: LIME,
                fontSize: 42,
                fontWeight: 800,
                letterSpacing: "-0.04em",
              }}
            >
              M
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 36,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  color: PAPER,
                  textTransform: "uppercase",
                }}
              >
                Maxline
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.25em",
                  color: NEUTRAL_400,
                  textTransform: "uppercase",
                }}
              >
                studio
              </div>
            </div>
          </div>

          {/* Tag timecode REC */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: LIME,
              color: INK,
              padding: "8px 14px",
              borderRadius: 2,
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontFamily: "monospace",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                background: INK,
                display: "flex",
              }}
            />
            REC · v.0 PRÉ-LANCEMENT
          </div>
        </div>

        {/* Headline central */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 88,
              fontWeight: 800,
              letterSpacing: "-0.035em",
              color: PAPER,
              lineHeight: 0.98,
              maxWidth: 1050,
            }}
          >
            <div style={{ display: "flex" }}>Vos vidéos françaises,</div>
            <div style={{ display: "flex" }}>sous-titrées en</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <div
                style={{
                  display: "flex",
                  background: LIME,
                  color: INK,
                  padding: "0 16px",
                }}
              >
                anglais
              </div>
              <div style={{ display: "flex", color: PAPER }}>.</div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: NEUTRAL_400,
              maxWidth: 900,
              marginTop: 16,
            }}
          >
            L&apos;outil de sous-titrage vidéo pour créateurs YouTube et
            TikTok, en français, à 12 €/mois. Sans piège.
          </div>
        </div>

        {/* Bande de pied façon timecode strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 20,
            borderTop: `2px solid ${NEUTRAL_700}`,
            color: NEUTRAL_400,
            fontSize: 20,
            fontFamily: "monospace",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                background: LIME,
                display: "flex",
              }}
            />
            <div style={{ display: "flex", color: PAPER, fontWeight: 700 }}>
              maxlinestudio.fr
            </div>
          </div>
          <div
            style={{ display: "flex", gap: 28, fontSize: 18, color: NEUTRAL_400 }}
          >
            <div style={{ display: "flex" }}>00:00 / 10:00 · FR → EN</div>
            <div style={{ display: "flex", color: LIME }}>RGPD · UE</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
