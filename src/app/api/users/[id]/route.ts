import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  getAppSession,
  forbiddenResponse,
  unauthorizedResponse,
  notFoundResponse,
  logAction,
} from "@/lib/permissions";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAppSession();
  if (!user) return unauthorizedResponse();
  if (user.role !== "ADMIN") return forbiddenResponse();
  const { id } = await params;
  const body = await req.json();
  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) return notFoundResponse();
  const data: any = {};
  if (body.name) data.name = body.name;
  if (body.role) data.role = body.role;
  if (body.active !== undefined) data.active = !!body.active;
  if (body.password) data.passwordHash = await bcrypt.hash(body.password, 10);
  if (body.email && body.email !== existing.email) {
    const clash = await db.user.findUnique({ where: { email: body.email.toLowerCase().trim() } });
    if (clash) return Response.json({ error: "Correo en uso" }, { status: 409 });
    data.email = body.email.toLowerCase().trim();
  }
  const updated = await db.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true, active: true },
  });
  await logAction(user.id, "UPDATE", `Usuario actualizado: ${updated.email}`);
  return Response.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAppSession();
  if (!user) return unauthorizedResponse();
  if (user.role !== "ADMIN") return forbiddenResponse();
  const { id } = await params;
  if (id === user.id) return Response.json({ error: "No puede eliminar su propia cuenta" }, { status: 400 });
  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) return notFoundResponse();
  await db.user.delete({ where: { id } });
  await logAction(user.id, "DELETE", `Usuario eliminado: ${existing.email}`);
  return Response.json({ ok: true });
}
