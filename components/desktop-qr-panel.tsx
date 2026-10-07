import type { ReactNode } from "react";
export function ProfileQr({
  qrSvg,
  title,
  large = false,
}: {
  qrSvg: string;
  title: string;
  large?: boolean;
}) {
  return (
    <div
      role="img"
      aria-label={`Código QR del perfil de ${title}`}
      className={`${large ? "h-56 w-56" : "h-28 w-28"} shrink-0 overflow-hidden rounded-xl bg-white [&_svg]:block [&_svg]:h-full [&_svg]:w-full`}
      dangerouslySetInnerHTML={{ __html: qrSvg }}
    />
  );
}
export function DesktopQrPanel({
  qrSvg,
  url,
  title,
  children,
}: {
  qrSvg: string;
  url: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <aside
      aria-label="Compartir perfil en escritorio"
      className="hidden lg:block"
    >
      <h2 className="text-sm font-semibold">Compartir perfil</h2>
      <div className="mt-5">
        <ProfileQr qrSvg={qrSvg} title={title} />
      </div>
      <p className="mt-3 max-w-[180px] text-xs leading-5 opacity-80">
        Escanea para abrir este perfil en tu móvil.
      </p>
      <p className="mt-4 break-all text-xs leading-5 opacity-80">
        {url.replace(/^https?:\/\//, "")}
      </p>
      <div className="mt-5 space-y-2">{children}</div>
    </aside>
  );
}
