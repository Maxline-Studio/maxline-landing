import { ImageResponse } from "next/og";

// Favicon 32x32 — signature Maxline : M ink sur ivory avec point rouge en exposant
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 4,
          color: "#1A1814",
          fontSize: 24,
          fontWeight: 900,
          letterSpacing: "-0.05em",
          position: "relative",
          fontFamily: "Georgia, serif",
        }}
      >
        <span style={{ display: "flex", lineHeight: 1, marginRight: 2 }}>M</span>
        <span
          style={{
            position: "absolute",
            right: 4,
            top: 6,
            width: 5,
            height: 5,
            borderRadius: 3,
            background: "#C8392F",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
