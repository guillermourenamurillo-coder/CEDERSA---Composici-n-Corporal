// Constante de hidratación y nota metodológica asociada.
// La masa libre de grasa (FFM) se asume hidratada en aproximadamente 73%,
// supuesto que sustenta muchas ecuaciones de bioimpedancia. Este valor puede
// variar con la edad, sexo, estado fisiológico, hidratación, entrenamiento,
// enfermedad y otras características individuales.

export const HYDRATION_CONSTANT = 0.73;

export const HYDRATION_NOTE =
  "La estimación supone una hidratación aproximada del 73% de la masa libre de grasa. " +
  "Este supuesto puede variar según edad, sexo, estado fisiológico, hidratación, " +
  "entrenamiento, enfermedad y otras características individuales.";

export const NON_DIAGNOSTIC_FOOTER =
  "Los resultados obtenidos mediante bioimpedancia corresponden a estimaciones de " +
  "composición corporal dependientes del dispositivo, ecuación, estado de hidratación " +
  "y condiciones de medición. No constituyen por sí solos un diagnóstico médico.";
