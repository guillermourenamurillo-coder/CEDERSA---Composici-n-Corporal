// Registro de ecuaciones — carga desde la base de datos.
import { db } from "@/lib/db";
import type { Equation } from "@prisma/client";

export async function listActiveEquations(): Promise<Equation[]> {
  return db.equation.findMany({
    where: { active: true },
    orderBy: [{ year: "desc" }, { name: "asc" }],
  });
}

export async function getEquationById(id: string): Promise<Equation | null> {
  return db.equation.findUnique({ where: { id } });
}

export async function listAllEquations(): Promise<Equation[]> {
  return db.equation.findMany({
    orderBy: [{ year: "desc" }, { name: "asc" }],
  });
}
