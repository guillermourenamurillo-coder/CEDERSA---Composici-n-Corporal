import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAppSession, forbiddenResponse, unauthorizedResponse } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const user = await getAppSession();
  if (!user) return unauthorizedResponse();
  if (user.role === "USUARIO") return forbiddenResponse();
  const url = new URL(req.url);
  const participantId = url.searchParams.get("participantId");
  const where: any = {};
  if (participantId) where.participantId = participantId;
  const measurements = await db.measurement.findMany({
    where,
    orderBy: { measuredAt: "desc" },
    include: {
      participant: true,
      device: true,
      equation: true,
      evaluator: { select: { id: true, name: true, email: true } },
    },
    take: 200,
  });
  return Response.json(measurements);
}

export async function POST(req: NextRequest) {
  const user = await getAppSession();
  if (!user) return unauthorizedResponse();
  if (user.role !== "ADMIN" && user.role !== "EVALUADOR") return forbiddenResponse();
  const body = await req.json();
  if (!body.participantId || !body.deviceId) {
    return Response.json({ error: "participantId y deviceId son requeridos" }, { status: 400 });
  }
  const participant = await db.participant.findUnique({ where: { id: body.participantId } });
  if (!participant) return Response.json({ error: "Participante no encontrado" }, { status: 404 });
  const device = await db.device.findUnique({ where: { id: body.deviceId } });
  if (!device) return Response.json({ error: "Dispositivo no encontrado" }, { status: 404 });

  const measuredAt = body.measuredAt ? new Date(body.measuredAt) : new Date();
  const heightCm = body.heightCm ? Number(body.heightCm) : participant.heightCm;
  const weightKg = body.weightKg ? Number(body.weightKg) : null;
  const R = body.resistanceR ? Number(body.resistanceR) : null;
  const Xc = body.reactanceXc ? Number(body.reactanceXc) : null;

  // Cálculos transparentes si hay R y altura
  let calcResistanceIndex: number | null = null;
  let calcPhaseAngle: number | null = null;
  let calcFFM: number | null = null;
  let calcFM: number | null = null;
  let calcFatPercent: number | null = null;
  let calcFFMI: number | null = null;
  let calcFMI: number | null = null;
  let calcTBW: number | null = null;

  if (R && heightCm) {
    calcResistanceIndex = (heightCm * heightCm) / R;
  }
  if (Xc && R) {
    calcPhaseAngle = (Math.atan(Xc / R) * 180) / Math.PI;
  }
  const eqId = body.equationId || null;
  let equation = null;
  if (eqId) {
    equation = await db.equation.findUnique({ where: { id: eqId } });
  }
  if (equation && R) {
    const age = measuredAt.getFullYear() - participant.birthDate.getFullYear();
    const sexCode = participant.sex === "MASCULINO" ? 1 : 0;
    // Importa el calculador (server-side)
    const { computeEquationOutput, computeFM, computeFatPercent, computeFFMI, computeFMI } =
      await import("@/lib/equations/bia");
    const { value } = computeEquationOutput(equation, {
      height: heightCm,
      weight: weightKg || undefined,
      R,
      Xc: Xc || undefined,
      age,
      sexCode,
    });
    if (value !== null) {
      if (equation.outputVariable === "FFM" && weightKg) {
        calcFFM = value;
        calcFM = computeFM(weightKg, value);
        calcFatPercent = computeFatPercent(calcFM, weightKg);
        calcFFMI = computeFFMI(value, heightCm / 100);
        calcFMI = computeFMI(calcFM, heightCm / 100);
      } else if (equation.outputVariable === "TBW") {
        calcTBW = value;
      }
    }
  }

  const created = await db.measurement.create({
    data: {
      participantId: body.participantId,
      deviceId: body.deviceId,
      evaluatorId: user.id,
      measuredAt,
      weightKg,
      heightCm,
      resistanceR: R,
      reactanceXc: Xc,
      impedanceZ: body.impedanceZ ? Number(body.impedanceZ) : null,
      phaseAngleDeg: body.phaseAngleDeg ? Number(body.phaseAngleDeg) : null,
      frequencyKHz: body.frequencyKHz ? Number(body.frequencyKHz) : null,
      segRArmR: body.segRArmR ? Number(body.segRArmR) : null,
      segLArmR: body.segLArmR ? Number(body.segLArmR) : null,
      segTrunkR: body.segTrunkR ? Number(body.segTrunkR) : null,
      segRLegR: body.segRLegR ? Number(body.segRLegR) : null,
      segLLegR: body.segLLegR ? Number(body.segLLegR) : null,
      segRArmXc: body.segRArmXc ? Number(body.segRArmXc) : null,
      segLArmXc: body.segLArmXc ? Number(body.segLArmXc) : null,
      segTrunkXc: body.segTrunkXc ? Number(body.segTrunkXc) : null,
      segRLegXc: body.segRLegXc ? Number(body.segRLegXc) : null,
      segLLegXc: body.segLLegXc ? Number(body.segLLegXc) : null,
      multiFreqData: body.multiFreqData || null,
      inbodyMuscleMass: body.inbodyMuscleMass ? Number(body.inbodyMuscleMass) : null,
      inbodyFatMass: body.inbodyFatMass ? Number(body.inbodyFatMass) : null,
      inbodyFatPercent: body.inbodyFatPercent ? Number(body.inbodyFatPercent) : null,
      inbodyVisceralFat: body.inbodyVisceralFat ? Number(body.inbodyVisceralFat) : null,
      inbodyTBW: body.inbodyTBW ? Number(body.inbodyTBW) : null,
      inbodyECW: body.inbodyECW ? Number(body.inbodyECW) : null,
      inbodyICW: body.inbodyICW ? Number(body.inbodyICW) : null,
      inbodySegmentalLean: body.inbodySegmentalLean || null,
      inbodyRawJson: body.inbodyRawJson || null,
      dataOrigin: body.dataOrigin || "MANUAL",
      equationId: eqId,
      calcResistanceIndex,
      calcTBW,
      calcFFM,
      calcFM,
      calcFatPercent,
      calcFFMI,
      calcFMI,
      calcPhaseAngle,
      qualityScore: body.qualityScore || "AMARILLO",
      qualityNotes: body.qualityNotes || null,
      conditions: body.conditions
        ? { create: normalizeConditions(body.conditions) }
        : undefined,
      bodyComposition: undefined,
    },
    include: { participant: true, device: true, equation: true, conditions: true },
  });
  return Response.json(created, { status: 201 });
}

function normalizeConditions(c: any) {
  const out: any = {};
  for (const k of [
    "hydrated",
    "recentExercise",
    "recentFood",
    "recentAlcohol",
    "voidedBladder",
    "edema",
    "similarToPrior",
    "removedMetal",
    "followedProtocol",
    "correctPosture",
  ]) {
    if (c[k] !== undefined) out[k] = !!c[k];
  }
  out.notes = c.notes || null;
  return out;
}
