"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CEDERSA] Error global:", error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#fafafa",
          color: "#1a1a1a",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "0.75rem",
              color: "#c8102e",
            }}
          >
            CEDERSA — Error de aplicación
          </div>
          <p
            style={{
              maxWidth: "28rem",
              color: "#555",
              fontSize: "0.9rem",
              lineHeight: 1.5,
              marginBottom: "1.5rem",
            }}
          >
            Se produjo un error crítico que impidió cargar la aplicación. Esto
            suele ser temporal. Intente recargar la página; si el problema
            persiste, contacte al administrador del sistema.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#1e3a5f",
              color: "white",
              border: "none",
              padding: "0.5rem 1.25rem",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
