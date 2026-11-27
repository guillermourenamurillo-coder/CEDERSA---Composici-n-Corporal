"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Loader2,
  ShieldCheck,
  UserPlus,
  LogIn,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";

type Mode = "login" | "register";

export function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");

  // Campos compartidos
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Campos solo registro
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function resetFields() {
    setError(null);
    setSuccess(null);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    resetFields();
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Credenciales inválidas. Verifique su correo y contraseña.");
      return;
    }
    router.refresh();
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    resetFields();

    // Validaciones de cliente (el servidor también valida)
    if (name.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(data.error || "No se pudo registrar la cuenta.");
        return;
      }
      setSuccess(
        "Cuenta creada correctamente. Ahora puede iniciar sesión con sus credenciales."
      );
      // Limpiar y volver a login
      setName("");
      setConfirmPassword("");
      setPassword("");
      setMode("login");
    } catch {
      setError("Error de conexión. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-background to-orange-50 dark:from-slate-900 dark:via-background dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Encabezado institucional */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            <Image
              src="/cedersa-logo.jpg"
              alt="Logo CEDERSA"
              width={96}
              height={96}
              className="rounded-2xl shadow-md bg-white p-1.5"
              priority
            />
          </div>
          <h1
            className="text-3xl font-bold tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            CEDERSA
          </h1>
          <p className="text-xs font-medium text-cedersa-blue">
            Centro de Acondicionamiento Físico
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Composición Corporal · Universidad Nacional · CIEMHCAVI
          </p>
        </div>

        {/* Card de login / registro */}
        <Card className="shadow-xl border-border/60 border-t-4 border-t-[var(--cedersa-blue)]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {mode === "login" ? (
                <>
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Inicio de sesión
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 text-primary" />
                  Crear cuenta
                </>
              )}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Acceso para personal autorizado del centro."
                : "Registre su cuenta con correo electrónico. Se asignará rol USUARIO por defecto; un administrador podrá cambiarlo posteriormente."}
            </CardDescription>
          </CardHeader>

          {mode === "login" ? (
            /* ---------------- LOGIN ---------------- */
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@cedersa.ac.cr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <PasswordInput
                    id="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}
                {success && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
                    {success}
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-3 mt-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4 mr-2" />
                  )}
                  Ingresar
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    resetFields();
                  }}
                  className="text-xs text-cedersa-blue hover:underline"
                >
                  ¿No tiene cuenta? Regístrese aquí
                </button>
                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                  La bioimpedancia no constituye por sí sola un diagnóstico médico.
                  El acceso queda registrado con fines de auditoría.
                </p>
              </CardFooter>
            </form>
          ) : (
            /* ---------------- REGISTRO ---------------- */
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre y apellidos"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Correo electrónico</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@cedersa.ac.cr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Contraseña</Label>
                  <PasswordInput
                    id="reg-password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    showStrength
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                  <PasswordInput
                    id="confirm-password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita la contraseña"
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Al registrarse acepta que los datos de evaluación quedan
                  almacenados con fines académicos, clínicos, deportivos e
                  investigativos, conforme al consentimiento informado del centro.
                </p>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 mt-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  Crear cuenta
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    resetFields();
                  }}
                  className="inline-flex items-center gap-1 text-xs text-cedersa-blue hover:underline"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Volver a inicio de sesión
                </button>
                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                  La bioimpedancia no constituye por sí sola un diagnóstico médico.
                  El acceso queda registrado con fines de auditoría.
                </p>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
