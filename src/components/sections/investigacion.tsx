"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { FlaskConical, Download, ShieldCheck, Lock } from "lucide-react";

interface Equation {
  id: string;
  name: string;
  authors: string;
  year: number;
}

export function InvestigacionSection() {
  const [sex, setSex] = useState("ALL");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [equationId, setEquationId] = useState("ALL");
  const [population, setPopulation] = useState("ALL");
  const [preview, setPreview] = useState<any[] | null>(null);
  const [downloading, setDownloading] = useState(false);

  const { data: equations } = useQuery<Equation[]>({
    queryKey: ["equations"],
    queryFn: async () => (await fetch("/api/equations")).json(),
  });

  function buildUrl() {
    const params = new URLSearchParams();
    if (sex !== "ALL") params.set("sex", sex);
    if (ageMin) params.set("ageMin", ageMin);
    if (ageMax) params.set("ageMax", ageMax);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (equationId !== "ALL") params.set("equationId", equationId);
    if (population !== "ALL") params.set("population", population);
    return `/api/research/export?${params.toString()}`;
  }

  async function previewData() {
    try {
      const r = await fetch(buildUrl());
      if (!r.ok) throw new Error("Error al obtener datos");
      const text = await r.text();
      const lines = text.split("\n").filter(Boolean);
      const headers = lines[0].split(",");
      const rows = lines.slice(1, 11).map((l) => l.split(","));
      setPreview({ headers, rows, total: lines.length - 1 });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function downloadCsv() {
    setDownloading(true);
    try {
      const r = await fetch(buildUrl());
      if (!r.ok) throw new Error("Error al exportar");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cedersa_dataset_anonimo_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Exportación completada");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-primary" /> Investigación
        </h2>
        <p className="text-sm text-muted-foreground">
          Exportación de dataset anonimizado para fines de investigación.
        </p>
      </div>

      <Alert className="border-blue-500/30 bg-blue-500/5">
        <ShieldCheck className="w-4 h-4 text-cedersa-blue" />
        <AlertDescription className="text-sm">
          No incluye nombres ni identificadores personales. Cada participante se identifica
          únicamente mediante un hash no reversible. La exportación respeta el consentimiento
          informado y queda registrada en la bitácora de auditoría.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros del dataset</CardTitle>
          <CardDescription>
            Aplique filtros demográficos, temporales y por ecuación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Sexo</Label>
              <Select value={sex} onValueChange={setSex}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="MASCULINO">Masculino</SelectItem>
                  <SelectItem value="FEMENINO">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Edad mínima</Label>
              <Input type="number" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Edad máxima</Label>
              <Input type="number" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} placeholder="100" />
            </div>
            <div>
              <Label className="text-xs">Población</Label>
              <Select value={population} onValueChange={setPopulation}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  <SelectItem value="poblacion_general">Población general</SelectItem>
                  <SelectItem value="atleta">Atleta</SelectItem>
                  <SelectItem value="adulto_mayor">Adulto mayor</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Desde</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Hasta</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Ecuación</Label>
              <Select value={equationId} onValueChange={setEquationId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  {(equations || []).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name} ({e.year})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="outline" onClick={previewData}>
              <Lock className="w-4 h-4 mr-2" /> Vista previa anonimizada
            </Button>
            <Button onClick={downloadCsv} disabled={downloading}>
              <Download className="w-4 h-4 mr-2" /> Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {preview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Vista previa anonimizada</span>
              <Badge variant="secondary">n = {preview.total}</Badge>
            </CardTitle>
            <CardDescription>
              Se muestran hasta 10 registros de muestra. La exportación completa contiene todos los
              registros que coinciden con los filtros y con consentimiento informado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    {preview.headers.map((h: string) => (
                      <TableHead key={h} className="text-[11px] whitespace-nowrap">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.rows.map((row: string[], i: number) => (
                    <TableRow key={i}>
                      {row.map((cell, j) => (
                        <TableCell key={j} className="text-[11px] font-mono">{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
