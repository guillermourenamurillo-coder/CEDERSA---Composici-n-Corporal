"use client";

import { create } from "zustand";

export type Section =
  | "dashboard"
  | "participantes"
  | "nueva-evaluacion"
  | "evolucion"
  | "ecuaciones"
  | "dispositivos"
  | "investigacion"
  | "reportes"
  | "ajustes";

interface AppState {
  currentSection: Section;
  selectedParticipantId: string | null;
  selectedMeasurementId: string | null;
  setSection: (s: Section) => void;
  selectParticipant: (id: string | null) => void;
  selectMeasurement: (id: string | null) => void;
  // helper para iniciar una nueva evaluación con participante preseleccionado
  startEvaluationFor: (participantId: string) => void;
  viewEvolutionFor: (participantId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentSection: "dashboard",
  selectedParticipantId: null,
  selectedMeasurementId: null,
  setSection: (s) => set({ currentSection: s }),
  selectParticipant: (id) => set({ selectedParticipantId: id }),
  selectMeasurement: (id) => set({ selectedMeasurementId: id }),
  startEvaluationFor: (participantId) =>
    set({ selectedParticipantId: participantId, currentSection: "nueva-evaluacion" }),
  viewEvolutionFor: (participantId) =>
    set({ selectedParticipantId: participantId, currentSection: "evolucion" }),
}));
