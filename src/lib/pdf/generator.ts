// Generador de reportes PDF para evaluaciones de composición corporal.
// Genera el documento con jsPDF + autotable y devuelve un Buffer.
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Prisma } from "@prisma/client";
import { NON_DIAGNOSTIC_FOOTER, HYDRATION_NOTE } from "@/lib/equations/hydration";

type MeasurementWithRelations = Prisma.MeasurementGetPayload<{
  include: {
    participant: true;
    device: true;
    evaluator: true;
    equation: true;
    conditions: true;
    bodyComposition: true;
  };
}>;

function fmt(n: number | null | undefined, suffix = ""): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${n.toFixed(1)}${suffix}`;
}

function fmtDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function computeAge(birthDate: Date | string, at: Date | string): number {
  const b = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  const a = typeof at === "string" ? new Date(at) : at;
  let age = a.getFullYear() - b.getFullYear();
  const m = a.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && a.getDate() < b.getDate())) age--;
  return age;
}

export function generateMeasurementPdf(measurement: MeasurementWithRelations): Buffer {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  // Encabezado
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Universidad Nacional · CIEMHCAVI · CEDERSA", margin, 32);
  doc.setFontSize(16);
  doc.setTextColor(15, 118, 110); // teal-700
  doc.text("Evaluación de Composición Corporal", margin, 54);
  doc.setDrawColor(15, 118, 110);
  doc.setLineWidth(1.5);
  doc.line(margin, 62, pageWidth - margin, 62);

  let y = 80;

  // Datos generales
  doc.setFontSize(11);
  doc.setTextColor(20);
  doc.text("1. Datos generales", margin, y);
  y += 14;
  const p = measurement.participant;
  const age = computeAge(p.birthDate, measurement.measuredAt);
  autoTable(doc, {
    startY: y,
    head: [["Campo", "Valor"]],
    body: [
      ["Código interno", p.internalId],
      ["Nombre", p.fullName],
      ["Sexo", p.sex],
      ["Edad al medir", `${age} años`],
      ["Altura", fmt(p.heightCm, " cm")],
      ["Categoría", p.populationCategory || "—"],
      ["Fecha de medición", fmtDate(measurement.measuredAt)],
      ["Evaluador", measurement.evaluator.name],
    ],
    theme: "striped",
    headStyles: { fillColor: [15, 118, 110], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  });
  y = (doc as any).lastAutoTable.finalY + 18;

  // Dispositivo y origen
  doc.setFontSize(11);
  doc.setTextColor(20);
  doc.text("2. Dispositivo y origen de los datos", margin, y);
  y += 14;
  autoTable(doc, {
    startY: y,
    head: [["Campo", "Valor"]],
    body: [
      ["Fabricante / Modelo", `${measurement.device.manufacturer} ${measurement.device.model}`],
      ["Tipo de BIA", measurement.device.biaType],
      ["Frecuencia", measurement.frequencyKHz ? `${measurement.frequencyKHz} kHz` : "—"],
      ["Origen de datos", measurement.dataOrigin],
    ],
    theme: "striped",
    headStyles: { fillColor: [15, 118, 110], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  });
  y = (doc as any).lastAutoTable.finalY + 18;

  // Condiciones de medición
  doc.setFontSize(11);
  doc.setTextColor(20);
  doc.text("3. Condiciones de medición", margin, y);
  y += 14;
  const c = measurement.conditions;
  autoTable(doc, {
    startY: y,
    head: [["Condición", "Estado"]],
    body: [
      ["Hidratado", c?.hydrated ? "Sí" : c?.hydrated === false ? "No" : "—"],
      ["Sin ejercicio reciente", c?.recentExercise === false ? "Sí" : c?.recentExercise ? "No" : "—"],
      ["Sin alimentación reciente", c?.recentFood === false ? "Sí" : c?.recentFood ? "No" : "—"],
      ["Sin alcohol reciente", c?.recentAlcohol === false ? "Sí" : c?.recentAlcohol ? "No" : "—"],
      ["Vejiga vaciada", c?.voidedBladder ? "Sí" : c?.voidedBladder === false ? "No" : "—"],
      ["Sin edema", c?.edema === false ? "Sí" : c?.edema ? "No" : "—"],
      ["Metal retirado", c?.removedMetal ? "Sí" : "—"],
      ["Postura correcta", c?.correctPosture ? "Sí" : "—"],
      ["Calidad", qualityLabel(measurement.qualityScore)],
    ],
    theme: "striped",
    headStyles: { fillColor: [15, 118, 110], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  });
  y = (doc as any).lastAutoTable.finalY + 18;

  // Resultados InBody
  doc.setFontSize(11);
  doc.setTextColor(20);
  doc.text("4. Resultados proporcionados por el dispositivo InBody", margin, y);
  y += 14;
  autoTable(doc, {
    startY: y,
    head: [["Variable", "Valor"]],
    body: [
      ["Masa muscular (kg)", fmt(measurement.inbodyMuscleMass)],
      ["Masa grasa (kg)", fmt(measurement.inbodyFatMass)],
      ["% de grasa", fmt(measurement.inbodyFatPercent, " %")],
      ["Grasa visceral", fmt(measurement.inbodyVisceralFat)],
      ["Agua corporal total (kg)", fmt(measurement.inbodyTBW)],
      ["Agua extracelular (kg)", fmt(measurement.inbodyECW)],
      ["Agua intracelular (kg)", fmt(measurement.inbodyICW)],
    ],
    theme: "striped",
    headStyles: { fillColor: [217, 119, 6], textColor: 255, fontSize: 9 }, // amber-600
    bodyStyles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  });
  y = (doc as any).lastAutoTable.finalY + 6;
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("Resultado proporcionado por el dispositivo InBody.", margin, y);
  y += 16;

  // Resultados calculados
  doc.setFontSize(11);
  doc.setTextColor(20);
  doc.text("5. Estimación científica (calculada mediante ecuación)", margin, y);
  y += 14;
  const eq = measurement.equation;
  const seeLine =
    eq?.see && measurement.calcFFM
      ? `Incertidumbre aproximada: ± ${(eq.see).toFixed(2)} kg (SEE)`
      : "Incertidumbre no disponible (sin SEE reportado).";
  autoTable(doc, {
    startY: y,
    head: [["Variable", "Valor"]],
    body: [
      ["Índice de resistencia H²/R", fmt(measurement.calcResistanceIndex, " cm²/ohm")],
      ["Masa libre de grasa (kg)", fmt(measurement.calcFFM)],
      ["Masa grasa (kg)", fmt(measurement.calcFM)],
      ["% de grasa", fmt(measurement.calcFatPercent, " %")],
      ["FFMI (kg/m²)", fmt(measurement.calcFFMI)],
      ["FMI (kg/m²)", fmt(measurement.calcFMI)],
      ["Ángulo de fase (°)", fmt(measurement.calcPhaseAngle)],
      ["Agua corporal total (kg)", fmt(measurement.calcTBW)],
    ],
    theme: "striped",
    headStyles: { fillColor: [5, 150, 105], textColor: 255, fontSize: 9 }, // emerald-600
    bodyStyles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  });
  y = (doc as any).lastAutoTable.finalY + 6;
  doc.setFontSize(8);
  doc.setTextColor(120);
  if (eq) {
    doc.text(
      `Ecuación: ${eq.authors} (${eq.year}). ${eq.name}.`,
      margin,
      y
    );
    y += 10;
    doc.text(`Referencia: ${eq.reference}${eq.doi ? ` · DOI: ${eq.doi}` : ""}`, margin, y);
    y += 10;
    doc.text(`Fórmula: ${eq.formula}`, margin, y);
    y += 10;
  }
  doc.text(seeLine, margin, y);
  y += 14;

  // Interpretación
  doc.setFontSize(11);
  doc.setTextColor(20);
  doc.text("6. Interpretación", margin, y);
  y += 14;
  const interpLines = buildInterpretation(measurement);
  doc.setFontSize(9);
  doc.setTextColor(40);
  for (const line of interpLines) {
    const wrapped = doc.splitTextToSize(line, pageWidth - margin * 2);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 12 + 4;
  }

  // Nota metodológica de hidratación
  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(120);
  const hydroWrap = doc.splitTextToSize(`Nota metodológica: ${HYDRATION_NOTE}`, pageWidth - margin * 2);
  doc.text(hydroWrap, margin, y);
  y += hydroWrap.length * 11 + 8;

  // Pie de página en cada página
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const h = doc.internal.pageSize.getHeight();
    doc.setFontSize(7.5);
    doc.setTextColor(120);
    const footerWrapped = doc.splitTextToSize(NON_DIAGNOSTIC_FOOTER, pageWidth - margin * 2);
    doc.text(footerWrapped, margin, h - 24);
    doc.text(
      `Página ${i} de ${pageCount} · Generado ${fmtDate(new Date())} · CEDERSA`,
      margin,
      h - 12
    );
  }

  return Buffer.from(doc.output("arraybuffer"));
}

function qualityLabel(s: string): string {
  switch (s) {
    case "VERDE":
      return "Condiciones adecuadas";
    case "AMARILLO":
      return "Precaución";
    case "ROJO":
      return "Condiciones potencialmente inadecuadas";
    default:
      return s;
  }
}

// Frases interpretativas NO diagnósticas.
function buildInterpretation(m: MeasurementWithRelations): string[] {
  const lines: string[] = [];
  if (m.calcFFMI !== null && m.calcFFMI !== undefined) {
    if (m.participant.sex === "MASCULINO" && m.calcFFMI < 18.9) {
      lines.push("El índice de masa libre de grasa se ubica por debajo del rango de referencia utilizado para hombres adultos.");
    } else if (m.participant.sex === "FEMENINO" && m.calcFFMI < 14.9) {
      lines.push("El índice de masa libre de grasa se ubica por debajo del rango de referencia utilizado para mujeres adultas.");
    } else {
      lines.push("El índice de masa libre de grasa se encuentra dentro del rango de referencia utilizado.");
    }
  }
  if (m.calcFatPercent !== null && m.calcFatPercent !== undefined) {
    if (m.calcFatPercent > 25 && m.participant.sex === "MASCULINO") {
      lines.push("El porcentaje de grasa estimado se ubica por encima del rango de referencia utilizado para hombres adultos.");
    } else if (m.calcFatPercent > 32 && m.participant.sex === "FEMENINO") {
      lines.push("El porcentaje de grasa estimado se ubica por encima del rango de referencia utilizado para mujeres adultas.");
    } else {
      lines.push("El porcentaje de grasa estimado se encuentra dentro del rango de referencia utilizado.");
    }
  }
  if (m.qualityScore !== "VERDE") {
    lines.push("Las condiciones de medición pueden afectar la precisión del resultado; considere repetir la evaluación bajo protocolo estandarizado.");
  }
  lines.push("El resultado debe interpretarse junto con antecedentes clínicos, rendimiento físico y otras evaluaciones.");
  return lines;
}
