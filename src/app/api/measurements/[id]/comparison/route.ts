import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAppSession, forbiddenResponse, unauthorizedResponse, notFoundResponse } from "@/lib/permissions";

// Devuelve la medición actual, la anterior y los deltas.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAppSession();
  if (!user) return unauthorizedResponse();
  if (user.role === "USUARIO") return forbiddenResponse();
  const { id } = await params;
  const current = await db.measurement.findUnique({
    where: { id },
    include: { participant: true, device: true, equation: true, conditions: true },
  });
  if (!current) return notFoundResponse();
  const history = await db.measurement.findMany({
    where: { participantId: current.participantId, measuredAt: { lt: current.measuredAt } },
    orderBy: { measuredAt: "desc" },
    take: 2,
    include: { equation: true, device: true },
  });
  const previous = history[0] || null;
  const first = history[history.length - 1] || current;

  const deltas = previous ? computeDelta(current, previous) : null;
  return Response.json({ current, previous, first, deltas });
}

function computeDelta(curr: any, prev: any) {
  const fields = [
    "weightKg",
    "inbodyFatMass",
    "inbodyFatPercent",
    "inbodyMuscleMass",
    "inbodyTBW",
    "calcFFM",
    "calcFM",
    "calcFatPercent",
    "calcFFMI",
    "calcFMI",
    "calcTBW",
    "resistanceR",
    "reactanceXc",
    "phaseAngleDeg",
    "calcPhaseAngle",
  ];
  const out: Record<string, { delta: number | null; percent: number | null }> = {};
  for (const f of fields) {
    const a = curr[f];
    const b = prev[f];
    if (typeof a === "number" && typeof b === "number" && b !== 0) {
      out[f] = { delta: a - b, percent: ((a - b) / b) * 100 };
    } else {
      out[f] = { delta: null, percent: null };
    }
  }
  return out;
}
