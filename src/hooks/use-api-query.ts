"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

/**
 * Wrapper de useQuery para endpoints JSON de la API de CEDERSA.
 *
 * Garantiza que:
 *  - Se verifique `r.ok` antes de parsear el body.
 *  - Respuestas 401/403/404/500 se conviertan en `error` (no en `data`).
 *  - El `data` siempre sea del tipo esperado (nunca un objeto `{error}`).
 *  - En 401 se ofrezca re-login amable vía callback opcional.
 *
 * Uso:
 *   const { data } = useApiQuery<User[]>("/api/users");
 */
export function useApiQuery<T>(
  url: string,
  options?: Omit<UseQueryOptions<T, Error, T, [string]>, "queryKey" | "queryFn"> & {
    fetchOptions?: RequestInit;
  }
) {
  return useQuery<T, Error>({
    queryKey: [url],
    queryFn: async () => {
      const r = await fetch(url, {
        credentials: "include",
        ...options?.fetchOptions,
      });
      if (!r.ok) {
        let detail = "";
        try {
          const body = await r.json();
          detail = body?.error || body?.message || "";
        } catch {
          // body no JSON
        }
        const msg =
          r.status === 401
            ? "Sesión expirada o no autorizada."
            : r.status === 403
            ? "Acción no permitida para su rol."
            : r.status === 404
            ? "Recurso no encontrado."
            : `Error del servidor (${r.status}).`;
        throw new Error(detail ? `${msg} ${detail}` : msg);
      }
      return (await r.json()) as T;
    },
    retry: (failureCount, error: Error) => {
      // No reintentar 401/403/404
      if (
        error.message.includes("no autorizada") ||
        error.message.includes("no permitida") ||
        error.message.includes("no encontrado")
      ) {
        return false;
      }
      return failureCount < 2;
    },
    ...options,
  });
}
