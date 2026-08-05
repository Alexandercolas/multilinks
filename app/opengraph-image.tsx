import { ImageResponse } from "next/og";

export const alt = "MultiLinks — Todos tus enlaces en un solo lugar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f6ef", color: "#151515", padding: 72 }}>
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", border: "6px solid #151515", borderRadius: 40, padding: 62, boxShadow: "18px 18px 0 #c9ff58", background: "#8566ff", color: "white" }}>
        <div style={{ display: "flex", fontSize: 34, fontWeight: 900 }}>MULTI//LINKS</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 82, fontWeight: 900, lineHeight: 1 }}>Todo lo tuyo.</div>
          <div style={{ display: "flex", fontSize: 82, fontWeight: 900, lineHeight: 1, color: "#c9ff58" }}>Un solo link.</div>
        </div>
        <div style={{ display: "flex", fontSize: 28 }}>Crea, personaliza y comparte tu página gratis.</div>
      </div>
    </div>,
    size,
  );
}
