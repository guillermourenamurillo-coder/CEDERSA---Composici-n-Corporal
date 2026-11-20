import { db } from "@/lib/db";
import { getAppSession, unauthorizedResponse } from "@/lib/permissions";

// GET /api/dashboard/stats — resumen administrativo de CEDERSA.
export async function GET() {
  const user = await getAppSession();
  if (!user) return unauthorizedResponse();

  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todayCount, monthCount, participantsCount, measurementsCount, devicesCount] = await Promise.all([
    db.measurement.count({ where: { measuredAt: { gte: startToday } } }),
    db.measurement.count({ where: { measuredAt: { gte: startMonth } } }),
    db.participant.count(),
    db.measurement.count(),
    db.device.count(),
  ]);

  // Distribución por sexo
  const sexDist = await db.participant.groupBy({
    by: ["sex"],
    _count: true,
  });

  // Rangos etarios (calculados en JS porque SQLite no tiene funciones de fecha ricas)
  const participants = await db.participant.findMany({ select: { birthDate: true } });
  const ageBuckets = { "<18": 0, "18-40": 0, "41-60": 0, "61+": 0 };
  for (const p of participants) {
    const age = now.getFullYear() - p.birthDate.getFullYear();
    if (age < 18) ageBuckets["<18"]++;
    else if (age <= 40) ageBuckets["18-40"]++;
    else if (age <= 60) ageBuckets["41-60"]++;
    else ageBuckets["61+"]++;
  }

  // Distribución por población
  const popDist = await db.participant.groupBy({
    by: ["populationCategory"],
    _count: true,
  });

  // Últimas evaluaciones
  const recent = await db.measurement.findMany({
    orderBy: { measuredAt: "desc" },
    take: 6,
    include: {
      participant: { select: { internalId: true, fullName: true } },
      device: { select: { manufacturer: true, model: true } },
    },
  });

  return Response.json({
    todayCount,
    monthCount,
    participantsCount,
    measurementsCount,
    devicesCount,
    sexDist,
    ageBuckets,
    popDist,
    recent,
  });
}
