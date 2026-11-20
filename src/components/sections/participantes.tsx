"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Search, Users, TrendingUp, Pencil } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { fmtDate } from "./_shared";

interface Participant {
  id: string;
  internalId: string;
  fullName: string;
  identification: string | null;
  sex: string;
  birthDate: string;
  heightCm: number;
  populationCategory: string | null;
  isAthlete: boolean;
  consentDataUse: boolean;
  createdAt: string;
  _count?: { measurements: number };
}

function age(birthDate: string) {
  const b = new Date(birthDate);
  return new Date().getFullYear() - b.getFullYear();
}

export function ParticipantesSection() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Participant | null>(null);
  const { startEvaluationFor, viewEvolutionFor } = useAppStore();

  const { data, isLoading } = useQuery<Participant[]>({
    queryKey: ["participants"],
    queryFn: async () => {
      const r = await fetch("/api/participants");
      if (!r.ok) throw new Error("Error al cargar participantes");
      return r.json();
    },
  });

  const filtered = (data || []).filter((p) => {
    const q = search.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.internalId.toLowerCase().includes(q) ||
      (p.identification || "").toLowerCase().includes(q)
    );
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    body.heightCm = Number(body.heightCm);
    body.isAthlete = body.isAthlete === "on";
    body.consentDataUse = body.consentDataUse === "on";
    try {
      const url = editing ? `/api/participants/${editing.id}` : "/api/participants";
      const method = editing ? "PUT" : "POST";
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || "Error al guardar");
      }
      toast.success(editing ? "Participante actualizado" : "Participante creado");
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      setOpen(false);
      setEditing(null);
      (e.target as HTMLFormElement).reset();
    } catch (e: any) {
      toast.error(e.message || "Error inesperado");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Participantes
          </h2>
          <p className="text-sm text-muted-foreground">
            Registro de personas evaluadas en el centro.
          </p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Nuevo participante
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar participante" : "Nuevo participante"}</DialogTitle>
              <DialogDescription>
                Registre los datos demográficos y antropométricos básicos.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="fullName">Nombre completo *</Label>
                  <Input id="fullName" name="fullName" required defaultValue={editing?.fullName} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="internalId">Código interno</Label>
                  <Input id="internalId" name="internalId" placeholder="Auto" defaultValue={editing?.internalId} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="identification">Identificación</Label>
                  <Input id="identification" name="identification" defaultValue={editing?.identification || ""} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sex">Sexo *</Label>
                  <Select name="sex" defaultValue={editing?.sex || "MASCULINO"}>
                    <SelectTrigger id="sex"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MASCULINO">Masculino</SelectItem>
                      <SelectItem value="FEMENINO">Femenino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="birthDate">Fecha de nacimiento *</Label>
                  <Input id="birthDate" name="birthDate" type="date" required defaultValue={editing?.birthDate?.slice(0, 10)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="heightCm">Altura (cm) *</Label>
                  <Input id="heightCm" name="heightCm" type="number" step="0.1" required defaultValue={editing?.heightCm} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="populationCategory">Categoría</Label>
                  <Select name="populationCategory" defaultValue={editing?.populationCategory || "poblacion_general"}>
                    <SelectTrigger id="populationCategory"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="poblacion_general">Población general</SelectItem>
                      <SelectItem value="atleta">Atleta</SelectItem>
                      <SelectItem value="adulto_mayor">Adulto mayor</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="physicalActivity">Actividad física</Label>
                  <Select name="physicalActivity" defaultValue={editing?.physicalActivity || "moderado"}>
                    <SelectTrigger id="physicalActivity"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentario">Sedentario</SelectItem>
                      <SelectItem value="ligero">Ligero</SelectItem>
                      <SelectItem value="moderado">Moderado</SelectItem>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="muy_activo">Muy activo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sport">Deporte</Label>
                  <Input id="sport" name="sport" defaultValue={editing?.sport || ""} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="observations">Observaciones</Label>
                  <Textarea id="observations" name="observations" rows={2} defaultValue={editing?.observations || ""} />
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <Checkbox id="isAthlete" name="isAthlete" defaultChecked={editing?.isAthlete} />
                  <Label htmlFor="isAthlete" className="text-sm font-normal cursor-pointer">Es atleta</Label>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <Checkbox id="consentDataUse" name="consentDataUse" defaultChecked={editing?.consentDataUse} />
                  <Label htmlFor="consentDataUse" className="text-sm font-normal cursor-pointer">
                    Consentimiento para uso anónimo de datos en investigación
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit">Guardar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-base">Listado ({filtered.length})</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, código o identificación"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Participante</TableHead>
                  <TableHead>Sexo</TableHead>
                  <TableHead>Edad</TableHead>
                  <TableHead>Altura</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Evaluaciones</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-muted-foreground text-sm">Cargando...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-muted-foreground text-sm">Sin participantes.</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.fullName}
                        <div className="text-[11px] text-muted-foreground">{p.internalId}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[11px]">
                          {p.sex === "MASCULINO" ? "M" : "F"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{age(p.birthDate)}a</TableCell>
                      <TableCell className="text-sm">{p.heightCm.toFixed(0)} cm</TableCell>
                      <TableCell className="text-sm capitalize">
                        {(p.populationCategory || "—").replace("_", " ")}
                      </TableCell>
                      <TableCell className="text-sm">{p._count?.measurements ?? 0}</TableCell>
                      <TableCell className="text-sm">{fmtDate(p.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => viewEvolutionFor(p.id)}
                            title="Ver evolución"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEvaluationFor(p.id)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setEditing(p); setOpen(true); }}
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
