"use client";

import { cn } from "@/lib/utils";
import { Circle } from "lucide-react";

export function QualityBadge({ score, className }: { score: string; className?: string }) {
  const map: Record<string, { color: string; label: string; ring: string }> = {
    VERDE: {
      color: "text-emerald-600 dark:text-emerald-400",
      ring: "bg-emerald-500/10 border-emerald-500/30",
      label: "Condiciones adecuadas",
    },
    AMARILLO: {
      color: "text-amber-600 dark:text-amber-400",
      ring: "bg-amber-500/10 border-amber-500/30",
      label: "Precaución",
    },
    ROJO: {
      color: "text-rose-600 dark:text-rose-400",
      ring: "bg-rose-500/10 border-rose-500/30",
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
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30",
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
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",
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
