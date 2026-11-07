import { peticion } from "@/lib/api";

// GET /clinica/agenda?fecha=AAAA-MM-DD
// Devuelve los veterinarios de la clínica con su horario, bloqueos y citas de ese día.
// (El backend sabe de qué clínica eres por tu sesión, no hace falta mandarla.)
export function obtenerAgenda(fecha) {
  return peticion(`/clinica/agenda?fecha=${fecha}`);
}

// Las pantallas de tu compañero (Recepción, Confirmación, Reprogramación) esperan
// { veterinarios: [{ id, nombreCompleto, especialidad }] }. El backend manda
// [{ personalId, nombre, especialidad }], así que aquí se "traduce".
export async function listarVeterinarios() {
  const r = await peticion("/clinica/veterinarios");
  if (!r.ok) return r;
  return {
    ...r,
    datos: {
      veterinarios: r.datos.map((v) => ({ id: v.personalId, nombreCompleto: v.nombre, especialidad: v.especialidad })),
    },
  };
}

// Bloques del veterinario ese día: { bloques: [{ horaInicio, horaFin, disponible }] }
// Si todavía no eligieron veterinario o fecha, no se pregunta nada al servidor.
export function obtenerDisponibilidad(veterinarioId, fecha) {
  if (!veterinarioId || !fecha) return Promise.resolve({ ok: true, estado: 200, datos: { bloques: [] } });
  return peticion(`/clinica/veterinarios/${veterinarioId}/disponibilidad?fecha=${fecha}`);
}