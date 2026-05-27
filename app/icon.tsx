import { ImageResponse } from "next/og";

// Generated icon for the browser tab — sizes 32x32 (Next.js default)
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
          background: "#C46A45",
          borderRadius: 7,
          color: "#FAF7F1",
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: "-0.05em",
        }}
      >
        M
      </div>
    ),
    { ...size },
  );
}
