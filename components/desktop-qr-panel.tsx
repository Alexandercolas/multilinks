import { Smartphone } from "lucide-react";

// Desktop-only: a visitor browsing on a wide screen can scan this to open the
// same profile on their phone. Hidden entirely on small viewports — if you're
// already on mobile there's nothing to scan for.
export function DesktopQrPanel({ qrSvg, url, dark }: { qrSvg: string; url: string; dark: boolean }) {
  const displayUrl = url.replace(/^https?:\/\//, "");
  return (
    <div
      className={`hidden w-48 shrink-0 animate-fade-up flex-col items-center gap-3 rounded-[1.75rem] p-5 text-center lg:flex ${
        dark
          ? "border border-white/12 bg-white/[.04] text-white/70"
          : "border border-black/[.06] bg-white text-ink/70 shadow-[0_1px_2px_rgba(21,21,21,.04),0_12px_32px_-16px_rgba(21,21,21,.16)]"
      }`}
      style={{ animationDelay: "120ms" }}
    >
      <span className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[.1em] ${dark ? "text-white/50" : "text-ink/45"}`}>
        <Smartphone size={13} /> Ver en tu móvil
      </span>
      <span
        className={`grid h-32 w-32 place-items-center rounded-2xl p-2 ${dark ? "bg-white/[.06]" : "bg-cream"}`}
        role="img"
        aria-label={`Código QR para abrir ${displayUrl} en un teléfono`}
        dangerouslySetInnerHTML={{ __html: qrSvg }}
      />
      <span className={`break-all text-[11px] font-semibold ${dark ? "text-white/40" : "text-ink/40"}`}>{displayUrl}</span>
    </div>
  );
}
