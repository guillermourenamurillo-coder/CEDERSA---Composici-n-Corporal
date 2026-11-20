"use client";

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
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Activity, CalendarDays, Users, Cpu, ClipboardList, TrendingUp } from "lucide-react";
import { fmt, fmtDate } from "./_shared";

interface DashboardStats {
  todayCount: number;
  monthCount: number;
  participantsCount: number;
  measurementsCount: number;
  devicesCount: number;
  sexDist: { sex: string; _count: number }[];
  ageBuckets: Record<string, number>;
  popDist: { populationCategory: string | null; _count: number }[];
  recent: any[];
}

const PIE_COLORS = ["#0f766e", "#db2777", "#64748b"];
const POP_COLORS = ["#0f766e", "#059669", "#d97706", "#64748b", "#9333ea"];

export function DashboardSection() {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const r = await fetch("/api/dashboard/stats");
      if (!r.ok) throw new Error("Error al cargar estadísticas");
      return r.json();
    },
  });

  const sexData = (data?.sexDist || []).map((d) => ({
    name: d.sex === "MASCULINO" ? "Hombres" : d.sex === "FEMENINO" ? "Mujeres" : d.sex,
    value: d._count,
  }));

  const ageData = Object.entries(data?.ageBuckets || {}).map(([k, v]) => ({
    rango: k,
    cantidad: v,
  }));

  const popData = (data?.popDist || []).map((d, i) => ({
    name: d.populationCategory || "Sin categoría",
    value: d._count,
    color: POP_COLORS[i % POP_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Panel administrativo</h2>
        <p className="text-sm text-muted-foreground">
          Resumen general de la actividad de evaluación de CEDERSA.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Evaluaciones hoy"
          value={data?.todayCount}
          icon={CalendarDays}
          loading={isLoading}
        />
        <StatCard
          title="Este mes"
          value={data?.monthCount}
          icon={ClipboardList}
          loading={isLoading}
        />
        <StatCard
          title="Personas evaluadas"
          value={data?.participantsCount}
          icon={Users}
          loading={isLoading}
        />
        <StatCard
          title="Dispositivos"
          value={data?.devicesCount}
          icon={Cpu}
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evaluaciones por sexo</CardTitle>
            <CardDescription>Distribución de participantes registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              {sexData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sexData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      label={(e: any) => `${e.name}: ${e.value}`}
                    >
                      {sexData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rango etario</CardTitle>
            <CardDescription>Participantes por grupo de edad</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              {ageData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="rango" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="cantidad" fill="#0f766e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por población</CardTitle>
            <CardDescription>Atletas, general, adulto mayor, otro</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              {popData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={popData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      label={(e: any) => `${e.name}: ${e.value}`}
                    >
                      {popData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Evaluaciones recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Participante</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>% Grasa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground text-sm">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : data?.recent && data.recent.length > 0 ? (
                  data.recent.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">
                        {m.participant.fullName}
                        <div className="text-[11px] text-muted-foreground">{m.participant.internalId}</div>
                      </TableCell>
                      <TableCell className="text-sm">{fmtDate(m.measuredAt)}</TableCell>
                      <TableCell className="text-sm">
                        {m.device.manufacturer} {m.device.model}
                      </TableCell>
                      <TableCell className="text-sm">{fmt(m.weightKg, 1, " kg")}</TableCell>
                      <TableCell className="text-sm">
                        {fmt(m.inbodyFatPercent, 1, " %")}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground text-sm">
                      Sin evaluaciones registradas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value?: number;
  icon: React.ElementType;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{title}</span>
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="mt-2 text-2xl font-bold">
          {loading ? <span className="text-muted-foreground">—</span> : value ?? 0}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
      <TrendingUp className="w-4 h-4 mr-2 opacity-50" /> Sin datos disponibles
    </div>
  );
}
