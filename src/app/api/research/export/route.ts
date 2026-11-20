import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAppSession, forbiddenResponse, unauthorizedResponse, logAction } from "@/lib/permissions";

// GET /api/research/export — exporta dataset anónimo en CSV.
// No incluye nombres ni identificadores personales.
export async function GET(req: NextRequest) {
  const user = await getAppSession();
  if (!user) return unauthorizedResponse();
  if (user.role !== "ADMIN" && user.role !== "INVESTIGADOR") return forbiddenResponse();

  const url = new URL(req.url);
  const sex = url.searchParams.get("sex");
  const ageMin = url.searchParams.get("ageMin");
  const ageMax = url.searchParams.get("ageMax");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const equationId = url.searchParams.get("equationId");
  const population = url.searchParams.get("population");

  const measurements = await db.measurement.findMany({
    where: equationId ? { equationId } : {},
    include: { participant: true, device: true, equation: true },
    orderBy: { measuredAt: "asc" },
    take: 5000,
  });

  const now = new Date();
  const filtered = measurements.filter((m) => {
    if (sex && m.participant.sex !== sex) return false;
    const age = m.measuredAt.getFullYear() - m.participant.birthDate.getFullYear();
    if (ageMin && age < Number(ageMin)) return false;
    if (ageMax && age > Number(ageMax)) return false;
    if (from && new Date(m.measuredAt) < new Date(from)) return false;
    if (to && new Date(m.measuredAt) > new Date(to)) return false;
    if (population && m.participant.populationCategory !== population) return false;
    // Consentimiento requerido para investigación
    if (!m.participant.consentDataUse) return false;
    return true;
  });

  const headers = [
    "measurement_id_hash",
    "sex",
    "age",
    "height_cm",
    "population_category",
    "is_athlete",
    "device_type",
    "frequency_khz",
    "measured_at",
    "weight_kg",
    "resistance_r",
    "reactance_xc",
    "impedance_z",
    "phase_angle_deg",
    "inbody_muscle_mass",
    "inbody_fat_mass",
    "inbody_fat_percent",
    "inbody_tbw",
    "equation_name",
    "equation_year",
    "calc_resistance_index",
    "calc_ffm",
    "calc_fm",
    "calc_fat_percent",
    "calc_ffmi",
    "calc_fmi",
    "calc_tbw",
    "calc_phase_angle",
    "quality_score",
  ];

  // CSV con escape simple de comillas
  const rows = filtered.map((m) => {
    const age = m.measuredAt.getFullYear() - m.participant.birthDate.getFullYear();
    const idHash = simpleHash(m.id);
    return [
      idHash,
      m.participant.sex,
      age,
      m.heightCm ?? "",
      m.participant.populationCategory ?? "",
      m.participant.isAthlete ? "1" : "0",
      m.device.biaType,
      m.frequencyKHz ?? "",
      m.measuredAt.toISOString(),
      m.weightKg ?? "",
      m.resistanceR ?? "",
      m.reactanceXc ?? "",
      m.impedanceZ ?? "",
      m.phaseAngleDeg ?? "",
      m.inbodyMuscleMass ?? "",
      m.inbodyFatMass ?? "",
      m.inbodyFatPercent ?? "",
      m.inbodyTBW ?? "",
      m.equation?.name ?? "",
      m.equation?.year ?? "",
      m.calcResistanceIndex ?? "",
      m.calcFFM ?? "",
      m.calcFM ?? "",
      m.calcFatPercent ?? "",
      m.calcFFMI ?? "",
      m.calcFMI ?? "",
      m.calcTBW ?? "",
      m.calcPhaseAngle ?? "",
      m.qualityScore,
    ]
      .map((v) => escapeCsv(String(v)))
      .join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  await logAction(user.id, "EXPORT", `Exportación de investigación: ${filtered.length} registros`);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cedersa_dataset_anonimo_${now.toISOString().slice(0, 10)}.csv"`,
    },
  });
}

function escapeCsv(s: string): string {
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return `m${(h >>> 0).toString(16)}`;
}
