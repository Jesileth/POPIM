import { peticion } from "@/lib/api";

export const listarClinicas = () => peticion("/clinicas");

export const listarVeterinarios = (clinicaId) =>
  peticion(`/clinicas/${clinicaId}/veterinarios`);

// Los bloques no están guardados: el servidor los calcula para esa fecha
export const obtenerDisponibilidad = (veterinarioId, fecha) =>
  peticion(`/veterinarios/${veterinarioId}/disponibilidad?fecha=${fecha}`);