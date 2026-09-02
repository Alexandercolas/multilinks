import "server-only";

import net from "node:net";
import { lookup } from "node:dns/promises";

// IPv4 ranges that must never be reachable from a server-side fetch:
// loopback, private, link-local, CGNAT, TEST-NET, multicast, reserved.
const BLOCKED_V4: RegExp[] = [
  /^0\./,
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^192\.0\.0\./,
  /^192\.0\.2\./,
  /^198\.51\.100\./,
  /^203\.0\.113\./,
  /^198\.1[89]\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^(22[4-9]|23\d|24\d|25[0-5])\./,
];

function isBlockedIp(address: string): boolean {
  if (net.isIPv4(address)) {
    return BLOCKED_V4.some((range) => range.test(address));
  }
  if (net.isIPv6(address)) {
    const value = address.toLowerCase();
    if (value === "::1" || value === "::") return true;
    if (value.startsWith("fe80:") || value.startsWith("fc") || value.startsWith("fd")) return true;
    const mapped = value.match(/(?:::ffff:)(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return BLOCKED_V4.some((range) => range.test(mapped[1]));
    return false;
  }
  return true;
}

export class SsrfError extends Error {}

/** Throws SsrfError if the URL is not a public http(s) endpoint. Returns the parsed URL. */
export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new SsrfError("URL inválida");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new SsrfError("Protocolo no permitido");
  }
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".lan")
  ) {
    throw new SsrfError("Host no permitido");
  }
  if (net.isIP(host)) {
    if (isBlockedIp(host)) throw new SsrfError("Dirección no permitida");
    return url;
  }
  const records = await lookup(host, { all: true }).catch(() => [] as { address: string }[]);
  if (!records.length) throw new SsrfError("No se pudo resolver el host");
  if (records.some((record) => isBlockedIp(record.address))) {
    throw new SsrfError("Dirección no permitida");
  }
  return url;
}

type FetchOptions = {
  accept: string;
  maxBytes: number;
  timeoutMs: number;
  maxRedirects?: number;
};

/**
 * Fetch a public URL and return the raw bytes (for images). Same SSRF
 * re-validation on every redirect hop, capped body, and timeout as
 * fetchPublicUrl, but it never decodes the payload as text.
 */
export async function fetchPublicBinary(
  raw: string,
  { accept, maxBytes, timeoutMs, maxRedirects = 3 }: FetchOptions,
): Promise<{ url: string; contentType: string; bytes: Uint8Array }> {
  let current = await assertPublicUrl(raw);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    for (let hop = 0; hop <= maxRedirects; hop += 1) {
      const response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          accept,
          "user-agent": "MultiLinksBot/1.0 (+https://multilinksrd.vercel.app)",
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || hop === maxRedirects) throw new SsrfError("Demasiadas redirecciones");
        current = await assertPublicUrl(new URL(location, current).toString());
        continue;
      }
      if (!response.ok) throw new SsrfError(`Respuesta ${response.status}`);

      const declared = Number(response.headers.get("content-length") ?? "0");
      if (declared && declared > maxBytes) throw new SsrfError("Respuesta demasiado grande");

      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      if (reader) {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          received += value.byteLength;
          if (received > maxBytes) {
            await reader.cancel();
            throw new SsrfError("Respuesta demasiado grande");
          }
          chunks.push(value);
        }
      }
      const bytes = new Uint8Array(received);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return {
        url: current.toString(),
        contentType: response.headers.get("content-type") ?? "",
        bytes,
      };
    }
    throw new SsrfError("Demasiadas redirecciones");
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch a public URL for metadata scraping. Every redirect hop is re-validated
 * against the SSRF blocklist, the body is capped, and the request times out.
 */
export async function fetchPublicUrl(
  raw: string,
  { accept, maxBytes, timeoutMs, maxRedirects = 3 }: FetchOptions,
): Promise<{ url: string; contentType: string; body: string }> {
  let current = await assertPublicUrl(raw);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    for (let hop = 0; hop <= maxRedirects; hop += 1) {
      const response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          accept,
          "user-agent": "MultiLinksBot/1.0 (+https://multilinksrd.vercel.app)",
          "accept-language": "es,en;q=0.8",
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || hop === maxRedirects) throw new SsrfError("Demasiadas redirecciones");
        current = await assertPublicUrl(new URL(location, current).toString());
        continue;
      }
      if (!response.ok) throw new SsrfError(`Respuesta ${response.status}`);

      const declared = Number(response.headers.get("content-length") ?? "0");
      if (declared && declared > maxBytes) throw new SsrfError("Respuesta demasiado grande");

      const reader = response.body?.getReader();
      if (!reader) return { url: current.toString(), contentType: response.headers.get("content-type") ?? "", body: "" };
      const chunks: Uint8Array[] = [];
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        if (received > maxBytes) {
          await reader.cancel();
          break;
        }
        chunks.push(value);
      }
      const merged = new Uint8Array(received > maxBytes ? maxBytes : received);
      let offset = 0;
      for (const chunk of chunks) {
        if (offset + chunk.byteLength > merged.length) {
          merged.set(chunk.subarray(0, merged.length - offset), offset);
          break;
        }
        merged.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return {
        url: current.toString(),
        contentType: response.headers.get("content-type") ?? "",
        body: new TextDecoder("utf-8").decode(merged),
      };
    }
    throw new SsrfError("Demasiadas redirecciones");
  } finally {
    clearTimeout(timer);
  }
}
