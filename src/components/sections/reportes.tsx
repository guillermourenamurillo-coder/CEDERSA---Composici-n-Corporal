"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Download, Loader2, ExternalLink, FileDown } from "lucide-react";
import { AccessRestricted } from "@/components/access-restricted";
import { fmt, fmtDate, QualityBadge } from "./_shared";

interface Measurement {
  id: string;
  measuredAt: string;
  weightKg: number | null;
  inbodyFatPercent: number | null;
  calcFatPercent: number | null;
  qualityScore: string;
  participant: { internalId: string; fullName: string };
  device: { manufacturer: string; model: string };
}

export function ReportesSection() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string | undefined;

  // Reportes disponible para ADMIN, EVALUADOR, INVESTIGADOR.
  if (role && !["ADMIN", "EVALUADOR", "INVESTIGADOR"].includes(role)) {
    return <AccessRestricted required={["ADMIN", "EVALUADOR", "INVESTIGADOR"]} />;
  }

  return <ReportesInner />;
}

function ReportesInner() {
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<Measurement[]>({
    queryKey: ["measurements-recent"],
    queryFn: async () => {
      const r = await fetch("/api/measurements");
      if (!r.ok) throw new Error("Error al cargar mediciones");
      return r.json();
    },
  });
  const dataArr = Array.isArray(data) ? data : [];

  async function generatePdf(m: Measurement) {
    setGeneratingId(m.id);
    try {
      const r = await fetch(`/api/reports/${m.id}/generate-pdf`, { method: "POST" });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || "Error al generar PDF");
      }
      // El endpoint devuelve el PDF directamente como binario.
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      // Limpiar la URL del objeto después de 60s (tiempo suficiente para que abra).
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast.success("Reporte PDF generado");
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGeneratingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" /> Reportes
        </h2>
        <p className="text-sm text-muted-foreground">
          Generación de reportes PDF por evaluación. Cada reporte incluye encabezado institucional,
          datos generales, condiciones de medición, resultados (InBody y científicos), interpretación
          y pie de página con nota no diagnóstica.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evaluaciones recientes</CardTitle>
          <CardDescription>
            Haga clic en "Generar PDF" para producir el reporte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Participante</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>% Grasa</TableHead>
                  <TableHead>Calidad</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground text-sm">Cargando...</TableCell>
                  </TableRow>
                ) : dataArr.length > 0 ? (
                  dataArr.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">
                        {m.participant.fullName}
                        <div className="text-[11px] text-muted-foreground">{m.participant.internalId}</div>
                      </TableCell>
                      <TableCell className="text-sm">{fmtDate(m.measuredAt)}</TableCell>
                      <TableCell className="text-sm">{m.device.manufacturer} {m.device.model}</TableCell>
                      <TableCell className="text-sm">{fmt(m.weightKg, 1, " kg")}</TableCell>
                      <TableCell className="text-sm">
                        {fmt(m.calcFatPercent ?? m.inbodyFatPercent, 1, " %")}
                      </TableCell>
                      <TableCell><QualityBadge score={m.qualityScore} /></TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generatePdf(m)}
                          disabled={generatingId === m.id}
                        >
                          {generatingId === m.id ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <FileDown className="w-4 h-4 mr-1" />
                          )}
                          PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground text-sm">
                      Sin evaluaciones registradas. Cree una nueva evaluación primero.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="w-4 h-4 text-primary" /> Plantilla InBody
          </CardTitle>
          <CardDescription>
            Descargue la plantilla CSV para importar exportaciones de InBody con el formato esperado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a href="/inbody-template.csv" download>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" /> Descargar plantilla CSV
              <ExternalLink className="w-3 h-3 ml-2 opacity-50" />
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
