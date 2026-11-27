"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useApiQuery } from "@/hooks/use-api-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { TrendingUp, ArrowDown, ArrowUp, Minus } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { AccessRestricted } from "@/components/access-restricted";
import { fmt, fmtDate, QualityBadge } from "./_shared";

interface Participant {
  id: string;
  internalId: string;
  fullName: string;
  sex: string;
  birthDate: string;
  heightCm: number;
}

interface Measurement {
  id: string;
  measuredAt: string;
  weightKg: number | null;
  resistanceR: number | null;
  reactanceXc: number | null;
  phaseAngleDeg: number | null;
  inbodyFatMass: number | null;
  inbodyFatPercent: number | null;
  inbodyMuscleMass: number | null;
  inbodyTBW: number | null;
  calcFFM: number | null;
  calcFM: number | null;
  calcFatPercent: number | null;
  calcFFMI: number | null;
  calcFMI: number | null;
  calcTBW: number | null;
  calcPhaseAngle: number | null;
  calcResistanceIndex: number | null;
  qualityScore: string;
  equation?: { name: string; authors: string; year: number } | null;
  device?: { manufacturer: string; model: string };
}

const RANGES = [
  { id: "7d", label: "7 días", days: 7 },
  { id: "30d", label: "30 días", days: 30 },
  { id: "3m", label: "3 meses", days: 90 },
  { id: "6m", label: "6 meses", days: 180 },
  { id: "1a", label: "1 año", days: 365 },
  { id: "all", label: "Todo", days: 0 },
];

export function EvolucionSection() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string | undefined;

  // Evolución está disponible para ADMIN, EVALUADOR, INVESTIGADOR.
  // USUARIO solo puede ver sus propios resultados (manejo futuro); por ahora
  // mostramos acceso restringido para evitar crashes por 403 en endpoints.
  if (role && !["ADMIN", "EVALUADOR", "INVESTIGADOR"].includes(role)) {
    return <AccessRestricted required={["ADMIN", "EVALUADOR", "INVESTIGADOR"]} />;
  }

  return <EvolucionInner />;
}

function EvolucionInner() {
  const { selectedParticipantId, selectParticipant } = useAppStore();
  const [range, setRange] = useState("all");

  const { data: participants } = useApiQuery<Participant[]>("/api/participants");
  const participantsArr = Array.isArray(participants) ? participants : [];

  const participant = participantsArr.find((p) => p.id === selectedParticipantId) || null;

  const { data: fullParticipant } = useQuery<{
    measurements: Measurement[];
  } | null>({
    queryKey: ["participant", selectedParticipantId],
    queryFn: async () => {
      if (!selectedParticipantId) return null;
      const r = await fetch(`/api/participants/${selectedParticipantId}`);
      if (!r.ok) return null;
      return r.json();
    },
    enabled: !!selectedParticipantId,
  });

  const measurements = useMemo(() => {
    const all = fullParticipant?.measurements || [];
    const sorted = [...all].sort(
      (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()
    );
    const cfg = RANGES.find((r) => r.id === range);
    if (!cfg || cfg.days === 0) return sorted;
    const cutoff = Date.now() - cfg.days * 24 * 60 * 60 * 1000;
    return sorted.filter((m) => new Date(m.measuredAt).getTime() >= cutoff);
  }, [fullParticipant, range]);

  const chartData = measurements.map((m) => ({
    fecha: new Date(m.measuredAt).toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit", year: "2-digit" }),
    "Masa libre de grasa (kg)": m.calcFFM ?? null,
    "Masa grasa (kg)": m.calcFM ?? null,
    "% Grasa": m.calcFatPercent ?? null,
    "FFMI (kg/m²)": m.calcFFMI ?? null,
    "Peso (kg)": m.weightKg ?? null,
  }));

  const first = measurements[0] || null;
  const last = measurements[measurements.length - 1] || null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" /> Evolución
        </h2>
        <p className="text-sm text-muted-foreground">
          Seguimiento longitudinal de composición corporal por participante.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selección de participante</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedParticipantId || ""}
            onValueChange={(v) => selectParticipant(v)}
          >
            <SelectTrigger><SelectValue placeholder="Seleccione un participante" /></SelectTrigger>
            <SelectContent>
              {participantsArr.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.fullName} ({p.internalId})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {participant && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <Info2 label="Sexo" value={participant.sex} />
              <Info2 label="Altura" value={`${participant.heightCm} cm`} />
              <Info2 label="Edad" value={`${new Date().getFullYear() - new Date(participant.birthDate).getFullYear()} años`} />
              <Info2 label="Evaluaciones" value={String(measurements.length)} />
            </div>
          )}
        </CardContent>
      </Card>

      {participant && measurements.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base">Comparativa primera / anterior / actual</CardTitle>
                  <CardDescription>Diferencias en valor absoluto y porcentual.</CardDescription>
                </div>
                <Select value={range} onValueChange={setRange}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RANGES.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Variable</TableHead>
                      <TableHead>Primera</TableHead>
                      <TableHead>Anterior</TableHead>
                      <TableHead>Actual</TableHead>
                      <TableHead>Δ (anterior → actual)</TableHead>
                      <TableHead>% cambio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <ComparisonRows first={first} last={last} measurements={measurements} />
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tendencia temporal</CardTitle>
              <CardDescription>
                Variables seleccionadas a lo largo del tiempo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ fontSize: 12 }}
                      formatter={(v: any) => (v === null ? "—" : Number(v).toFixed(1))}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="Masa libre de grasa (kg)" stroke="#0f766e" strokeWidth={2} connectNulls />
                    <Line type="monotone" dataKey="Masa grasa (kg)" stroke="#db2777" strokeWidth={2} connectNulls />
                    <Line type="monotone" dataKey="FFMI (kg/m²)" stroke="#059669" strokeWidth={2} connectNulls />
                    <Line type="monotone" dataKey="Peso (kg)" stroke="#64748b" strokeWidth={2} connectNulls strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial completo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Calidad</TableHead>
                      <TableHead>Peso</TableHead>
                      <TableHead>% Grasa</TableHead>
                      <TableHead>FFM</TableHead>
                      <TableHead>FFMI</TableHead>
                      <TableHead>Ecuación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...measurements].reverse().map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="text-sm">{fmtDate(m.measuredAt)}</TableCell>
                        <TableCell><QualityBadge score={m.qualityScore} /></TableCell>
                        <TableCell className="text-sm">{fmt(m.weightKg, 1, " kg")}</TableCell>
                        <TableCell className="text-sm">{fmt(m.calcFatPercent ?? m.inbodyFatPercent, 1, " %")}</TableCell>
                        <TableCell className="text-sm">{fmt(m.calcFFM, 1, " kg")}</TableCell>
                        <TableCell className="text-sm">{fmt(m.calcFFMI, 1)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {m.equation ? `${m.equation.authors.split(",")[0]} (${m.equation.year})` : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {participant && measurements.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            Sin evaluaciones registradas para este participante en el rango seleccionado.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ComparisonRows({
  first,
  last,
  measurements,
}: {
  first: Measurement | null;
  last: Measurement | null;
  measurements: Measurement[];
}) {
  const prev = measurements.length >= 2 ? measurements[measurements.length - 2] : null;
  const fields: { key: keyof Measurement; label: string; suffix?: string; digits?: number }[] = [
    { key: "weightKg", label: "Peso", suffix: " kg" },
    { key: "calcFFM", label: "Masa libre de grasa", suffix: " kg" },
    { key: "calcFM", label: "Masa grasa", suffix: " kg" },
    { key: "calcFatPercent", label: "% grasa", suffix: " %" },
    { key: "calcFFMI", label: "FFMI", suffix: " kg/m²" },
    { key: "calcFMI", label: "FMI", suffix: " kg/m²" },
    { key: "calcTBW", label: "Agua corporal total", suffix: " kg" },
    { key: "calcPhaseAngle", label: "Ángulo de fase", suffix: "°", digits: 2 },
    { key: "resistanceR", label: "Resistencia R", suffix: " ohm" },
  ];
  return (
    <>
      {fields.map((f) => {
        const fv = first ? (first[f.key] as number | null) : null;
        const pv = prev ? (prev[f.key] as number | null) : null;
        const lv = last ? (last[f.key] as number | null) : null;
        const delta = typeof pv === "number" && typeof lv === "number" ? lv - pv : null;
        const pct = delta !== null && pv !== 0 ? (delta / pv) * 100 : null;
        const digits = f.digits ?? 1;
        return (
          <TableRow key={f.key as string}>
            <TableCell className="font-medium text-sm">{f.label}</TableCell>
            <TableCell className="text-sm">{fmt(fv, digits, f.suffix)}</TableCell>
            <TableCell className="text-sm">{fmt(pv, digits, f.suffix)}</TableCell>
            <TableCell className="text-sm">{fmt(lv, digits, f.suffix)}</TableCell>
            <TableCell>
              <DeltaBadge delta={delta} digits={digits} />
            </TableCell>
            <TableCell className="text-sm">
              {pct !== null ? (
                <span className={pct < 0 ? "text-cedersa-blue" : pct > 0 ? "text-cedersa-red" : ""}>
                  {pct > 0 ? "+" : ""}
                  {pct.toFixed(1)}%
                </span>
              ) : (
                "—"
              )}
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}

function DeltaBadge({ delta, digits }: { delta: number | null; digits: number }) {
  if (delta === null) return <span className="text-muted-foreground">—</span>;
  const Icon = delta < 0 ? ArrowDown : delta > 0 ? ArrowUp : Minus;
  const color = delta < 0 ? "text-cedersa-blue" : delta > 0 ? "text-cedersa-red" : "text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      {delta > 0 ? "+" : ""}
      {delta.toFixed(digits)}
    </span>
  );
}

function Info2({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium capitalize">{value.replace("_", " ")}</div>
    </div>
  );
}
