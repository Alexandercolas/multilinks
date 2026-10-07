"use client";
import { Check, Copy, QrCode, Share2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  CreateProfileShortcut,
  DesktopQrPanel,
  ProfileQr,
} from "@/components/desktop-qr-panel";

async function copyUrl(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = url;
    field.setAttribute("readonly", "");
    field.style.cssText = "position:fixed;top:0;left:-9999px";
    const previous = document.activeElement;
    document.body.appendChild(field);
    field.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      /* Manual copy below. */
    }
    field.remove();
    if (previous instanceof HTMLElement) previous.focus();
    return copied;
  }
}
export function ProfileShareTools({
  title,
  url,
  qrSvg,
  dark,
}: {
  title: string;
  url: string;
  qrSvg: string;
  dark: boolean;
}) {
  const [status, setStatus] = useState("");
  const [manualCopy, setManualCopy] = useState(false);
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current;
    if (open && !el?.open) el?.showModal();
    if (!open && el?.open) el.close();
  }, [open]);
  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(""), 4000);
    return () => clearTimeout(timer);
  }, [status]);
  async function copy() {
    const copied = await copyUrl(url);
    setManualCopy(!copied);
    setStatus(copied ? "Enlace copiado" : "Selecciona y copia el enlace.");
  }
  async function share() {
    setStatus("");
    setManualCopy(false);
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `El perfil de ${title}`, url });
        setStatus("Perfil compartido");
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }
    await copy();
  }
  const button = `profile-control ${dark ? "border-white/[.15] hover:bg-white/[.06]" : "border-ink/[.15] hover:bg-ink/[.04]"}`;
  const actions = (
    <>
      <button
        type="button"
        onClick={copy}
        className={`${button} w-full justify-start`}
      >
        <Copy aria-hidden="true" size={16} />
        Copiar enlace
      </button>
      <button
        type="button"
        onClick={share}
        className={`${button} w-full justify-start`}
      >
        <Share2 aria-hidden="true" size={16} />
        Compartir
      </button>
    </>
  );
  return (
    <div className={`${dark ? "text-white" : "text-ink"}`}>
      <div
        className="flex flex-wrap items-center gap-2 lg:hidden"
        aria-label="Compartir perfil"
      >
        <button type="button" onClick={share} className={button}>
          <Share2 aria-hidden="true" size={16} />
          Compartir
        </button>
        <button
          type="button"
          onClick={copy}
          className={button}
          aria-label="Copiar enlace del perfil"
        >
          <Copy aria-hidden="true" size={16} />
          <span className="hidden min-[390px]:inline">Copiar enlace</span>
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={button}
          aria-label="Mostrar QR"
        >
          <QrCode aria-hidden="true" size={16} />
          <span className="sr-only">Mostrar QR</span>
        </button>
        <CreateProfileShortcut />
      </div>
      <DesktopQrPanel title={title} url={url} qrSvg={qrSvg}>
        {actions}
      </DesktopQrPanel>
      <p
        role="status"
        aria-live="polite"
        className="mt-2 min-h-5 text-xs font-medium"
      >
        {status && (
          <>
            <Check aria-hidden="true" size={13} className="mr-1 inline" />
            {status}
          </>
        )}
      </p>
      {manualCopy && (
        <input
          aria-label="Enlace público para copiar"
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="mt-2 w-full rounded-lg border border-current bg-transparent p-2 text-sm"
        />
      )}
      <dialog
        ref={dialog}
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            const rect = e.currentTarget.getBoundingClientRect();
            if (
              e.clientX < rect.left ||
              e.clientX > rect.right ||
              e.clientY < rect.top ||
              e.clientY > rect.bottom
            )
              setOpen(false);
          }
        }}
        aria-labelledby="profile-qr-title"
        className="max-h-[calc(100%_-_2rem)] w-[calc(100%_-_2rem)] max-w-sm overflow-y-auto rounded-3xl border border-ink/10 bg-cream p-6 text-ink backdrop:bg-ink/60"
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar QR"
          className="profile-control float-right border-ink/10 p-3"
        >
          <X aria-hidden="true" size={18} />
        </button>
        <h2 id="profile-qr-title" className="pt-3 text-lg font-semibold">
          Compartir perfil
        </h2>
        <p className="mt-4 break-words text-sm">
          Escanea para abrir el perfil de {title}.
        </p>
        <div className="mx-auto my-6 w-fit">
          <ProfileQr title={title} qrSvg={qrSvg} large />
        </div>
        <p className="break-all text-center text-xs leading-5">
          {url.replace(/^https?:\/\//, "")}
        </p>
      </dialog>
    </div>
  );
}
