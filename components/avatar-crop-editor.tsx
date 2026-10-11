"use client";
import { useEffect, useRef, useState } from "react";
export function AvatarCropEditor({
  src,
  onApply,
  onCancel,
}: {
  src: string;
  onApply: (file: File) => void;
  onCancel: () => void;
}) {
  const image = useRef<HTMLImageElement | null>(null);
  const preview = useRef<HTMLDivElement | null>(null);
  const [edge, setEdge] = useState(256);
  useEffect(() => {
    const element = preview.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setEdge(element.clientWidth));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      image.current = img;
      setSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () =>
      setError("No pudimos abrir esta foto. Vuelve a subirla para ajustarla.");
    img.src = src;
    return () => {
      img.onload = null;
      img.onerror = null;
      image.current = null;
    };
  }, [src]);
  const scale = size.width
    ? Math.max(edge / size.width, edge / size.height) * zoom
    : 1;
  const width = size.width * scale,
    height = size.height * scale;
  async function apply() {
    if (!image.current) return;
    setBusy(true);
    setError("");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext("2d");
      if (!context) throw new Error();
      context.drawImage(
        image.current,
        ((-(width - edge) * x) / 100) * (512 / edge),
        ((-(height - edge) * y) / 100) * (512 / edge),
        width * (512 / edge),
        height * (512 / edge),
      );
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", 0.9),
      );
      if (!blob) throw new Error();
      onApply(new File([blob], "avatar.webp", { type: "image/webp" }));
    } catch {
      setError(
        "No pudimos aplicar el recorte. Prueba subiendo la foto de nuevo.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      aria-label="Ajustar foto de perfil"
      className="mt-5 rounded-xl border border-white/15 bg-black/20 p-4"
    >
      <h3 className="font-semibold">Ajustar foto</h3>
      <p className="mt-1 text-xs text-white/60">
        Acerca la imagen y mueve el encuadre. Después publica para guardar los
        cambios.
      </p>
      <div
        ref={preview}
        role="img"
        aria-label="Vista previa del recorte"
        className="mx-auto my-4 aspect-square w-64 max-w-full overflow-hidden rounded-3xl bg-black"
        style={{
          backgroundImage: `url(${src})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${width}px ${height}px`,
          backgroundPosition: `${(-(width - edge) * x) / 100}px ${(-(height - edge) * y) / 100}px`,
        }}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Zoom", zoom, setZoom, 1, 3, 0.05],
          ["Posición horizontal", x, setX, 0, 100, 1],
          ["Posición vertical", y, setY, 0, 100, 1],
        ].map(([label, value, setValue, min, max, step]) => (
          <label key={String(label)} className="text-xs text-white/70">
            {String(label)}
            <input
              aria-label={String(label)}
              type="range"
              min={Number(min)}
              max={Number(max)}
              step={Number(step)}
              value={Number(value)}
              onChange={(event) =>
                (setValue as (v: number) => void)(Number(event.target.value))
              }
              className="mt-2 block min-h-11 w-full accent-lime"
            />
          </label>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!size.width || busy}
          onClick={apply}
          className="min-h-11 rounded-lg bg-lime px-4 text-sm font-semibold text-ink disabled:opacity-50"
        >
          {busy ? "Aplicando…" : "Aplicar recorte"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="min-h-11 rounded-lg border border-white/15 px-4 text-sm"
        >
          Cancelar
        </button>
      </div>
    </section>
  );
}
