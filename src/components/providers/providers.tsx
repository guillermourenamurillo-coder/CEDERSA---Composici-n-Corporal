"use client";

import { SessionProvider, signOut } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const notifiedRef = useRef(false);

  const client = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
    []
  );

  // Suscribirse a errores del QueryCache tras el mount para detectar 401.
  useEffect(() => {
    const unsubscribe = client.getQueryCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error") {
        const error = event.action.error as Error;
        const msg = error?.message || "";
        // Solo desloguear en 401 explícito (sesión expirada).
        // 403 (rol insuficiente) se maneja en cada sección con AccessRestricted.
        if (msg.includes("Sesión expirada") && !notifiedRef.current) {
          notifiedRef.current = true;
          toast.error("Su sesión ha expirado. Será redirigido al inicio de sesión.");
          setTimeout(() => {
            signOut({ callbackUrl: "/" }).finally(() => {
              notifiedRef.current = false;
            });
          }, 1500);
        }
      }
    });
    return unsubscribe;
  }, [client]);

  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
