import "server-only";
import QRCode from "qrcode";

/**
 * Server-rendered QR SVG for the "view on your phone" desktop panel. Nothing
 * is sent to a third-party QR service — the code is generated in our own
 * process from the URL we already show on the page.
 */
export async function generateProfileQr(url: string, dark: boolean): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    margin: 0,
    color: {
      dark: dark ? "#ffffff" : "#151515",
      light: "#00000000",
    },
  });
}
