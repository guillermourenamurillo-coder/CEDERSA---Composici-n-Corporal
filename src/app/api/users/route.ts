import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  getAppSession,
  forbiddenResponse,
  unauthorizedResponse,
  logAction,
} from "@/lib/permissions";
import bcrypt from "bcryptjs";

// GET /api/users — lista usuarios (solo ADMIN).
export async function GET() {
  const user = await getAppSession();
  if (!user) return unauthorizedResponse();
  if (user.role !== "ADMIN") return forbiddenResponse();
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });
  return Response.json(users);
}

// POST /api/users — crea un usuario (solo ADMIN).
export async function POST(req: NextRequest) {
  const user = await getAppSession();
  if (!user) return unauthorizedResponse();
  if (user.role !== "ADMIN") return forbiddenResponse();
  const body = await req.json();
  if (!body.email || !body.password || !body.name || !body.role) {
    return Response.json({ error: "email, password, name y role son requeridos" }, { status: 400 });
  }
  if (typeof body.password !== "string" || body.password.length < 8) {
    return Response.json(
      { error: "La contraseña debe tener al menos 8 caracteres." },
      { status: 400 }
    );
  }
  if (!["ADMIN", "EVALUADOR", "INVESTIGADOR", "USUARIO"].includes(body.role)) {
    return Response.json({ error: "Rol no válido" }, { status: 400 });
  }
  const existing = await db.user.findUnique({ where: { email: body.email.toLowerCase().trim() } });
  if (existing) {
    return Response.json({ error: "Ya existe un usuario con ese correo" }, { status: 409 });
  }
  const passwordHash = await bcrypt.hash(body.password, 10);
  const created = await db.user.create({
    data: {
      email: body.email.toLowerCase().trim(),
      passwordHash,
      name: body.name,
      role: body.role,
      active: body.active !== false,
    },
    select: { id: true, email: true, name: true, role: true, active: true },
  });
  await logAction(user.id, "CREATE", `Usuario creado: ${created.email} (${created.role})`);
  return Response.json(created, { status: 201 });
}
