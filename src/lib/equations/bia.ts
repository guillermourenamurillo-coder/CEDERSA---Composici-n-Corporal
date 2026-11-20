// Motor de cálculo de bioimpedancia (BIA) — cálculos básicos transparentes
import type { Equation } from "@prisma/client";
import { evaluateFormula } from "./calculator";

// Índice de resistencia H²/R (H en cm, R en ohmios). Resultado en cm²/ohm.
export function resistanceIndex(heightCm: number, R: number): number {
  if (!R || R === 0) return 0;
  return (heightCm * heightCm) / R;
}

// Ángulo de fase en grados a partir de Xc y R.
export function phaseAngle(Xc: number, R: number): number {
  if (!R || R === 0) return 0;
  return (Math.atan(Xc / R) * 180) / Math.PI;
}

export interface BiaVariables {
  height?: number; // cm
  weight?: number; // kg
  R?: number; // ohmios
  Xc?: number; // ohmios
  Z?: number; // ohmios
  age?: number; // años
  sexCode?: number; // 1 = masculino, 0 = femenino
  [key: string]: number | undefined;
}

// Convierte un valor de una unidad a otra para los símbolos usados en ecuaciones.
// unitsRequired formato: "height=cm,weight=kg,R=ohm"
function conversionFactor(unit: string): number {
  switch (unit.toLowerCase()) {
    case "m":
      return 0.01; // cm -> m
    case "cm":
      return 1;
    case "kg":
      return 1;
    case "ohm":
    case "ohms":
      return 1;
    case "deg":
    case "degrees":
      return 1;
    default:
      return 1;
  }
}

// Aplica las conversiones requeridas por la ecuación.
// Garantiza que todas las variantes de mayúsculas/minúsculas de cada símbolo
// estén disponibles en el scope para que mathjs resuelva la fórmula sin
// importar la convención usada por los autores (height/Height, weight/Weight...).
export function normalizeVariables(
  vars: BiaVariables,
  equation: Pick<Equation, "unitsRequired">
): Record<string, number> {
  const out: Record<string, number> = {};
  const specs = (equation.unitsRequired || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  // Mapa de símbolo base -> variantes que se rellenan en el scope
  const aliasGroups: Record<string, { aliases: string[]; source: keyof BiaVariables }> = {
    height: { aliases: ["height", "H", "Height"], source: "height" },
    weight: { aliases: ["weight", "Weight"], source: "weight" },
    R: { aliases: ["R", "r"], source: "R" },
    Xc: { aliases: ["Xc", "xc"], source: "Xc" },
    Z: { aliases: ["Z", "z"], source: "Z" },
    age: { aliases: ["age", "Age"], source: "age" },
    SexCode: { aliases: ["SexCode", "sexCode"], source: "sexCode" },
  };
  // Construye un lookup rápido: nombre de símbolo (en spec) -> grupo
  const specToGroup: Record<string, typeof aliasGroups[string]> = {};
  for (const g of Object.values(aliasGroups)) {
    for (const a of g.aliases) specToGroup[a] = g;
  }
  for (const spec of specs) {
    const [varName, unit] = spec.split("=").map((s) => s.trim());
    const group = specToGroup[varName];
    if (!group) continue;
    const raw = vars[group.source];
    if (raw === undefined || raw === null || Number.isNaN(raw)) continue;
    const factor = conversionFactor(unit || "");
    const value = raw * factor;
    for (const alias of group.aliases) {
      if (out[alias] === undefined) out[alias] = value;
    }
  }
  return out;
}

// Calcula la variable de salida de la ecuación (FFM, TBW, etc.)
export function computeEquationOutput(
  equation: Equation,
  vars: BiaVariables
): { value: number | null; variables: Record<string, number> } {
  const variables = normalizeVariables(vars, equation);
  const required = (equation.variablesRequired || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const aliases: Record<string, string[]> = {
    height: ["height", "H"],
    weight: ["weight", "Weight"],
    R: ["R"],
    Xc: ["Xc"],
    age: ["age", "Age"],
    sexCode: ["SexCode", "sexCode"],
  };
  for (const req of required) {
    const keys = aliases[req] || [req];
    const found = keys.some((k) => variables[k] !== undefined && !Number.isNaN(variables[k]));
    if (!found) return { value: null, variables };
  }
  try {
    const value = evaluateFormula(equation.formula, variables);
    if (!Number.isFinite(value)) return { value: null, variables };
    return { value, variables };
  } catch {
    return { value: null, variables };
  }
}

// Masa grasa = peso - FFM
export function computeFM(weightKg: number, ffm: number): number {
  return weightKg - ffm;
}

// Porcentaje de grasa
export function computeFatPercent(fm: number, weightKg: number): number {
  if (!weightKg) return 0;
  return (fm / weightKg) * 100;
}

// Índice de masa libre de grasa (FFMI) en kg/m²
export function computeFFMI(ffm: number, heightM: number): number {
  if (!heightM) return 0;
  return ffm / (heightM * heightM);
}

// Índice de masa grasa (FMI) en kg/m²
export function computeFMI(fm: number, heightM: number): number {
  if (!heightM) return 0;
  return fm / (heightM * heightM);
}

// Índice de masa muscular esquelética (SMI) en kg/m²
export function computeSMI(smm: number, heightM: number): number {
  if (!heightM) return 0;
  return smm / (heightM * heightM);
}
