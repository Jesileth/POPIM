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

// ---------------------------------------------------------------------------
// Antes eran TEMPORALES (leían lib/mockClinica.js). Ahora hablan con el backend
// y devuelven la MISMA forma, así las pantallas de tu compañero no cambian.
// ---------------------------------------------------------------------------

// GET → { citas: [...], totalVeterinarios }
export const citasDelDia = (fecha) => peticion(`/clinica/citas?fecha=${fecha}`);

// GET → { citas: [...] } solicitadas de hoy en adelante
export const citasSolicitadas = () => peticion("/clinica/citas/solicitadas");

// GET → { citas: [...] } solicitadas o confirmadas, sin emergencias
export const citasReprogramables = () => peticion("/clinica/citas/reprogramables");

// GET → { cita } con su historial
export const obtenerCita = (id) => peticion(`/clinica/citas/${id}`);

export const confirmarCita = (id) => peticion(`/clinica/citas/${id}/confirmar`, { metodo: "POST" });

export const cancelarCita = (id, motivo) =>
  peticion(`/clinica/citas/${id}/cancelar`, { metodo: "POST", cuerpo: { motivo } });

// datos = { veterinarioId, fecha, horaInicio, motivo }
export const reprogramarCita = (id, datos) =>
  peticion(`/clinica/citas/${id}/reprogramar`, { metodo: "POST", cuerpo: datos });


/*import { peticion } from "@/lib/api";
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

*/