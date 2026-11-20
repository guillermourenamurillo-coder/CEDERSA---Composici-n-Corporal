"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  ClipboardPlus,
  ArrowRight,
  ArrowLeft,
  Check,
  Calculator,
  Info,
  Save,
  FlaskConical,
  FileDown,
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { QualityBadge, InBodyBadge, CalculatedBadge, fmt } from "./_shared";

interface Participant {
  id: string;
  internalId: string;
  fullName: string;
  sex: string;
  birthDate: string;
  heightCm: number;
  populationCategory: string | null;
  isAthlete: boolean;
}

interface Device {
  id: string;
  manufacturer: string;
  model: string;
  biaType: string;
}

interface Equation {
  id: string;
  name: string;
  authors: string;
  year: number;
  formula: string;
  population: string;
  see: number | null;
  outputVariable: string;
  variablesRequired: string;
  limitations: string | null;
}

interface SelectionResult {
  recommended: Equation | null;
  alternatives: Equation[];
  matchLevel: string;
  reason: string;
}

const STEPS = [
  "Participante",
  "Dispositivo y origen",
  "Condiciones",
  "Bioimpedancia",
  "Resultados",
  "Interpretación",
  "Guardar",
];

const CHECKLIST_FIELDS = [
  { key: "hydrated", label: "Hidratado adecuadamente", bad: false },
  { key: "recentExercise", label: "Ejercicio intenso en las últimas 4 horas", bad: true },
  { key: "recentFood", label: "Consumió alimentos en las últimas 4 horas", bad: true },
  { key: "recentAlcohol", label: "Consumió alcohol en las últimas 24 horas", bad: true },
  { key: "voidedBladder", label: "Vejiga vaciada antes de medir", bad: false },
  { key: "edema", label: "Presenta edema o retención de líquidos", bad: true },
  { key: "removedMetal", label: "Retiró objetos metálicos", bad: false },
  { key: "correctPosture", label: "Postura correcta (decúbito supino / bipedestación)", bad: false },
  { key: "followedProtocol", label: "Se siguió el protocolo del dispositivo", bad: false },
  { key: "similarToPrior", label: "Condiciones similares a evaluaciones previas", bad: false },
] as const;

export function NuevaEvaluacionSection() {
  const { selectedParticipantId, selectParticipant, setSection } = useAppStore();
  const [step, setStep] = useState(0);
  const [participantId, setParticipantId] = useState<string>(selectedParticipantId || "");
  const [deviceId, setDeviceId] = useState<string>("");
  const [dataOrigin, setDataOrigin] = useState<string>("MANUAL");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [qualityNotes, setQualityNotes] = useState("");
  const [bia, setBia] = useState({
    weightKg: "",
    heightCm: "",
    resistanceR: "",
    reactanceXc: "",
    impedanceZ: "",
    phaseAngleDeg: "",
    frequencyKHz: "50",
    inbodyMuscleMass: "",
    inbodyFatMass: "",
    inbodyFatPercent: "",
    inbodyVisceralFat: "",
    inbodyTBW: "",
    inbodyECW: "",
    inbodyICW: "",
  });
  const [equationId, setEquationId] = useState<string>("");
  const [selection, setSelection] = useState<SelectionResult | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const { data: participants } = useQuery<Participant[]>({
    queryKey: ["participants"],
    queryFn: async () => (await fetch("/api/participants")).json(),
  });
  const { data: devices } = useQuery<Device[]>({
    queryKey: ["devices"],
    queryFn: async () => (await fetch("/api/devices")).json(),
  });
  const { data: equations } = useQuery<Equation[]>({
    queryKey: ["equations"],
    queryFn: async () => (await fetch("/api/equations")).json(),
  });

  const participant = useMemo(
    () => participants?.find((p) => p.id === participantId) || null,
    [participants, participantId]
  );

  useEffect(() => {
    if (participantId) selectParticipant(participantId);
  }, [participantId, selectParticipant]);

  // Calcular calidad en base al checklist
  const qualityScore = useMemo(() => {
    const badFlags = ["recentExercise", "recentFood", "recentAlcohol", "edema"];
    const requiredGood = ["hydrated", "removedMetal", "correctPosture", "followedProtocol"];
    let bad = 0;
    let good = 0;
    for (const f of CHECKLIST_FIELDS) {
      const val = checklist[f.key];
      if (val === undefined) continue;
      if (f.bad && val) bad++;
      if (!f.bad && val) good++;
    }
    if (bad >= 2 || (bad >= 1 && good < 3)) return "ROJO";
    if (bad === 1 || good < 3) return "AMARILLO";
    if (good >= 4) return "VERDE";
    return "AMARILLO";
  }, [checklist]);

  // Seleccionar ecuación automáticamente cuando hay participante + variables
  const age = participant
    ? new Date().getFullYear() - new Date(participant.birthDate).getFullYear()
    : 0;

  const variablesAvailable = useMemo(() => {
    const v: string[] = [];
    if (bia.heightCm || participant?.heightCm) v.push("height");
    if (bia.weightKg) v.push("weight");
    if (bia.resistanceR) v.push("R");
    if (bia.reactanceXc) v.push("Xc");
    if (age) v.push("age");
    v.push("sexCode");
    return v;
  }, [bia, participant, age]);

  async function fetchSelection() {
    if (!participant || variablesAvailable.length < 3) return;
    try {
      const r = await fetch("/api/equations/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sex: participant.sex,
          age,
          isAthlete: participant.isAthlete,
          populationCategory: participant.populationCategory,
          deviceType: null,
          variablesAvailable,
        }),
      });
      if (r.ok) {
        const s: SelectionResult = await r.json();
        setSelection(s);
        if (s.recommended && !equationId) setEquationId(s.recommended.id);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    const t = setTimeout(fetchSelection, 300);
    return () => clearTimeout(t);
  }, [participantId, variablesAvailable.join(",")]);

  // Calcular el preview en el cliente (paridad con el backend)
  const computed = useMemo(() => {
    if (!participant) return null;
    const heightCm = bia.heightCm ? Number(bia.heightCm) : participant.heightCm;
    const R = bia.resistanceR ? Number(bia.resistanceR) : null;
    const Xc = bia.reactanceXc ? Number(bia.reactanceXc) : null;
    const weightKg = bia.weightKg ? Number(bia.weightKg) : null;
    const heightM = heightCm / 100;
    const ri = R ? (heightCm * heightCm) / R : null;
    const pa = R && Xc ? (Math.atan(Xc / R) * 180) / Math.PI : null;
    return { heightCm, R, Xc, weightKg, heightM, ri, pa };
  }, [participant, bia]);

  async function save() {
    if (!participant || !deviceId) {
      toast.error("Faltan datos obligatorios");
      return;
    }
    const body: any = {
      participantId,
      deviceId,
      measuredAt: new Date().toISOString(),
      ...Object.fromEntries(
        Object.entries(bia).filter(([, v]) => v !== "").map(([k, v]) => [k, Number(v)])
      ),
      heightCm: computed?.heightCm,
      dataOrigin,
      equationId: equationId || null,
      qualityScore,
      qualityNotes,
      conditions: {
        ...Object.fromEntries(Object.entries(checklist)),
        notes: qualityNotes || null,
      },
    };
    try {
      const r = await fetch("/api/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || "Error al guardar");
      }
      const saved = await r.json();
      setSavedId(saved.id);
      setPreview(saved);
      toast.success("Evaluación guardada con trazabilidad");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  const canNext = (() => {
    switch (step) {
      case 0:
        return !!participantId;
      case 1:
        return !!deviceId;
      case 2:
        return true;
      case 3:
        return !!(bia.resistanceR || bia.impedanceZ);
      default:
        return true;
    }
  })();

  function next() {
    if (!canNext) {
      toast.error("Complete los campos requeridos antes de continuar");
      return;
    }
    if (step === 3) {
      // al pasar a resultados, calcular preview
      fetchSelection();
    }
    if (step === 5) {
      save();
      setStep(6);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function prev() {
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardPlus className="w-6 h-6 text-primary" /> Nueva evaluación
        </h2>
        <p className="text-sm text-muted-foreground">
          Flujo guiado con checklist pre-medición, registro de bioimpedancia y resultados
          transparentes (InBody vs científicos).
        </p>
      </div>

      {/* Stepper */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${
                i === step
                  ? "bg-primary text-primary-foreground border-primary"
                  : i < step
                  ? "bg-blue-500/10 text-cedersa-blue border-blue-500/30 cursor-pointer"
                  : "text-muted-foreground border-border"
              }`}
              disabled={i > step}
            >
              <span className="font-medium">{i + 1}.</span> {s}
            </button>
            {i < STEPS.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Paso 0: Participante */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Seleccionar participante</CardTitle>
            <CardDescription>
              Elija la persona a evaluar. Si no existe, créelo primero en Participantes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={participantId} onValueChange={setParticipantId}>
              <SelectTrigger><SelectValue placeholder="Seleccione un participante" /></SelectTrigger>
              <SelectContent>
                {(participants || []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.fullName} ({p.internalId}) — {p.sex === "MASCULINO" ? "M" : "F"} — {p.heightCm} cm
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {participant && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <Info2 label="Sexo" value={participant.sex} />
                <Info2 label="Edad" value={`${age} años`} />
                <Info2 label="Altura" value={`${participant.heightCm} cm`} />
                <Info2 label="Categoría" value={(participant.populationCategory || "—").replace("_", " ")} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Paso 1: Dispositivo y origen */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dispositivo y origen de datos</CardTitle>
            <CardDescription>
              Especifique el dispositivo BIA y cómo se obtendrán los datos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Dispositivo</Label>
              <Select value={deviceId} onValueChange={setDeviceId}>
                <SelectTrigger><SelectValue placeholder="Seleccione un dispositivo" /></SelectTrigger>
                <SelectContent>
                  {(devices || []).map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.manufacturer} {d.model} ({d.biaType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Origen de los datos</Label>
              <Select value={dataOrigin} onValueChange={setDataOrigin}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUAL">Ingreso manual</SelectItem>
                  <SelectItem value="CSV">Importar CSV (exportación InBody)</SelectItem>
                  <SelectItem value="XLSX">Importar Excel (exportación InBody)</SelectItem>
                  <SelectItem value="API">API oficial InBody</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {dataOrigin === "API" && (
              <Alert>
                <Info className="w-4 h-4" />
                <AlertTitle>API oficial InBody</AlertTitle>
                <AlertDescription>
                  Próximamente — requiere documentación oficial del fabricante para el modelo específico.
                  Por ahora utilice importación CSV/XLSX o ingreso manual.
                </AlertDescription>
              </Alert>
            )}
            {(dataOrigin === "CSV" || dataOrigin === "XLSX") && (
              <Alert>
                <FileDown className="w-4 h-4" />
                <AlertTitle>Plantilla de importación</AlertTitle>
                <AlertDescription>
                  Descargue la <a className="underline" href="/inbody-template.csv" download>plantilla CSV de ejemplo</a>{" "}
                  para ver los campos reconocidos por el parser. Puede importar el archivo más tarde desde la sección Reportes.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Paso 2: Condiciones */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Checklist de condiciones pre-medición</CardTitle>
            <CardDescription>
              Las condiciones afectan directamente la precisión de la estimación.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CHECKLIST_FIELDS.map((f) => (
                <div key={f.key} className="flex items-start gap-2">
                  <Checkbox
                    id={f.key}
                    checked={!!checklist[f.key]}
                    onCheckedChange={(v) => setChecklist((c) => ({ ...c, [f.key]: !!v }))}
                  />
                  <Label htmlFor={f.key} className="text-sm font-normal cursor-pointer leading-snug">
                    {f.label}
                  </Label>
                </div>
              ))}
            </div>
            <Separator />
            <div>
              <Label>Notas de calidad</Label>
              <Textarea
                rows={2}
                value={qualityNotes}
                onChange={(e) => setQualityNotes(e.target.value)}
                placeholder="Observaciones adicionales sobre el estado del participante"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Calidad estimada:</span>
              <QualityBadge score={qualityScore} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paso 3: Bioimpedancia */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos de bioimpedancia</CardTitle>
            <CardDescription>
              Ingrese los valores eléctricos y, si los tiene, los propietarios de InBody.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <NumField label="Peso (kg)" value={bia.weightKg} onChange={(v) => setBia({ ...bia, weightKg: v })} />
              <NumField label="Altura (cm)" value={bia.heightCm} onChange={(v) => setBia({ ...bia, heightCm: v })} placeholder={participant?.heightCm ? String(participant.heightCm) : ""} />
              <NumField label="Resistencia R (ohm)" value={bia.resistanceR} onChange={(v) => setBia({ ...bia, resistanceR: v })} />
              <NumField label="Reactancia Xc (ohm)" value={bia.reactanceXc} onChange={(v) => setBia({ ...bia, reactanceXc: v })} />
              <NumField label="Impedancia Z (ohm)" value={bia.impedanceZ} onChange={(v) => setBia({ ...bia, impedanceZ: v })} />
              <NumField label="Ángulo de fase (°)" value={bia.phaseAngleDeg} onChange={(v) => setBia({ ...bia, phaseAngleDeg: v })} />
              <NumField label="Frecuencia (kHz)" value={bia.frequencyKHz} onChange={(v) => setBia({ ...bia, frequencyKHz: v })} />
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                <InBodyBadge /> Valores propietarios InBody (opcional)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                <NumField label="Masa muscular (kg)" value={bia.inbodyMuscleMass} onChange={(v) => setBia({ ...bia, inbodyMuscleMass: v })} />
                <NumField label="Masa grasa (kg)" value={bia.inbodyFatMass} onChange={(v) => setBia({ ...bia, inbodyFatMass: v })} />
                <NumField label="% Grasa" value={bia.inbodyFatPercent} onChange={(v) => setBia({ ...bia, inbodyFatPercent: v })} />
                <NumField label="Grasa visceral" value={bia.inbodyVisceralFat} onChange={(v) => setBia({ ...bia, inbodyVisceralFat: v })} />
                <NumField label="Agua total (kg)" value={bia.inbodyTBW} onChange={(v) => setBia({ ...bia, inbodyTBW: v })} />
                <NumField label="Agua extracel. (kg)" value={bia.inbodyECW} onChange={(v) => setBia({ ...bia, inbodyECW: v })} />
                <NumField label="Agua intracel. (kg)" value={bia.inbodyICW} onChange={(v) => setBia({ ...bia, inbodyICW: v })} />
              </div>
            </div>
            {computed?.ri && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                Índice de resistencia H²/R = <strong>{computed.ri.toFixed(1)}</strong> cm²/ohm ·
                Ángulo de fase calculado = <strong>{computed.pa !== null ? computed.pa.toFixed(2) : "—"}°</strong>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Paso 4: Resultados */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Resultados de la evaluación</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Se presentan por separado los valores proporcionados por el dispositivo InBody y
              las estimaciones científicas calculadas mediante ecuaciones publicadas.
            </p>
          </div>

          {/* Selector de ecuación */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" /> Ecuación utilizada para la estimación
              </CardTitle>
              <CardDescription>
                {selection?.recommended
                  ? `Recomendación ${selection.matchLevel.toLowerCase()}: ${selection.reason}`
                  : "Seleccione una ecuación de la biblioteca."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={equationId} onValueChange={setEquationId}>
                <SelectTrigger><SelectValue placeholder="Seleccione una ecuación" /></SelectTrigger>
                <SelectContent>
                  {(equations || []).map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} ({e.year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selection?.recommended && (
                <div className="mt-3 text-xs text-muted-foreground space-y-1">
                  <div><strong>Fórmula:</strong> <code className="bg-muted px-1 rounded">{selection.recommended.formula}</code></div>
                  <div><strong>Población validada:</strong> {selection.recommended.population}</div>
                  {selection.recommended.see !== null && (
                    <div><strong>SEE:</strong> ± {selection.recommended.see} kg</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Resultado InBody */}
            <Card className="border-t-4 border-t-[var(--cedersa-orange)]">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Resultado InBody</span>
                  <InBodyBadge />
                </CardTitle>
                <CardDescription>Valores proporcionados por el dispositivo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Row label="Masa muscular" value={fmt(bia.inbodyMuscleMass ? Number(bia.inbodyMuscleMass) : null, 1, " kg")} />
                <Row label="Masa grasa" value={fmt(bia.inbodyFatMass ? Number(bia.inbodyFatMass) : null, 1, " kg")} />
                <Row label="% grasa" value={fmt(bia.inbodyFatPercent ? Number(bia.inbodyFatPercent) : null, 1, " %")} />
                <Row label="Grasa visceral" value={fmt(bia.inbodyVisceralFat ? Number(bia.inbodyVisceralFat) : null)} />
                <Row label="Agua corporal total" value={fmt(bia.inbodyTBW ? Number(bia.inbodyTBW) : null, 1, " kg")} />
                <Row label="Agua extracelular" value={fmt(bia.inbodyECW ? Number(bia.inbodyECW) : null, 1, " kg")} />
                <Row label="Agua intracelular" value={fmt(bia.inbodyICW ? Number(bia.inbodyICW) : null, 1, " kg")} />
                <p className="text-[11px] text-cedersa-orange pt-2">
                  Resultado proporcionado por el dispositivo InBody.
                </p>
              </CardContent>
            </Card>

            {/* Estimación científica */}
            <Card className="border-t-4 border-t-[var(--cedersa-red)]">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Estimación científica</span>
                  <CalculatedBadge />
                </CardTitle>
                <CardDescription>
                  {selection?.recommended
                    ? `${selection.recommended.authors} (${selection.recommended.year})`
                    : "Calcule con una ecuación seleccionada."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Row label="Índice de resistencia H²/R" value={fmt(computed?.ri ?? null, 1, " cm²/ohm")} />
                <Row label="Masa libre de grasa" value={fmt(preview?.calcFFM ?? null, 1, " kg")} />
                <Row label="Masa grasa" value={fmt(preview?.calcFM ?? null, 1, " kg")} />
                <Row label="% grasa" value={fmt(preview?.calcFatPercent ?? null, 1, " %")} />
                <Row label="FFMI" value={fmt(preview?.calcFFMI ?? null, 1, " kg/m²")} />
                <Row label="FMI" value={fmt(preview?.calcFMI ?? null, 1, " kg/m²")} />
                <Row label="Ángulo de fase" value={fmt(computed?.pa ?? preview?.calcPhaseAngle ?? null, 2, "°")} />
                {selection?.recommended?.see !== null && selection?.recommended?.see !== undefined && preview?.calcFFM != null && (
                  <Alert className="mt-2 py-2">
                    <Info className="w-4 h-4" />
                    <AlertDescription className="text-xs">
                      Resultado estimado: {preview.calcFFM.toFixed(1)} kg — Incertidumbre aproximada: ± {selection.recommended.see} kg
                      (intervalo {Math.max(0, preview.calcFFM - selection.recommended.see).toFixed(1)} - {(preview.calcFFM + selection.recommended.see).toFixed(1)} kg).
                    </AlertDescription>
                  </Alert>
                )}
                <p className="text-[11px] text-muted-foreground pt-2">
                  La estimación supone una hidratación aproximada del 73% de la masa libre de grasa.
                  Este supuesto puede variar según edad, sexo, estado fisiológico, hidratación,
                  entrenamiento, enfermedad y otras características individuales.
                </p>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <FlaskConical className="w-4 h-4" />
            <AlertDescription className="text-xs">
              La estimación científica se calcula en el servidor con la fórmula indicada. El resultado
              final se guarda con el identificador de la ecuación utilizada, la fecha de cálculo y la
              trazabilidad de versión.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Paso 5: Interpretación */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interpretación y guardado</CardTitle>
            <CardDescription>
              Frases interpretativas no diagnósticas basadas en rangos de referencia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-sm space-y-2 list-disc pl-5">
              <li>El resultado debe interpretarse junto con antecedentes clínicos, rendimiento físico y otras evaluaciones.</li>
              {preview?.calcFFMI != null && (
                <li>
                  {participant?.sex === "MASCULINO"
                    ? preview.calcFFMI < 18.9
                      ? "El índice de masa libre de grasa se ubica por debajo del rango de referencia utilizado para hombres adultos."
                      : "El índice de masa libre de grasa se encuentra dentro del rango de referencia utilizado."
                    : preview.calcFFMI < 14.9
                    ? "El índice de masa libre de grasa se ubica por debajo del rango de referencia utilizado para mujeres adultas."
                    : "El índice de masa libre de grasa se encuentra dentro del rango de referencia utilizado."}
                </li>
              )}
              {qualityScore !== "VERDE" && (
                <li>Las condiciones de medición pueden afectar la precisión del resultado; considere repetir la evaluación bajo protocolo estandarizado.</li>
              )}
            </ul>
            <Alert>
              <Info className="w-4 h-4" />
              <AlertTitle>Importante</AlertTitle>
              <AlertDescription className="text-xs">
                Los resultados obtenidos mediante bioimpedancia corresponden a estimaciones de
                composición corporal dependientes del dispositivo, ecuación, estado de hidratación
                y condiciones de medición. No constituyen por sí solos un diagnóstico médico.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Paso 6: Guardado */}
      {step === 6 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Check className="w-5 h-5 text-cedersa-blue" /> Evaluación registrada
            </CardTitle>
            <CardDescription>
              La medición quedó almacenada con su trazabilidad completa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {savedId && (
              <div className="text-sm">
                <div><strong>ID de medición:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{savedId}</code></div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => setSection("evolucion")}>
                    Ver evolución del participante
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSection("reportes")}>
                    Generar reporte PDF
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Controles */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={prev} disabled={step === 0}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
        </Button>
        {step < 5 ? (
          <Button onClick={next}>
            Siguiente <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : step === 5 ? (
          <Button onClick={save}>
            <Save className="w-4 h-4 mr-2" /> Guardar evaluación
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm py-1 border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function Info2({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium capitalize">{value.replace("_", " ")}</div>
    </div>
  );
}
