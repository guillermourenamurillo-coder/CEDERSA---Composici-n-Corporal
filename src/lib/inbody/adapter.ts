// Adaptador InBody — importa CSV/XLSX y normaliza las mediciones.
// Marcado explícito: los valores importados llevan la bandera `providedByInBody`.
import * as XLSX from "xlsx";
import { parseRow, parseHeaders, type ParsedInBody } from "./parser";

export interface InBodyParseResult {
  records: (ParsedInBody & { providedByInBody: true })[];
  unrecognizedHeaders: string[];
  recognizedCount: number;
}

function parseCsvText(text: string): InBodyParseResult {
  // Implementación simple de CSV tolerante a comillas.
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { records: [], unrecognizedHeaders: [], recognizedCount: 0 };
  }
  const splitLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuote && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (c === "," && !inQuote) {
        result.push(cur);
        cur = "";
      } else {
        cur += c;
      }
    }
    result.push(cur);
    return result;
  };
  const headers = splitLine(lines[0]);
  const recognized = parseHeaders(headers);
  const recognizedCount = recognized.filter((h) => h.field).length;
  const unrecognizedHeaders = recognized.filter((h) => !h.field).map((h) => h.raw);
  const records: (ParsedInBody & { providedByInBody: true })[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => (row[h] = values[idx] ?? ""));
    records.push({ ...parseRow(row), providedByInBody: true });
  }
  return { records, unrecognizedHeaders, recognizedCount };
}

function parseWorkbook(wb: XLSX.WorkBook): InBodyParseResult {
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { records: [], unrecognizedHeaders: [], recognizedCount: 0 };
  const sheet = wb.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  if (json.length === 0) return { records: [], unrecognizedHeaders: [], recognizedCount: 0 };
  const headers = Object.keys(json[0]);
  const recognized = parseHeaders(headers);
  const recognizedCount = recognized.filter((h) => h.field).length;
  const unrecognizedHeaders = recognized.filter((h) => !h.field).map((h) => h.raw);
  const records: (ParsedInBody & { providedByInBody: true })[] = [];
  for (const row of json) {
    const stringRow: Record<string, string> = {};
    for (const k of Object.keys(row)) {
      stringRow[k] = row[k] === null || row[k] === undefined ? "" : String(row[k]);
    }
    records.push({ ...parseRow(stringRow), providedByInBody: true });
  }
  return { records, unrecognizedHeaders, recognizedCount };
}

export class InBodyAdapter {
  async importCSV(fileBuffer: Buffer | string): Promise<InBodyParseResult> {
    const text = typeof fileBuffer === "string" ? fileBuffer : fileBuffer.toString("utf-8");
    return parseCsvText(text);
  }

  async importExcel(fileBuffer: Buffer): Promise<InBodyParseResult> {
    const wb = XLSX.read(fileBuffer, { type: "buffer" });
    return parseWorkbook(wb);
  }

  // Normaliza unidades: asume que la exportación viene en cm/kg/ohm.
  normalizeUnits(m: ParsedInBody): ParsedInBody {
    return { ...m };
  }

  // Valida que el registro tenga al menos una variable aprovechable.
  validateMeasurement(m: ParsedInBody): { ok: boolean; warnings: string[] } {
    const warnings: string[] = [];
    if (m.height === undefined) warnings.push("Falta la altura (estatura).");
    if (m.weight === undefined) warnings.push("Falta el peso.");
    if (m.resistanceR === undefined && m.impedanceZ === undefined) {
      warnings.push("Falta resistencia o impedancia (no se podrá aplicar ecuación BIA).");
    }
    const ok = m.height !== undefined || m.weight !== undefined || m.resistanceR !== undefined;
    return { ok, warnings };
  }

  parseMeasurement(json: Record<string, unknown>): ParsedInBody {
    const flat: Record<string, string> = {};
    for (const k of Object.keys(json)) {
      flat[k] = json[k] === null || json[k] === undefined ? "" : String(json[k]);
    }
    return parseRow(flat);
  }
}

export const inbodyAdapter = new InBodyAdapter();
