import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAppSession, forbiddenResponse, unauthorizedResponse, notFoundResponse, logAction } from "@/lib/permissions";
import { generateMeasurementPdf } from "@/lib/pdf/generator";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// POST /api/reports/[measurementId]/generate-pdf — genera el reporte PDF.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ measurementId: string }> }) {
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
  const dir = path.join(process.cwd(), "public", "reports");
  await mkdir(dir, { recursive: true });
  const filename = `reporte_${measurement.id}.pdf`;
  await writeFile(path.join(dir, filename), pdfBuffer);

  const report = await db.report.create({
    data: {
      measurementId,
      generatedBy: user.id,
      pdfPath: `/reports/${filename}`,
      includesCharts: true,
      includesComparison: true,
    },
  });
  await logAction(user.id, "EXPORT", `Reporte PDF generado para medición ${measurementId}`);
  return Response.json({ ok: true, report, url: `/reports/${filename}` });
}
