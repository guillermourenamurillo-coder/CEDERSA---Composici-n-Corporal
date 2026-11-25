import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// POST /api/auth/register — registro público de nuevas cuentas.
// Por defecto, las nuevas cuentas se crean con rol USUARIO (principio de
// menor privilegio). Un administrador podrá cambiar el rol posteriormente
// desde el panel Ajustes → Usuarios.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    // --- Validaciones de entrada ---
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return Response.json(
        { error: "El nombre debe tener al menos 2 caracteres." },
        { status: 400 }
      );
    }
    if (!email || typeof email !== "string") {
      return Response.json({ error: "El correo es obligatorio." }, { status: 400 });
    }
    const emailNorm = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNorm)) {
      return Response.json(
        { error: "El formato del correo no es válido." },
        { status: 400 }
      );
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return Response.json(
        { error: "La contraseña debe tener al menos 8 caracteres." },
        { status: 400 }
      );
    }

    // --- Verificar correo no registrado ---
    const existing = await db.user.findUnique({ where: { email: emailNorm } });
    if (existing) {
      return Response.json(
        { error: "Ya existe una cuenta con ese correo electrónico." },
        { status: 409 }
      );
    }

    // --- Crear usuario con rol USUARIO por defecto ---
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: emailNorm,
        passwordHash,
        role: "USUARIO",
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    // Bitácora de auditoría.
    try {
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: "REGISTER",
          details: `Registro de cuenta: ${user.email} (rol USUARIO)`,
        },
      });
    } catch {
      // la bitácora no debe bloquear el registro
    }

    return Response.json(
      {
        ok: true,
        message:
          "Cuenta creada correctamente. Ahora puede iniciar sesión con sus credenciales.",
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      },
      { status: 201 }
    );
  } catch {
    return Response.json(
      { error: "Error al registrar la cuenta. Intente nuevamente." },
      { status: 500 }
    );
  }
}
