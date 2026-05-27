import { ImageResponse } from "next/og";

// Apple touch icon (iOS bookmark / home screen) — 180x180 standard
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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#C46A45",
          borderRadius: 40,
          color: "#FAF7F1",
        }}
      >
        <div
          style={{
            fontSize: 110,
            fontWeight: 800,
            letterSpacing: "-0.05em",
            lineHeight: 1,
          }}
        >
          M
        </div>
        <div
          style={{
            width: 60,
            height: 4,
            background: "#FAF7F1",
            opacity: 0.7,
            borderRadius: 2,
            marginTop: 10,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
