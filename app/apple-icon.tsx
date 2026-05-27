import { ImageResponse } from "next/og";

// Apple touch icon (iOS bookmark / home screen) — 180x180
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8F4E9",
          borderRadius: 38,
          color: "#1A1814",
          position: "relative",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Filet rouge en haut (signature filet du correcteur) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "#C8392F",
            borderTopLeftRadius: 38,
            borderTopRightRadius: 38,
            display: "flex",
          }}
        />

        <span
          style={{
            fontSize: 124,
            fontWeight: 900,
            letterSpacing: "-0.05em",
            lineHeight: 1,
            display: "flex",
            marginRight: 8,
          }}
        >
          M
        </span>

        {/* Point rouge en exposant — signature de marque */}
        <span
          style={{
            position: "absolute",
            top: 38,
            right: 38,
            width: 14,
            height: 14,
            borderRadius: 7,
            background: "#C8392F",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
