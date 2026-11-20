import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAppSession, unauthorizedResponse, forbiddenResponse, logAction } from "@/lib/permissions";

export async function GET() {
  const user = await getAppSession();
  if (!user) return unauthorizedResponse();
  const devices = await db.device.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { measurements: true } } },
  });
  return Response.json(devices);
}

export async function POST(req: NextRequest) {
  const user = await getAppSession();
  if (!user) return unauthorizedResponse();
  if (user.role !== "ADMIN" && user.role !== "EVALUADOR") return forbiddenResponse();
  const body = await req.json();
  if (!body.manufacturer || !body.model || !body.biaType) {
    return Response.json({ error: "manufacturer, model y biaType son requeridos" }, { status: 400 });
  }
  const created = await db.device.create({
    data: {
      manufacturer: body.manufacturer,
      model: body.model,
      serialNumber: body.serialNumber || null,
      biaType: body.biaType,
      electrodesCount: body.electrodesCount ? Number(body.electrodesCount) : null,
      frequenciesKHz: body.frequenciesKHz || null,
      softwareName: body.softwareName || null,
      softwareVersion: body.softwareVersion || null,
      calibrationDate: body.calibrationDate ? new Date(body.calibrationDate) : null,
    },
  });
  await logAction(user.id, "CREATE", `Dispositivo creado: ${created.manufacturer} ${created.model}`);
  return Response.json(created, { status: 201 });
}
