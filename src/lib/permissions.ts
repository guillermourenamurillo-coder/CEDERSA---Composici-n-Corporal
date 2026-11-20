// Helpers de control de acceso basado en roles (RBAC)
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { UserRole } from "@prisma/client";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export async function getCurrentUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<SessionUser | null> {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return null;
  const u = session.user as any;
  return {
    id: u.id,
    email: u.email ?? "",
    name: u.name ?? "",
    role: u.role as UserRole,
  };
}

// Versión para App Router (route handlers) — sin req/res.
export async function getAppSession(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const u = session.user as any;
  return {
    id: u.id,
    email: u.email ?? "",
    name: u.name ?? "",
    role: u.role as UserRole,
  };
}

// Verifica rol y devuelve usuario o respuesta de error para route handlers.
export async function requireAppRole(
  roles: UserRole[]
): Promise<{ user: SessionUser | null; error: Response | null }> {
  const user = await getAppSession();
  if (!user) return { user: null, error: unauthorizedResponse() };
  if (!hasRole(user, roles)) return { user, error: forbiddenResponse() };
  return { user, error: null };
}

export function hasRole(user: SessionUser | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

export function unauthorizedResponse(message = "No autorizado") {
  return Response.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = "Acción no permitida para su rol") {
  return Response.json({ error: message }, { status: 403 });
}

export function notFoundResponse(message = "Recurso no encontrado") {
  return Response.json({ error: message }, { status: 404 });
}

export async function requireRole(req: NextApiRequest, res: NextApiResponse, roles: UserRole[]) {
  const user = await getCurrentUser(req, res);
  if (!user) return { user: null, error: unauthorizedResponse() };
  if (!hasRole(user, roles)) return { user, error: forbiddenResponse() };
  return { user, error: null };
}

export function canViewParticipant(user: SessionUser, participant: { linkedUserId?: string | null }) {
  // Admin y evaluadores ven todo. Investigadores ven datos anonimizados.
  // USUARIO solo ve su propio registro vinculado.
  if (user.role === "ADMIN" || user.role === "EVALUADOR") return true;
  if (user.role === "INVESTIGADOR") return true; // vía export anónimo
  if (user.role === "USUARIO" && participant.linkedUserId === user.id) return true;
  return false;
}

export async function logAction(
  userId: string,
  action: string,
  details?: string,
  measurementId?: string
) {
  try {
    await db.auditLog.create({
      data: { userId, action, details, measurementId },
    });
  } catch {
    // best-effort
  }
}
