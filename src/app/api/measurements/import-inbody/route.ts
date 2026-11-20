import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAppSession, forbiddenResponse, unauthorizedResponse } from "@/lib/permissions";
import { inbodyAdapter } from "@/lib/inbody/adapter";

// Importa un archivo CSV o XLSX de exportación de InBody.
// Multipart/form-data: campo `file` + `participantId` + `deviceId` (opcional,
// si no se indica crea mediciones pendientes sin dispositivo).
export async function POST(req: NextRequest) {
  const user = await getAppSession();
  if (!user) return unauthorizedResponse();
  if (user.role !== "ADMIN" && user.role !== "EVALUADOR") return forbiddenResponse();
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const participantId = (form.get("participantId") as string) || null;
  const deviceId = (form.get("deviceId") as string) || null;
  if (!file) {
    return Response.json({ error: "Archivo no recibido" }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  let result;
  try {
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      result = await inbodyAdapter.importExcel(buf);
    } else {
      result = await inbodyAdapter.importCSV(buf);
    }
  } catch (e: any) {
    return Response.json({ error: `Error al parsear el archivo: ${e?.message || e}` }, { status: 400 });
  }

  // Si se indica participante y dispositivo, crear mediciones directamente.
  const created: any[] = [];
  if (participantId && deviceId) {
    const participant = await db.participant.findUnique({ where: { id: participantId } });
    const device = await db.device.findUnique({ where: { id: deviceId } });
    if (!participant || !device) {
      return Response.json({ error: "Participante o dispositivo no encontrado" }, { status: 404 });
    }
    for (const rec of result.records) {
      const measuredAt = new Date();
      const m = await db.measurement.create({
        data: {
          participantId,
          deviceId,
          evaluatorId: user.id,
          measuredAt,
          weightKg: rec.weight ?? null,
          heightCm: rec.height ?? participant.heightCm,
          resistanceR: rec.resistanceR ?? null,
          reactanceXc: rec.reactanceXc ?? null,
          impedanceZ: rec.impedanceZ ?? null,
          phaseAngleDeg: rec.phaseAngleDeg ?? null,
          inbodyMuscleMass: rec.inbodyMuscleMass ?? null,
          inbodyFatMass: rec.inbodyFatMass ?? null,
          inbodyFatPercent: rec.inbodyFatPercent ?? null,
          inbodyVisceralFat: rec.inbodyVisceralFat ?? null,
          inbodyTBW: rec.inbodyTBW ?? null,
          inbodyECW: rec.inbodyECW ?? null,
          inbodyICW: rec.inbodyICW ?? null,
          dataOrigin: name.endsWith(".xlsx") ? "XLSX" : "CSV",
          qualityScore: "AMARILLO",
        },
      });
      created.push(m.id);
    }
  }

  return Response.json({
    imported: result.records.length,
    recognizedHeaders: result.recognizedCount,
    unrecognizedHeaders: result.unrecognizedHeaders,
    records: result.records,
    createdMeasurements: created,
  });
}
