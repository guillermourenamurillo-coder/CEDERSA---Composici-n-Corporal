"use client";

import { useState, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Indicador visual de fortaleza opcional (no bloquea) */
  showStrength?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showStrength = false, value, onChange, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    const val = typeof value === "string" ? value : "";
    const strength = computeStrength(val);

    return (
      <div className="space-y-1.5">
        <div className="relative">
          <Input
            ref={ref}
            type={visible ? "text" : "password"}
            className={cn("pr-10", className)}
            value={value}
            onChange={onChange}
            {...props}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            tabIndex={-1}
            className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={visible}
          >
            {visible ? (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Eye className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        {showStrength && val.length > 0 && (
          <div className="space-y-1">
            <div className="flex gap-1 h-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-full flex-1 rounded-full transition-colors",
                    i < strength.score
                      ? strength.color
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
            <p className={cn("text-[11px]", strength.textColor)}>
              {strength.label}
            </p>
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

interface Strength {
  score: number; // 0..4
  label: string;
  color: string;
  textColor: string;
}

function computeStrength(pw: string): Strength {
  if (!pw) return { score: 0, label: "", color: "", textColor: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const map: Strength[] = [
    { score: 0, label: "Muy débil", color: "bg-red-500", textColor: "text-cedersa-red" },
    { score: 1, label: "Débil", color: "bg-red-500", textColor: "text-cedersa-red" },
    { score: 2, label: "Aceptable", color: "bg-orange-500", textColor: "text-cedersa-orange" },
    { score: 3, label: "Buena", color: "bg-blue-500", textColor: "text-cedersa-blue" },
    { score: 4, label: "Fuerte", color: "bg-emerald-500", textColor: "text-emerald-600" },
  ];
  return map[score];
}
