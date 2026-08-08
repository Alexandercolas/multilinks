import { ImageResponse } from "next/og";

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
          background: "#151515",
          borderRadius: 7,
        }}
      >
        <div style={{ color: "#c9ff58", fontSize: 18, fontWeight: 900 }}>M</div>
      </div>
    ),
    size,
  );
}
