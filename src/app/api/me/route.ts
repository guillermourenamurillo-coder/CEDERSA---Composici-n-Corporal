import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAppSession, unauthorizedResponse } from "@/lib/permissions";

// GET /api/me — sesión actual.
export async function GET(_req: NextRequest) {
  const user = await getAppSession();
  if (!user) return unauthorizedResponse();
  return Response.json(user);
}
