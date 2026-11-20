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
import { Activity, Loader2, ShieldCheck } from "lucide-react";

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 via-background to-emerald-50 dark:from-slate-900 dark:via-background dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg mb-3">
            <Activity className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            CEDERSA
          </h1>
          <p className="text-sm text-muted-foreground">
            Composición Corporal · Universidad Nacional · CIEMHCAVI
          </p>
        </div>
        <Card className="shadow-xl border-border/60">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Inicio de sesión
            </CardTitle>
            <CardDescription>
              Acceso restringido a personal autorizado del centro.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
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
                <Input
                  id="password"
                  type="password"
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
            </CardContent>
            <CardFooter className="flex flex-col gap-3 mt-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Ingresar
              </Button>
              <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                La bioimpedancia no constituye por sí sola un diagnóstico médico.
                El acceso queda registrado con fines de auditoría.
              </p>
            </CardFooter>
          </form>
        </Card>
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <details className="inline-block text-left">
            <summary className="cursor-pointer hover:text-foreground transition-colors">
              Credenciales de demostración
            </summary>
            <div className="mt-2 p-3 rounded-md bg-muted/60 text-[11px] space-y-1">
              <div><strong>ADMIN</strong>: admin@cedersa.ac.cr / Admin123!</div>
              <div><strong>EVALUADOR</strong>: evaluador@cedersa.ac.cr / Eval123!</div>
              <div><strong>INVESTIGADOR</strong>: investigador@cedersa.ac.cr / Inv123!</div>
              <div><strong>USUARIO</strong>: usuario@cedersa.ac.cr / User123!</div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
