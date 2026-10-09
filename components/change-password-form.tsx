"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(false);
    if (password !== confirm) {
      setMessage("Las contraseñas nuevas no coinciden.");
      return;
    }
    if (password === currentPassword) {
      setMessage("Elige una contraseña diferente de la actual.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, password, confirm }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.error ?? "No pudimos cambiar la contraseña.");
        return;
      }
      setCurrentPassword("");
      setPassword("");
      setConfirm("");
      setSuccess(true);
      setMessage(
        "Contraseña actualizada. Usa la nueva contraseña la próxima vez que inicies sesión.",
      );
    } catch {
      setMessage("No pudimos conectar. Inténtalo nuevamente.");
    } finally {
      setBusy(false);
    }
  }
  const field =
    "mt-2 w-full rounded-xl border border-white/20 bg-white/[.045] px-4 py-3 text-white outline-none focus:border-lime";
  return (
    <form
      onSubmit={submit}
      className="mt-5 space-y-4"
      aria-label="Cambiar contraseña"
    >
      <label className="block text-sm font-semibold text-white/80">
        Contraseña actual
        <input
          type="password"
          required
          maxLength={128}
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={field}
          disabled={busy}
        />
      </label>
      <label className="block text-sm font-semibold text-white/80">
        Contraseña nueva
        <input
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={field}
          disabled={busy}
        />
        <span className="mt-2 block text-xs text-white/70">
          Entre 8 y 128 caracteres. Usa una contraseña única.
        </span>
      </label>
      <label className="block text-sm font-semibold text-white/80">
        Confirmar contraseña nueva
        <input
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={field}
          disabled={busy}
        />
      </label>
      {message && (
        <p
          role={success ? "status" : "alert"}
          className={`rounded-xl border p-3 text-sm ${success ? "border-lime/30 text-lime" : "border-red-300/30 text-red-200"}`}
        >
          {message}
        </p>
      )}
      <button
        disabled={busy}
        className="min-h-11 rounded-xl bg-lime px-4 py-3 text-sm font-bold text-ink disabled:opacity-50"
      >
        {busy ? "Actualizando…" : "Guardar nueva contraseña"}
      </button>
      <p className="text-xs leading-5 text-white/70">
        Si no recuerdas tu contraseña o entraste con un enlace,{" "}
        <Link
          href="/forgot-password"
          className="font-semibold text-lime underline"
        >
          recupérala por correo
        </Link>
        .
      </p>
    </form>
  );
}
