// Evaluador seguro de fórmulas de bioimpedancia usando mathjs.
// Se valida que la fórmula sólo use símbolos permitidos para evitar ejecución
// arbitraria. Las variables permitidas son: H, height, Weight, weight, R, Xc,
// Z, age, Age, SexCode, sexCode.
import { create, all } from "mathjs";

const math = create(all, {});

const ALLOWED_VARIABLES = new Set([
  "H",
  "height",
  "Weight",
  "weight",
  "R",
  "Xc",
  "Z",
  "age",
  "Age",
  "SexCode",
  "sexCode",
]);

// Funciones permitidas en las fórmulas (además de operadores básicos).
const ALLOWED_FUNCTIONS = [
  "sqrt",
  "abs",
  "exp",
  "log",
  "log10",
  "atan",
  "asin",
  "acos",
  "sin",
  "cos",
  "tan",
  "pow",
  "max",
  "min",
  "round",
  "floor",
  "ceil",
];

export function isFormulaSafe(formula: string): { ok: boolean; reason?: string } {
  if (!formula || !formula.trim()) return { ok: false, reason: "Fórmula vacía" };
  // Caracteres prohibidos (punto y coma, asignaciones, comillas, backticks)
  if (/[;:=`'"\[\]\\{}]/.test(formula)) {
    return { ok: false, reason: "Caracteres no permitidos en la fórmula" };
  }
  try {
    const node = math.parse(formula);
    let invalid = "";
    node.traverse((n: any) => {
      if (n.isSymbolNode) {
        const name = n.name;
        if (!ALLOWED_VARIABLES.has(name) && !ALLOWED_FUNCTIONS.includes(name)) {
          invalid = name;
        }
      }
      if (n.isFunctionNode) {
        const fn = n.fn?.name || "";
        if (fn && !ALLOWED_FUNCTIONS.includes(fn)) {
          invalid = fn;
        }
      }
    });
    if (invalid) {
      return { ok: false, reason: `Símbolo o función no permitida: ${invalid}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: `Error de sintaxis: ${e?.message || "desconocido"}` };
  }
}

export function evaluateFormula(formula: string, variables: Record<string, number>): number {
  const safe = isFormulaSafe(formula);
  if (!safe.ok) {
    throw new Error(`Fórmula no segura: ${safe.reason}`);
  }
  const scope: Record<string, number> = {};
  for (const key of Object.keys(variables)) {
    const v = variables[key];
    if (typeof v === "number" && !Number.isNaN(v)) scope[key] = v;
  }
  const result = math.evaluate(formula, scope);
  if (typeof result === "number") return result;
  // mathjs puede devolver unidades u otros objetos
  if (result && typeof result.valueOf === "function") {
    const n = result.valueOf();
    if (typeof n === "number") return n;
  }
  throw new Error("El resultado no es un número");
}

export function describeFormula(formula: string): string {
  return formula;
}
