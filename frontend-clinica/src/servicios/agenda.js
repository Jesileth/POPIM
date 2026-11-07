import { peticion } from "@/lib/api";
import { simular } from "@/lib/simulador";
import * as m from "@/lib/mockClinica";

//


// GET /clinica/agenda?fecha=AAAA-MM-DD
// Devuelve los veterinarios de la clínica con su horario, bloqueos y citas de ese día.
// (El backend sabe de qué clínica eres por tu sesión, no hace falta mandarla.)
export function obtenerAgenda(fecha) {
  return peticion(`/clinica/agenda?fecha=${fecha}`);
}

// ---------------------------------------------------------------------------
// Traído del proyecto de tu compañero (pantalla de Reprogramación).
// TEMPORAL: todavía lee del mock en memoria (lib/mockClinica.js) con `simular`.
// Cuando exista el backend, cámbialos por peticion("/clinica/...") igual que obtenerAgenda.
// ---------------------------------------------------------------------------

export const listarVeterinarios = simular(m.listarVeterinarios, 150);
// Los bloques no están guardados: el servidor los calcula (horario − citas activas − bloqueos)
export const obtenerDisponibilidad = simular(m.obtenerDisponibilidad, 200);

