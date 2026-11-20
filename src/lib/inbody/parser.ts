// Parser flexible de exportaciones de InBody.
// Los reportes varían entre modelos (InBody 270, 770, etc.). Este parser
// reconoce columnas por patrones de encabezado comunes.
export interface ParsedInBody {
  internalId?: string;
  fullName?: string;
  height?: number;
  weight?: number;
  // InBody propietarios
  inbodyTBW?: number;
  inbodyMuscleMass?: number;
  inbodyFatMass?: number;
  inbodyFatPercent?: number;
  inbodyVisceralFat?: number;
  inbodyECW?: number;
  inbodyICW?: number;
  // Eléctricos
  resistanceR?: number;
  reactanceXc?: number;
  impedanceZ?: number;
  phaseAngleDeg?: number;
  frequencyKHz?: number;
  // Segmentaria (ohmios) si está disponible
  segRArmR?: number;
  segLArmR?: number;
  segTrunkR?: number;
  segRLegR?: number;
  segLLegR?: number;
  segRArmXc?: number;
  segLArmXc?: number;
  segTrunkXc?: number;
  segRLegXc?: number;
  segLLegXc?: number;
  raw?: Record<string, string>;
}

// Tabla de alias (en minúsculas) -> campo destino.
const FIELD_ALIASES: Record<string, keyof ParsedInBody> = {
  id: "internalId",
  "internal id": "internalId",
  "participant id": "internalId",
  "no.": "internalId",
  no: "internalId",
  nombre: "fullName",
  name: "fullName",
  "full name": "fullName",
  "nombre completo": "fullName",
  altura: "height",
  height: "height",
  estatura: "height",
  peso: "weight",
  weight: "weight",
  "body weight": "weight",
  "total body water": "inbodyTBW",
  tbw: "inbodyTBW",
  "agua corporal total": "inbodyTBW",
  "masa muscular": "inbodyMuscleMass",
  "skeletal muscle mass": "inbodyMuscleMass",
  "muscle mass": "inbodyMuscleMass",
  smm: "inbodyMuscleMass",
  "body fat mass": "inbodyFatMass",
  "fat mass": "inbodyFatMass",
  "masa grasa": "inbodyFatMass",
  "percent body fat": "inbodyFatPercent",
  "% body fat": "inbodyFatPercent",
  "% grasa": "inbodyFatPercent",
  "body fat %": "inbodyFatPercent",
  "grasa porcentual": "inbodyFatPercent",
  "visceral fat": "inbodyVisceralFat",
  "grasa visceral": "inbodyVisceralFat",
  "extracellular water": "inbodyECW",
  ecw: "inbodyECW",
  "agua extracelular": "inbodyECW",
  "intracellular water": "inbodyICW",
  icw: "inbodyICW",
  "agua intracelular": "inbodyICW",
  resistance: "resistanceR",
  "resistencia (50khz)": "resistanceR",
  resistencia: "resistanceR",
  reactance: "reactanceXc",
  reactancia: "reactanceXc",
  impedance: "impedanceZ",
  impedancia: "impedanceZ",
  "phase angle": "phaseAngleDeg",
  "ángulo de fase": "phaseAngleDeg",
  "angulo de fase": "phaseAngleDeg",
  frequency: "frequencyKHz",
  frecuencia: "frequencyKHz",
  "ra resistance": "segRArmR",
  "right arm resistance": "segRArmR",
  "la resistance": "segLArmR",
  "left arm resistance": "segLArmR",
  "trunk resistance": "segTrunkR",
  "rl resistance": "segRLegR",
  "right leg resistance": "segRLegR",
  "ll resistance": "segLLegR",
  "left leg resistance": "segLLegR",
};

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[._-]/g, " ")
    .trim();
}

function toNumber(v: string | undefined): number | undefined {
  if (v === undefined || v === null) return undefined;
  const cleaned = String(v).replace(/[^\d.\-]/g, "");
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isNaN(n) ? undefined : n;
}

export function parseRow(row: Record<string, string>): ParsedInBody {
  const out: ParsedInBody = { raw: row };
  for (const key of Object.keys(row)) {
    const norm = normalizeHeader(key);
    const field = FIELD_ALIASES[norm];
    if (!field) continue;
    const val = row[key];
    if (field === "internalId" || field === "fullName") {
      (out as any)[field] = (out as any)[field] || (val?.trim() || undefined);
    } else {
      const n = toNumber(val);
      if (n !== undefined) (out as any)[field] = n;
    }
  }
  return out;
}

export function parseHeaders(headers: string[]): { raw: string; normalized: string; field?: keyof ParsedInBody }[] {
  return headers.map((h) => {
    const normalized = normalizeHeader(h);
    return { raw: h, normalized, field: FIELD_ALIASES[normalized] };
  });
}
