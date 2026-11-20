"use client";

import { cn } from "@/lib/utils";
import { Circle } from "lucide-react";

export function QualityBadge({ score, className }: { score: string; className?: string }) {
  const map: Record<string, { color: string; label: string; ring: string }> = {
    VERDE: {
      color: "text-cedersa-blue dark:text-cedersa-blue",
      ring: "bg-blue-500/10 border-blue-500/30",
      label: "Condiciones adecuadas",
    },
    AMARILLO: {
      color: "text-cedersa-orange dark:text-cedersa-orange",
      ring: "bg-orange-500/10 border-orange-500/30",
      label: "Precaución",
    },
    ROJO: {
      color: "text-cedersa-red dark:text-cedersa-red",
      ring: "bg-red-500/10 border-red-500/30",
      label: "Condiciones potencialmente inadecuadas",
    },
  };
  const cfg = map[score] || map.AMARILLO;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium",
        cfg.ring,
        cfg.color,
        className
      )}
    >
      <Circle className="w-2 h-2 fill-current" />
      {cfg.label}
    </span>
  );
}

export function InBodyBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-500/10 text-cedersa-orange border border-orange-500/30",
        className
      )}
    >
      Resultado InBody
    </span>
  );
}

export function CalculatedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-cedersa-red border border-red-500/30",
        className
      )}
    >
      Estimación científica
    </span>
  );
}

export function fmt(n: number | null | undefined, digits = 1, suffix = ""): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${n.toFixed(digits)}${suffix}`;
}

export function fmtDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
