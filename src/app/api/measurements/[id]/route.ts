import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  getAppSession,
  forbiddenResponse,
  unauthorizedResponse,
  notFoundResponse,
  logAction,
} from "@/lib/permissions";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAppSession();
  if (!user) return unauthorizedResponse();
  if (user.role === "USUARIO") return forbiddenResponse();
  const { id } = await params;
  const m = await db.measurement.findUnique({
    where: { id },
    include: {
      participant: true,
      device: true,
      equation: true,
      evaluator: { select: { id: true, name: true, email: true } },
      conditions: true,
      bodyComposition: true,
    },
  });
  if (!m) return notFoundResponse();
  return Response.json(m);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAppSession();
  if (!user) return unauthorizedResponse();
  if (user.role !== "ADMIN") return forbiddenResponse();
  const { id } = await params;
  const existing = await db.measurement.findUnique({ where: { id } });
  if (!existing) return notFoundResponse();
  await db.measurement.delete({ where: { id } });
  await logAction(user.id, "DELETE", `Medición eliminada: ${id}`);
  return Response.json({ ok: true });
}
