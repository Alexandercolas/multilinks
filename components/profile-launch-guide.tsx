"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Copy, Eye } from "lucide-react";

export function ProfileLaunchGuide({
  identityReady,
  linkReady,
  publishedUsername,
  busy,
  onAddLink,
  onPublish,
}: {
  identityReady: boolean;
  linkReady: boolean;
  publishedUsername: string | null;
  busy: boolean;
  onAddLink: () => void;
  onPublish: () => void;
}) {
  const [origin, setOrigin] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(
    () => setOrigin(process.env.NEXT_PUBLIC_APP_URL || window.location.origin),
    [],
  );
  const url =
    publishedUsername && origin
      ? `${origin.replace(/\/$/, "")}/${encodeURIComponent(publishedUsername)}`
      : "";
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Enlace copiado. Tu perfil está listo para compartir.");
    } catch {
      setNotice("Selecciona y copia tu URL pública en el campo de arriba.");
    }
  }
  const action =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold";
  return (
    <section
      aria-label="Publicación del perfil"
      className="mb-6 rounded-2xl border border-lime/25 bg-card p-5 sm:p-6"
    >
      <h2 className="text-lg font-bold">
        {publishedUsername
          ? "Tu página está publicada"
          : "Publica tu primera página"}
      </h2>
      {publishedUsername ? (
        <>
          <p className="mt-2 text-sm leading-6 text-white/80">
            Comparte esta URL. Si haces cambios, pulsa «Guardar y publicar» para
            actualizarlos.
          </p>
          <label className="mt-4 block text-xs font-semibold text-white/80">
            Tu URL pública
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="mt-2 w-full min-w-0 rounded-xl border border-white/20 bg-white/[.04] p-3 text-sm text-white"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/${encodeURIComponent(publishedUsername)}`}
              className={action}
            >
              <Eye size={16} aria-hidden="true" />
              Ver página publicada
            </Link>
            <button
              type="button"
              onClick={copy}
              disabled={!url}
              className={action}
            >
              <Copy size={16} aria-hidden="true" />
              Copiar mi URL
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm leading-6 text-white/80">
            Elige tu nombre y usuario, añade un enlace y publícalo cuando esté
            listo.
          </p>
          <ol className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <li>
              <a href="#perfil" className={action}>
                {identityReady && <Check aria-hidden="true" size={16} />}1.
                Nombre y usuario
              </a>
            </li>
            <li>
              <button type="button" onClick={onAddLink} className={action}>
                {linkReady && <Check aria-hidden="true" size={16} />}2. Tu
                primer enlace
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={onPublish}
                disabled={busy || !identityReady || !linkReady}
                className={`${action} bg-lime text-ink disabled:opacity-50`}
              >
                {busy ? "Publicando…" : "3. Publicar mi página"}
              </button>
            </li>
          </ol>
        </>
      )}
      <p
        role="status"
        className={notice ? "mt-3 text-sm text-lime" : "sr-only"}
      >
        {notice}
      </p>
    </section>
  );
}
