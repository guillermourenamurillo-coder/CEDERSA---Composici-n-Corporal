import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAppSession, forbiddenResponse, unauthorizedResponse } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const user = await getAppSession();
  if (!user) return unauthorizedResponse();
  const url = new URL(req.url);
  const onlyActive = url.searchParams.get("active") !== "false";
  const where: any = {};
  if (onlyActive) where.active = true;
  const eqs = await db.equation.findMany({ where, orderBy: [{ year: "desc" }, { name: "asc" }] });
  return Response.json(eqs);
}
