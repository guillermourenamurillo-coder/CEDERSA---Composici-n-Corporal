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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Cpu, Plus, CpuIcon } from "lucide-react";

interface Device {
  id: string;
  manufacturer: string;
  model: string;
  serialNumber: string | null;
  biaType: string;
  electrodesCount: number | null;
  frequenciesKHz: string | null;
  softwareName: string | null;
  softwareVersion: string | null;
  calibrationDate: string | null;
  createdAt: string;
  _count?: { measurements: number };
}

export function DispositivosSection() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery<Device[]>({
    queryKey: ["devices"],
    queryFn: async () => {
      const r = await fetch("/api/devices");
      if (!r.ok) throw new Error("Error al cargar dispositivos");
      return r.json();
    },
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: any = Object.fromEntries(fd.entries());
    if (body.electrodesCount) body.electrodesCount = Number(body.electrodesCount);
    else delete body.electrodesCount;
    try {
      const r = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || "Error al guardar");
      }
      toast.success("Dispositivo registrado");
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      setOpen(false);
      (e.target as HTMLFormElement).reset();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-primary" /> Dispositivos
          </h2>
          <p className="text-sm text-muted-foreground">
            BIA registrados en el centro (InBody, otro fabricante, tipo SFBIA/MFBIA/BIS).
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Registrar dispositivo</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar dispositivo</DialogTitle>
              <DialogDescription>
                Incluya fabricante, modelo, tipo de BIA y, si se conoce, frecuencias y fecha de calibración.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="manufacturer">Fabricante *</Label>
                  <Input id="manufacturer" name="manufacturer" required placeholder="InBody" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="model">Modelo *</Label>
                  <Input id="model" name="model" required placeholder="InBody 770" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="serialNumber">Número de serie</Label>
                  <Input id="serialNumber" name="serialNumber" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="biaType">Tipo de BIA *</Label>
                  <Select name="biaType" defaultValue="SFBIA">
                    <SelectTrigger id="biaType"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SFBIA">SFBIA — frecuencia única</SelectItem>
                      <SelectItem value="MFBIA">MFBIA — multifrecuencia</SelectItem>
                      <SelectItem value="BIS">BIS — espectroscópica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="electrodesCount">Electrodos</Label>
                  <Input id="electrodesCount" name="electrodesCount" type="number" placeholder="8" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="frequenciesKHz">Frecuencias (kHz)</Label>
                  <Input id="frequenciesKHz" name="frequenciesKHz" placeholder="1,5,50,250,500" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="softwareName">Software</Label>
                  <Input id="softwareName" name="softwareName" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="softwareVersion">Versión</Label>
                  <Input id="softwareVersion" name="softwareVersion" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="calibrationDate">Fecha de calibración</Label>
                  <Input id="calibrationDate" name="calibrationDate" type="date" />
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
          <CardTitle className="text-base">Dispositivos registrados ({data?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fabricante / Modelo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Electrodos</TableHead>
                  <TableHead>Frecuencias</TableHead>
                  <TableHead>Software</TableHead>
                  <TableHead>Calibración</TableHead>
                  <TableHead>Mediciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground text-sm">Cargando...</TableCell>
                  </TableRow>
                ) : data && data.length > 0 ? (
                  data.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">
                        {d.manufacturer} {d.model}
                        {d.serialNumber && <div className="text-[11px] text-muted-foreground">S/N: {d.serialNumber}</div>}
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-[11px]">{d.biaType}</Badge></TableCell>
                      <TableCell className="text-sm">{d.electrodesCount ?? "—"}</TableCell>
                      <TableCell className="text-xs">{d.frequenciesKHz || "—"}</TableCell>
                      <TableCell className="text-sm">
                        {d.softwareName ? `${d.softwareName} ${d.softwareVersion || ""}` : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {d.calibrationDate ? new Date(d.calibrationDate).toLocaleDateString("es-CR") : "—"}
                      </TableCell>
                      <TableCell className="text-sm">{d._count?.measurements ?? 0}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground text-sm">Sin dispositivos.</TableCell>
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

// evita advertencia de import no usado
export const _Cpu = CpuIcon;
