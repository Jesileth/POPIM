import { peticion } from "@/lib/api";
import { simular } from "@/lib/simulador";
import * as m from "@/lib/mockClinica";

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

// ---------------------------------------------------------------------------
// Traído del proyecto de tu compañero (Recepción, Confirmación, Reprogramación y Detalle).
// TEMPORAL: todavía leen del mock en memoria (lib/mockClinica.js) con `simular`.
// Cuando exista el backend, cada una se cambia por su peticion("/clinica/citas/...").
// Ojo: crearCita y crearEmergencia de arriba son las tuyas (ya hablan con el backend);
// las de tu compañero NO se copiaron porque tenían el mismo nombre.
// ---------------------------------------------------------------------------

export const citasDelDia = simular(m.citasDelDia);
export const citasSolicitadas = simular(m.citasSolicitadas);
export const citasReprogramables = simular(m.citasReprogramables);
export const obtenerCita = simular(m.obtenerCita);
export const confirmarCita = simular(m.confirmarCita);
export const cancelarCita = simular(m.cancelarCita);
export const reprogramarCita = simular(m.reprogramarCita);

