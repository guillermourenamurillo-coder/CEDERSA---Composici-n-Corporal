// Selector de ecuaciones — algoritmo que recomienda la ecuación más adecuada
// según el perfil del participante y las variables disponibles.
import type { Equation, Sex } from "@prisma/client";
import { listActiveEquations } from "./registry";

export type MatchLevel = "ALTA" | "MODERADA" | "BAJA";

export interface SelectionInput {
  sex: Sex;
  age: number;
  isAthlete?: boolean;
  populationCategory?: string | null;
  deviceType?: string | null;
  variablesAvailable: string[]; // p. ej. ["height","weight","R","Xc","age"]
}

export interface SelectionResult {
  recommended: Equation | null;
  alternatives: Equation[];
  matchLevel: MatchLevel;
  reason: string;
}

function sexMatches(eqSex: string, sex: Sex): boolean {
  const s = eqSex?.toUpperCase();
  return s === "AMBOS" || s === sex;
}

function ageMatches(min: number | null | undefined, max: number | null | undefined, age: number): boolean {
  if (min !== null && min !== undefined && age < min) return false;
  if (max !== null && max !== undefined && age > max) return false;
  return true;
}

function variablesSatisfied(required: string, available: string[]): boolean {
  const reqList = required
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const aliases: Record<string, string[]> = {
    height: ["height", "h"],
    weight: ["weight"],
    r: ["r"],
    xc: ["xc"],
    age: ["age"],
    sexcode: ["sexcode"],
  };
  const avail = available.map((a) => a.toLowerCase());
  return reqList.every((r) => {
    const keys = aliases[r] || [r];
    return keys.some((k) => avail.includes(k));
  });
}

function scoreEquation(eq: Equation, input: SelectionInput): number {
  let score = 0;
  // Sexo: coincidencia exacta +20, AMBOS +12
  const s = eq.sex?.toUpperCase();
  if (s === input.sex) score += 20;
  else if (s === "AMBOS") score += 12;
  else return -1; // incompatible
  // Edad
  if (ageMatches(eq.ageRangeMin, eq.ageRangeMax, input.age)) score += 15;
  else return -1;
  // Variables requeridas disponibles
  if (variablesSatisfied(eq.variablesRequired, input.variablesAvailable)) score += 25;
  else return -1;
  // Población / atleta
  const pop = input.populationCategory || "";
  const eqPop = (eq.population || "").toLowerCase();
  if (input.isAthlete && /atleta|athlete|deport/i.test(eqPop)) score += 10;
  if (pop === "adulto_mayor" && /elder|mayor|old/i.test(eqPop)) score += 10;
  if (pop === "poblacion_general" && /general|healthy|adult/i.test(eqPop)) score += 6;
  // Tipo de dispositivo
  if (input.deviceType && eq.deviceType && eq.deviceType.toLowerCase().includes(input.deviceType.toLowerCase())) {
    score += 4;
  }
  // Validación
  if (eq.validationStatus === "VALIDADO") score += 6;
  else if (eq.validationStatus === "PROVISIONAL") score += 2;
  else score -= 2;
  // Año más reciente preferido
  score += Math.min(5, Math.max(0, (eq.year - 1980) / 10));
  return score;
}

export async function selectEquation(input: SelectionInput): Promise<SelectionResult> {
  const equations = await listActiveEquations();
  const scored = equations
    .map((eq) => ({ eq, score: scoreEquation(eq, input) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return {
      recommended: null,
      alternatives: [],
      matchLevel: "BAJA",
      reason:
        "No se encontró una ecuación validada que cumpla con el perfil y las variables disponibles. " +
        "Registre más variables (altura, peso, resistencia, reactancia, edad) o utilice resultados del dispositivo.",
    };
  }

  const top = scored[0];
  const recommended = top.eq;
  const alternatives = scored.slice(1, 6).map((x) => x.eq);
  let matchLevel: MatchLevel = "BAJA";
  if (top.score >= 50) matchLevel = "ALTA";
  else if (top.score >= 30) matchLevel = "MODERADA";

  const reasons: string[] = [];
  if (recommended.sex === input.sex) reasons.push("coincide con el sexo del participante");
  else if (recommended.sex?.toUpperCase() === "AMBOS") reasons.push("validada para ambos sexos");
  if (ageMatches(recommended.ageRangeMin, recommended.ageRangeMax, input.age)) {
    reasons.push(
      `edad dentro del rango validado${recommended.ageRangeMin ? ` (${recommended.ageRangeMin}-${recommended.ageRangeMax ?? "+"})` : ""}`
    );
  }
  if (variablesSatisfied(recommended.variablesRequired, input.variablesAvailable)) {
    reasons.push("todas las variables requeridas están disponibles");
  }
  const reason = `Coincidencia ${matchLevel.toLowerCase()}: ${reasons.join("; ")}.`;

  return { recommended, alternatives, matchLevel, reason };
}
