import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAppSession, forbiddenResponse, unauthorizedResponse, logAction } from "@/lib/permissions";

// GET /api/participants — lista de participantes (requiere EVALUADOR o ADMIN).
export async function GET() {
  const user = await getAppSession();
  if (!user) return unauthorizedResponse();
  if (user.role !== "ADMIN" && user.role !== "EVALUADOR" && user.role !== "INVESTIGADOR") {
    return forbiddenResponse();
  }
  const participants = await db.participant.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { measurements: true } } },
  });
  return Response.json(participants);
}

// POST /api/participants — crear participante (EVALUADOR, ADMIN).
export async function POST(req: NextRequest) {
  const user = await getAppSession();
  if (!user) return unauthorizedResponse();
  if (user.role !== "ADMIN" && user.role !== "EVALUADOR") return forbiddenResponse();
  const body = await req.json();
  const required = ["fullName", "sex", "birthDate", "heightCm"];
  for (const f of required) {
    if (body[f] === undefined || body[f] === null || body[f] === "") {
      return Response.json({ error: `Campo requerido: ${f}` }, { status: 400 });
    }
  }
  const internalId = body.internalId || `P-${Date.now().toString(36).toUpperCase()}`;
  const created = await db.participant.create({
    data: {
      internalId,
      fullName: body.fullName,
      identification: body.identification || null,
      sex: body.sex,
      birthDate: new Date(body.birthDate),
      heightCm: Number(body.heightCm),
      physicalActivity: body.physicalActivity || null,
      populationCategory: body.populationCategory || null,
      isAthlete: !!body.isAthlete,
      sport: body.sport || null,
      observations: body.observations || null,
      consentDataUse: !!body.consentDataUse,
    },
  });
  await logAction(user.id, "CREATE", `Participante creado: ${created.internalId} - ${created.fullName}`);
  return Response.json(created, { status: 201 });
}
