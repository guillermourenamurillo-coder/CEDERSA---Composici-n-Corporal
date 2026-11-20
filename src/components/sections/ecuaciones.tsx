"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Calculator, Filter, BookOpen, CheckCircle2, AlertTriangle } from "lucide-react";

interface Equation {
  id: string;
  name: string;
  authors: string;
  year: number;
  reference: string;
  doi: string | null;
  population: string;
  ageRangeMin: number | null;
  ageRangeMax: number | null;
  sex: string;
  deviceType: string | null;
  frequencyKHz: number | null;
  variablesRequired: string;
  formula: string;
  unitsRequired: string;
  see: number | null;
  r2: number | null;
  limitations: string | null;
  validationStatus: string;
  outputVariable: string;
  active: boolean;
}

export function EcuacionesSection() {
  const [sexFilter, setSexFilter] = useState("ALL");
  const [outputFilter, setOutputFilter] = useState("ALL");
  const [popFilter, setPopFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<Equation[]>({
    queryKey: ["equations"],
    queryFn: async () => {
      const r = await fetch("/api/equations");
      if (!r.ok) throw new Error("Error al cargar ecuaciones");
      return r.json();
    },
  });

  const filtered = (data || []).filter((e) => {
    if (sexFilter !== "ALL" && e.sex !== sexFilter) return false;
    if (outputFilter !== "ALL" && e.outputVariable !== outputFilter) return false;
    if (popFilter && !e.population.toLowerCase().includes(popFilter.toLowerCase())) return false;
    return true;
  });

  const selected = (data || []).find((e) => e.id === selectedId) || null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Calculator className="w-6 h-6 text-primary" /> Biblioteca de ecuaciones BIA
        </h2>
        <p className="text-sm text-muted-foreground">
          Ecuaciones publicadas y validadas. La transparencia de la fórmula, la población de
          validación y la incertidumbre (SEE) es esencial para el rigor científico.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Sexo</label>
              <Select value={sexFilter} onValueChange={setSexFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="MASCULINO">Masculino</SelectItem>
                  <SelectItem value="FEMENINO">Femenino</SelectItem>
                  <SelectItem value="AMBOS">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Variable de salida</label>
              <Select value={outputFilter} onValueChange={setOutputFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  <SelectItem value="FFM">Masa libre de grasa</SelectItem>
                  <SelectItem value="TBW">Agua corporal total</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground">Población (texto)</label>
              <Input
                placeholder="p. ej. atleta, mayor, daneses"
                value={popFilter}
                onChange={(e) => setPopFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ecuaciones ({filtered.length})</CardTitle>
          <CardDescription>
            Haga clic en una fila para ver el detalle completo, fórmula y referencias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Autores</TableHead>
                  <TableHead>Año</TableHead>
                  <TableHead>Sexo</TableHead>
                  <TableHead>Edad</TableHead>
                  <TableHead>Salida</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground text-sm">Cargando...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground text-sm">Sin resultados.</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((e) => (
                    <TableRow
                      key={e.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedId(e.id)}
                    >
                      <TableCell className="font-medium">{e.name}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{e.authors}</TableCell>
                      <TableCell className="text-sm">{e.year}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[11px]">{e.sex}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {e.ageRangeMin ? `${e.ageRangeMin}-${e.ageRangeMax ?? "+"}` : "—"}
                      </TableCell>
                      <TableCell className="text-sm">{e.outputVariable}</TableCell>
                      <TableCell>
                        {e.validationStatus === "VALIDADO" ? (
                          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[11px]">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Validado
                          </Badge>
                        ) : e.validationStatus === "PROVISIONAL" ? (
                          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[11px]">
                            <AlertTriangle className="w-3 h-3 mr-1" /> Provisional
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[11px]">{e.validationStatus}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selected && (
        <Card className="border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> {selected.name}
            </CardTitle>
            <CardDescription>{selected.authors} — {selected.year}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <Field label="Población validada" value={selected.population} />
              <Field label="Rango etario" value={selected.ageRangeMin ? `${selected.ageRangeMin}-${selected.ageRangeMax ?? "+"} años` : "—"} />
              <Field label="Sexo" value={selected.sex} />
              <Field label="Tipo de dispositivo" value={selected.deviceType || "—"} />
              <Field label="Frecuencia" value={selected.frequencyKHz ? `${selected.frequencyKHz} kHz` : "—"} />
              <Field label="Variable de salida" value={selected.outputVariable} />
              <Field label="Variables requeridas" value={selected.variablesRequired} />
              <Field label="Unidades requeridas" value={selected.unitsRequired} />
              <Field label="SEE (error estándar)" value={selected.see !== null ? `± ${selected.see}` : "—"} />
              <Field label="R²" value={selected.r2 !== null ? selected.r2.toFixed(2) : "—"} />
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">Fórmula</h4>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto font-mono">{selected.formula}</pre>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">Referencia</h4>
              <p className="text-xs text-muted-foreground">{selected.reference}</p>
              {selected.doi && <p className="text-xs text-muted-foreground mt-1">DOI: {selected.doi}</p>}
            </div>
            {selected.limitations && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Limitaciones</h4>
                <p className="text-xs text-muted-foreground">{selected.limitations}</p>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground border-t pt-2">
              La estimación supone una hidratación aproximada del 73% de la masa libre de grasa.
              Este supuesto puede variar según edad, sexo, estado fisiológico, hidratación,
              entrenamiento, enfermedad y otras características individuales.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
