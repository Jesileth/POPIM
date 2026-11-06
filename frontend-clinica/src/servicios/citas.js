

import { peticion } from "@/lib/api";

// Cita normal en un bloque de la agenda. Nace Confirmada porque la registra la clínica.
export function crearCita({ mascotaId, veterinarioId, fecha, horaInicio, motivo }) {
  return peticion("/clinica/citas", {
    metodo: "POST",
    cuerpo: { mascotaId, veterinarioId, fecha, horaInicio, motivo },
  });
}

// Emergencia: el backend pone la fecha y la hora reales del momento
export function crearEmergencia({ mascotaId, veterinarioId, prioridad, motivo, personaPresentador }) {
  return peticion("/clinica/citas/emergencia", {
    metodo: "POST",
    cuerpo: { mascotaId, veterinarioId, prioridad, motivo, personaPresentador },
  });
}