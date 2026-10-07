import "server-only";
import QRCode from "qrcode";

/**
 * Server-rendered QR SVG for sharing on desktop and in the mobile dialog. Nothing
 * is sent to a third-party QR service — the code is generated in our own
 * process from the URL we already show on the page.
 */
export async function generateProfileQr(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    margin: 4,
    errorCorrectionLevel: "M",
    color: {
      dark: "#151515",
      light: "#ffffff",
    },
  });
}
