import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAppSession, unauthorizedResponse, notFoundResponse } from "@/lib/permissions";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAppSession();
  if (!user) return unauthorizedResponse();
  const { id } = await params;
  const eq = await db.equation.findUnique({ where: { id } });
  if (!eq) return notFoundResponse();
  return Response.json(eq);
}
