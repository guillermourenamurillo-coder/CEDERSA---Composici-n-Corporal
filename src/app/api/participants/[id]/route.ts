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
  const { id } = await params;
  const p = await db.participant.findUnique({
    where: { id },
    include: {
      measurements: {
        orderBy: { measuredAt: "asc" },
        include: { device: true, equation: true },
      },
    },
  });
  if (!p) return notFoundResponse();
  return Response.json(p);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAppSession();
  if (!user) return unauthorizedResponse();
  if (user.role !== "ADMIN" && user.role !== "EVALUADOR") return forbiddenResponse();
  const { id } = await params;
  const body = await req.json();
  const existing = await db.participant.findUnique({ where: { id } });
  if (!existing) return notFoundResponse();
  const updated = await db.participant.update({
    where: { id },
    data: {
      fullName: body.fullName ?? existing.fullName,
      identification: body.identification ?? existing.identification,
      sex: body.sex ?? existing.sex,
      birthDate: body.birthDate ? new Date(body.birthDate) : existing.birthDate,
      heightCm: body.heightCm ? Number(body.heightCm) : existing.heightCm,
      physicalActivity: body.physicalActivity ?? existing.physicalActivity,
      populationCategory: body.populationCategory ?? existing.populationCategory,
      isAthlete: body.isAthlete ?? existing.isAthlete,
      sport: body.sport ?? existing.sport,
      observations: body.observations ?? existing.observations,
      consentDataUse: body.consentDataUse ?? existing.consentDataUse,
    },
  });
  await logAction(user.id, "UPDATE", `Participante actualizado: ${updated.internalId}`);
  return Response.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAppSession();
  if (!user) return unauthorizedResponse();
  if (user.role !== "ADMIN") return forbiddenResponse();
  const { id } = await params;
  const existing = await db.participant.findUnique({ where: { id } });
  if (!existing) return notFoundResponse();
  await db.participant.delete({ where: { id } });
  await logAction(user.id, "DELETE", `Participante eliminado: ${existing.internalId}`);
  return Response.json({ ok: true });
}
