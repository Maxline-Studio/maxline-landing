import { ImageResponse } from "next/og";

export const alt =
  "Maxline Studio — Vos vidéos françaises, sous-titrées en anglais en 10 minutes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const IVORY = "#F8F4E9";
const INK = "#1A1814";
const ROUGE = "#C8392F";
const INK_500 = "#5C5247";

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
          background: IVORY,
          fontFamily: "Georgia, serif",
          color: INK,
          position: "relative",
        }}
      >
        {/* Filet rouge en haut */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: ROUGE,
            display: "flex",
          }}
        />

        {/* Header avec logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                position: "relative",
              }}
            >
              <span
                style={{
                  fontSize: 44,
                  fontWeight: 900,
                  color: INK,
                  letterSpacing: "-0.02em",
                  display: "flex",
                }}
              >
                Maxline
              </span>
              <span
                style={{
                  position: "absolute",
                  right: -10,
                  top: 4,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  background: ROUGE,
                  display: "flex",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "0.25em",
                color: INK_500,
                textTransform: "uppercase",
                borderLeft: `1px solid ${INK_500}`,
                paddingLeft: 16,
                marginLeft: 16,
                display: "flex",
              }}
            >
              studio
            </span>
          </div>

          {/* Tag annotation */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: ROUGE,
              color: IVORY,
              padding: "8px 14px",
              borderRadius: 3,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontFamily: "monospace",
            }}
          >
            §00 · Sous-titrage vidéo
          </div>
        </div>

        {/* Headline central */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 92,
              fontWeight: 500,
              letterSpacing: "-0.025em",
              color: INK,
              lineHeight: 0.98,
              maxWidth: 1050,
            }}
          >
            <div style={{ display: "flex" }}>Vos vidéos françaises,</div>
            <div style={{ display: "flex" }}>sous-titrées en</div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 4,
                fontStyle: "italic",
                fontWeight: 300,
              }}
            >
              <span style={{ display: "flex", color: ROUGE }}>anglais</span>
              <span style={{ display: "flex", color: INK }}>.</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: INK_500,
              maxWidth: 900,
              marginTop: 16,
              fontFamily: "system-ui",
            }}
          >
            L&apos;outil de sous-titrage vidéo pour créateurs YouTube et
            TikTok, en français, à 12 €/mois. Sans piège.
          </div>
        </div>

        {/* Pied de page */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 20,
            borderTop: `1px solid ${INK_500}`,
            color: INK_500,
            fontSize: 18,
            fontFamily: "monospace",
            textTransform: "uppercase",
            letterSpacing: "0.18em",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                background: ROUGE,
                display: "flex",
              }}
            />
            <div style={{ display: "flex", color: INK, fontWeight: 700 }}>
              maxlinestudio.fr
            </div>
          </div>
          <div
            style={{ display: "flex", gap: 28, fontSize: 16, color: INK_500 }}
          >
            <div style={{ display: "flex" }}>FR → EN · 12 €/mois</div>
            <div style={{ display: "flex", color: ROUGE }}>RGPD · UE</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
