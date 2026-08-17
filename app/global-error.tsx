"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ margin: 0, background: "#f7f4ed", color: "#151515", fontFamily: "Arial, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "32px 20px", boxSizing: "border-box" }}>
          <section style={{ width: "100%", maxWidth: 560, boxSizing: "border-box", border: "3px solid #151515", background: "#fff", padding: 32, textAlign: "center", boxShadow: "10px 10px 0 #151515" }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 900, letterSpacing: ".12em", color: "#7055e8", textTransform: "uppercase" }}>MultiLinks</p>
            <h1 style={{ margin: "20px 0 0", fontSize: 30, lineHeight: 1.15 }}>Algo salió mal de nuestro lado</h1>
            <p style={{ margin: "16px auto 0", maxWidth: 430, color: "rgba(21,21,21,.62)", lineHeight: 1.7 }}>Ya registramos el problema. Inténtalo nuevamente o vuelve al inicio mientras lo revisamos.</p>
            <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
              <button type="button" onClick={reset} style={{ border: "2px solid #151515", background: "#c9ff58", color: "#151515", padding: "12px 20px", fontWeight: 900, cursor: "pointer", boxShadow: "5px 5px 0 #151515" }}>Reintentar</button>
              <a href="/" style={{ border: "2px solid #151515", background: "#fff", color: "#151515", padding: "12px 20px", fontWeight: 900, textDecoration: "none", boxShadow: "5px 5px 0 #151515" }}>Volver al inicio</a>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
