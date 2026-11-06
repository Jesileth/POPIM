

//

import { peticion } from "@/lib/api";

// GET /clinica/agenda?fecha=AAAA-MM-DD
// Devuelve los veterinarios de la clínica con su horario, bloqueos y citas de ese día.
// (El backend sabe de qué clínica eres por tu sesión, no hace falta mandarla.)
export function obtenerAgenda(fecha) {
  return peticion(`/clinica/agenda?fecha=${fecha}`);
}