import { ImageResponse } from "next/og";

export const alt = "Maxline Studio — Vos vidéos françaises, sous-titrées en anglais en 10 minutes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          padding: "80px 80px",
          background:
            "linear-gradient(135deg, #FAF7F1 0%, #FBE9E1 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Header avec wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: "#C46A45",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FAF7F1",
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: "-0.05em",
            }}
          >
            M
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "#25241F",
              }}
            >
              MAXLINE
            </div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 300,
                fontStyle: "italic",
                color: "#C46A45",
              }}
            >
              studio
            </div>
          </div>
        </div>

        {/* Headline central */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 32,
          }}
        >
          <div
            style={{
              fontSize: 76,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#25241F",
              lineHeight: 1.05,
              maxWidth: 1000,
            }}
          >
            Vos vidéos françaises,
            <br />
            sous-titrées en{" "}
            <span style={{ color: "#C46A45" }}>anglais</span>
            <br />
            en 10 minutes.
          </div>

          <div
            style={{
              fontSize: 28,
              color: "#4F4E48",
              maxWidth: 900,
            }}
          >
            L'outil de sous-titrage vidéo pour créateurs YouTube et TikTok, en
            français, à 12 €/mois.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#4F4E48",
            fontSize: 22,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                background: "#C46A45",
              }}
            />
            <span style={{ fontWeight: 600 }}>maxlinestudio.fr</span>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            <span>🇫🇷 Français natif</span>
            <span>🔒 RGPD &amp; UE</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
