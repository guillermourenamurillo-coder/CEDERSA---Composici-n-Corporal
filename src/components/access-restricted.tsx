"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";

interface AccessRestrictedProps {
  /** Rol(es) requerido(s), opcional para contexto */
  required?: string | string[];
}

export function AccessRestricted({ required }: AccessRestrictedProps) {
  const label = required
    ? Array.isArray(required)
      ? required.join(" o ")
      : required
    : "superior";
  return (
    <Card className="border-t-4 border-t-[var(--cedersa-orange)]">
      <CardContent className="py-12 flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
          <Lock className="w-6 h-6 text-cedersa-orange" />
        </div>
        <div>
          <h3 className="text-base font-semibold">Acceso restringido</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Esta sección requiere rol <strong>{label}</strong>. Si cree que
            debería tener acceso, contacte al administrador del sistema.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
