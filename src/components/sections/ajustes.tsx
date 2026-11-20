"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Settings, Users, ScrollText, Plus, Pencil, Trash2 } from "lucide-react";
import { fmtDate } from "./_shared";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; role: string };
}

export function AjustesSection() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN") {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          Esta sección está reservada al rol ADMINISTRADOR.
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" /> Ajustes
        </h2>
        <p className="text-sm text-muted-foreground">
          Gestión de usuarios y bitácora de auditoría.
        </p>
      </div>
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users"><Users className="w-4 h-4 mr-1.5" /> Usuarios</TabsTrigger>
          <TabsTrigger value="audit"><ScrollText className="w-4 h-4 mr-1.5" /> Auditoría</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
          <UsersTab />
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <AuditTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsersTab() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const { data, isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => (await fetch("/api/users")).json(),
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: any = Object.fromEntries(fd.entries());
    if (!body.password) delete body.password;
    try {
      const url = editing ? `/api/users/${editing.id}` : "/api/users";
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
      toast.success(editing ? "Usuario actualizado" : "Usuario creado");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
      setEditing(null);
      (e.target as HTMLFormElement).reset();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function toggleActive(u: User) {
    try {
      const r = await fetch(`/api/users/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !u.active }),
      });
      if (!r.ok) throw new Error("Error al actualizar");
      toast.success(u.active ? "Usuario desactivado" : "Usuario activado");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function remove(u: User) {
    if (!confirm(`¿Eliminar a ${u.email}?`)) return;
    try {
      const r = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || "Error al eliminar");
      }
      toast.success("Usuario eliminado");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Usuarios ({data?.length || 0})</CardTitle>
            <CardDescription>Cuentas con acceso al sistema.</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Nuevo usuario</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editing ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
                <DialogDescription>
                  {editing ? "Actualice los datos." : "Defina correo, contraseña y rol."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" name="name" required defaultValue={editing?.name} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Correo</Label>
                  <Input id="email" name="email" type="email" required defaultValue={editing?.email} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">
                    Contraseña {editing && <span className="text-xs text-muted-foreground">(dejar vacío para no cambiar)</span>}
                  </Label>
                  <Input id="password" name="password" type="password" required={!editing} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="role">Rol</Label>
                  <Select name="role" defaultValue={editing?.role || "EVALUADOR"}>
                    <SelectTrigger id="role"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                      <SelectItem value="EVALUADOR">Evaluador</SelectItem>
                      <SelectItem value="INVESTIGADOR">Investigador</SelectItem>
                      <SelectItem value="USUARIO">Usuario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit">Guardar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Activo</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground text-sm">Cargando...</TableCell>
                </TableRow>
              ) : data && data.length > 0 ? (
                data.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[11px]">{u.role}</Badge></TableCell>
                    <TableCell>
                      <Switch checked={u.active} onCheckedChange={() => toggleActive(u)} />
                    </TableCell>
                    <TableCell className="text-sm">{fmtDate(u.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(u); setOpen(true); }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(u)}>
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground text-sm">Sin usuarios.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function AuditTab() {
  const { data, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["audit"],
    queryFn: async () => (await fetch("/api/audit")).json(),
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bitácora de auditoría</CardTitle>
        <CardDescription>Registro de acciones sensibles (login, crear, actualizar, eliminar, exportar).</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground text-sm">Cargando...</TableCell>
                </TableRow>
              ) : data && data.length > 0 ? (
                data.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-sm">{fmtDate(l.createdAt)}</TableCell>
                    <TableCell className="text-sm">
                      {l.user.name}
                      <div className="text-[11px] text-muted-foreground">{l.user.email}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-[11px]">{l.action}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.details || "—"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground text-sm">Sin registros.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
