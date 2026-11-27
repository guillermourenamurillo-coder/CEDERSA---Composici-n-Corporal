"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  ClipboardPlus,
  TrendingUp,
  Calculator,
  Cpu,
  FlaskConical,
  FileText,
  Settings,
  LogOut,
  Menu,
  Sun,
  Moon,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  useAppStore,
  type Section,
} from "@/stores/app-store";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { DashboardSection } from "@/components/sections/dashboard";
import { ParticipantesSection } from "@/components/sections/participantes";
import { NuevaEvaluacionSection } from "@/components/sections/nueva-evaluacion";
import { EvolucionSection } from "@/components/sections/evolucion";
import { EcuacionesSection } from "@/components/sections/ecuaciones";
import { DispositivosSection } from "@/components/sections/dispositivos";
import { InvestigacionSection } from "@/components/sections/investigacion";
import { ReportesSection } from "@/components/sections/reportes";
import { AjustesSection } from "@/components/sections/ajustes";

interface NavItem {
  id: Section;
  label: string;
  icon: React.ElementType;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "EVALUADOR", "INVESTIGADOR"] },
  { id: "participantes", label: "Participantes", icon: Users, roles: ["ADMIN", "EVALUADOR", "INVESTIGADOR"] },
  { id: "nueva-evaluacion", label: "Nueva Evaluación", icon: ClipboardPlus, roles: ["ADMIN", "EVALUADOR", "INVESTIGADOR"] },
  { id: "evolucion", label: "Evolución", icon: TrendingUp, roles: ["ADMIN", "EVALUADOR", "INVESTIGADOR"] },
  { id: "ecuaciones", label: "Ecuaciones BIA", icon: Calculator, roles: ["ADMIN", "EVALUADOR", "INVESTIGADOR", "USUARIO"] },
  { id: "dispositivos", label: "Dispositivos", icon: Cpu, roles: ["ADMIN", "EVALUADOR", "INVESTIGADOR", "USUARIO"] },
  { id: "investigacion", label: "Investigación", icon: FlaskConical, roles: ["ADMIN", "INVESTIGADOR"] },
  { id: "reportes", label: "Reportes", icon: FileText, roles: ["ADMIN", "EVALUADOR", "INVESTIGADOR"] },
  { id: "ajustes", label: "Ajustes / Usuarios", icon: Settings, roles: ["ADMIN"] },
];

function roleLabel(role?: string) {
  switch (role) {
    case "ADMIN":
      return "Administrador";
    case "EVALUADOR":
      return "Evaluador";
    case "INVESTIGADOR":
      return "Investigador";
    case "USUARIO":
      return "Usuario";
    default:
      return role || "—";
  }
}

export function AppShell() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { currentSection, setSection } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = (session?.user as any)?.role as string | undefined;
  const navItems = NAV_ITEMS.filter((item) => !item.roles || (role && item.roles.includes(role)));

  // Si la sección actual no está disponible para el rol, redirigir a la primera disponible.
  useEffect(() => {
    if (!role) return;
    const availableSections = navItems.map((n) => n.id);
    if (availableSections.length > 0 && !availableSections.includes(currentSection)) {
      setSection(availableSections[0]);
    }
  }, [role, currentSection, navItems, setSection]);

  function go(s: Section) {
    setSection(s);
    setMobileOpen(false);
  }

  const SidebarContent = (
    <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Navegación principal">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = currentSection === item.id;
        return (
          <button
            key={item.id}
            onClick={() => go(item.id)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Franja institucional CEDERSA con los 3 colores del logo */}
      <div className="cedersa-stripe h-1 w-full" aria-hidden />
      <header className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center gap-3 px-4 sm:px-6">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="px-4 py-4 border-b">
              <SheetTitle className="flex items-center gap-2 text-left">
                <Image
                  src="/cedersa-logo.jpg"
                  alt="Logo CEDERSA"
                  width={40}
                  height={40}
                  className="rounded-md bg-white p-0.5"
                />
                <div>
                  <div className="text-sm font-bold" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>CEDERSA</div>
                  <div className="text-[11px] text-muted-foreground font-normal">Composición Corporal</div>
                </div>
              </SheetTitle>
            </SheetHeader>
            {SidebarContent}
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2 md:hidden">
          <Image
            src="/cedersa-logo.jpg"
            alt="Logo CEDERSA"
            width={32}
            height={32}
            className="rounded-md bg-white p-0.5"
          />
          <div className="text-sm font-bold" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>CEDERSA</div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Image
            src="/cedersa-logo.jpg"
            alt="Logo CEDERSA"
            width={32}
            height={32}
            className="rounded-md bg-white p-0.5"
          />
          <h1 className="text-base font-semibold tracking-tight" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
            CEDERSA <span className="text-muted-foreground font-normal" style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}>| Composición Corporal</span>
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cambiar tema"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <div className="hidden sm:flex flex-col items-end leading-tight mr-1">
            <span className="text-xs font-medium">{session?.user?.name}</span>
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
              {roleLabel(role)}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cerrar sesión"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="hidden md:flex w-60 flex-col border-r bg-sidebar sticky top-16 h-[calc(100vh-4rem)]">
          <div className="px-4 py-4 border-b">
            <div className="flex items-center gap-2">
              <Image
                src="/cedersa-logo.jpg"
                alt="Logo CEDERSA"
                width={36}
                height={36}
                className="rounded-md bg-white p-0.5"
              />
              <div>
                <div className="text-sm font-bold" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>CEDERSA</div>
                <div className="text-[11px] text-muted-foreground">Composición Corporal</div>
              </div>
            </div>
          </div>
          {SidebarContent}
          <div className="mt-auto p-4 border-t text-[11px] text-muted-foreground leading-relaxed">
            La bioimpedancia no constituye por sí sola un diagnóstico médico.
          </div>
        </aside>

        <main className="flex-1 min-w-0 p-4 sm:p-6 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSection}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {renderSection(currentSection)}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <footer className="mt-auto border-t bg-background py-3 px-4 sm:px-6 text-[11px] text-muted-foreground text-center leading-relaxed">
        <div className="cedersa-stripe h-0.5 w-full mb-2 max-w-md mx-auto" aria-hidden />
        CEDERSA | Universidad Nacional · CIEMHCAVI · La bioimpedancia no constituye por sí sola un diagnóstico médico.
      </footer>
    </div>
  );
}

function renderSection(s: Section) {
  switch (s) {
    case "dashboard":
      return <DashboardSection />;
    case "participantes":
      return <ParticipantesSection />;
    case "nueva-evaluacion":
      return <NuevaEvaluacionSection />;
    case "evolucion":
      return <EvolucionSection />;
    case "ecuaciones":
      return <EcuacionesSection />;
    case "dispositivos":
      return <DispositivosSection />;
    case "investigacion":
      return <InvestigacionSection />;
    case "reportes":
      return <ReportesSection />;
    case "ajustes":
      return <AjustesSection />;
    default:
      return null;
  }
}

// Evita advertencia de import no usado
export const _Close = X;
