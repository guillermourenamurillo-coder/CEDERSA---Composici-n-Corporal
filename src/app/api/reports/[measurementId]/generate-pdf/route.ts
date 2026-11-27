import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getAppSession,
  forbiddenResponse,
  unauthorizedResponse,
  notFoundResponse,
  logAction,
} from "@/lib/permissions";
import { generateMeasurementPdf } from "@/lib/pdf/generator";

// POST /api/reports/[measurementId]/generate-pdf — genera el reporte PDF.
//
// En Vercel serverless el filesystem es efímero y read-only salvo /tmp.
// Por eso devolvemos el PDF directamente como respuesta (streaming binary),
// sin escribirlo a disco. El navegador lo descarga o abre en nueva pestaña.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ measurementId: string }> }
) {
  const user = await getAppSession();
  if (!user) return unauthorizedResponse();
  if (user.role === "USUARIO") return forbiddenResponse();
  const { measurementId } = await params;
  const measurement = await db.measurement.findUnique({
    where: { id: measurementId },
    include: {
      participant: true,
      device: true,
      evaluator: true,
      equation: true,
      conditions: true,
      bodyComposition: true,
    },
  });
  if (!measurement) return notFoundResponse();

  const pdfBuffer = generateMeasurementPdf(measurement as any);

  // Registrar en BD (sin pdfPath persistente; el PDF se sirve on-demand).
  await db.report.create({
    data: {
      measurementId,
      generatedBy: user.id,
      pdfPath: null,
      includesCharts: true,
      includesComparison: true,
    },
  });
  await logAction(
    user.id,
    "EXPORT",
    `Reporte PDF generado para medición ${measurementId}`
  );

  // Devolver el PDF como respuesta binaria directa.
  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="reporte_${measurementId}.pdf"`,
      "Content-Length": String(pdfBuffer.length),
    },
  });
}
