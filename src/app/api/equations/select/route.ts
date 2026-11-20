import { NextRequest } from "next/server";
import { getAppSession, unauthorizedResponse, forbiddenResponse } from "@/lib/permissions";
import { selectEquation } from "@/lib/equations/selector";

// POST /api/equations/select — recomienda una ecuación según el perfil.
export async function POST(req: NextRequest) {
  const user = await getAppSession();
  if (!user) return unauthorizedResponse();
  if (user.role === "USUARIO") return forbiddenResponse();
  const body = await req.json();
  if (!body.sex || body.age === undefined) {
    return Response.json({ error: "sex y age son requeridos" }, { status: 400 });
  }
  const result = await selectEquation({
    sex: body.sex,
    age: Number(body.age),
    isAthlete: !!body.isAthlete,
    populationCategory: body.populationCategory || null,
    deviceType: body.deviceType || null,
    variablesAvailable: body.variablesAvailable || [],
  });
  return Response.json(result);
}
