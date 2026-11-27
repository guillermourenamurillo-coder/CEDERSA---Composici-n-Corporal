"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log del error para telemetría (no envía a servidores externos)
    console.error("[CEDERSA] Error de render:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-t-4 border-t-[var(--cedersa-red)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5 text-cedersa-red" />
            Algo salió mal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Se produjo un error inesperado al cargar esta sección. Puede deberse
            a una conexión intermitente o a un problema temporal del servidor.
          </p>
          {error?.message && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Detalle técnico
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded text-[11px] overflow-x-auto whitespace-pre-wrap break-all">
                {error.message}
                {error.digest ? `\n[digest: ${error.digest}]` : ""}
              </pre>
            </details>
          )}
          <div className="flex gap-2">
            <Button onClick={reset} size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (typeof window !== "undefined") window.location.reload();
              }}
            >
              Recargar página
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
