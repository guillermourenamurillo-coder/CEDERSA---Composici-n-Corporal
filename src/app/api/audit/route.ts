import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAppSession, forbiddenResponse, unauthorizedResponse } from "@/lib/permissions";

// GET /api/audit — bitácora de auditoría (solo ADMIN).
export async function GET(req: NextRequest) {
  const user = await getAppSession();
  if (!user) return unauthorizedResponse();
  if (user.role !== "ADMIN") return forbiddenResponse();
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") || 100);
  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 500),
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });
  return Response.json(logs);
}
