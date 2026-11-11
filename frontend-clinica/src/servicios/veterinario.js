// Servicios del rol VETERINARIO.
// Ya usan peticion(): mientras NEXT_PUBLIC_USAR_MOCK no sea "false", lib/mock.js los responde;
// cuando el backend tenga estas rutas, funcionarán sin cambiar nada aquí.
import { peticion, subirArchivo } from "@/lib/api";

// GET /clinica/mi-agenda?desde=AAAA-MM-DD&hasta=AAAA-MM-DD
// Solo las citas del veterinario de la sesión: el backend lo sabe por la cookie, no se manda.
export function obtenerMiAgenda(desde, hasta) {
  return peticion(`/clinica/mi-agenda?desde=${desde}&hasta=${hasta}`);
}

// GET /clinica/atencion/hoy → { fecha, citas: [...] } (la pantalla las agrupa)
export function obtenerAtencionHoy() {
  return peticion("/clinica/atencion/hoy");
}

// POST /clinica/consultas { citaId } → { consultaId }
// Abre la consulta y la cita pasa a "En curso" (503). Si ya estaba abierta, devuelve la misma.
export function iniciarConsulta(citaId) {
  return peticion("/clinica/consultas", { metodo: "POST", cuerpo: { citaId } });
}


// GET /clinica/consultas → { consultas: [...] } todas las que atendió el veterinario
export function obtenerMisConsultas() {
  return peticion("/clinica/consultas");
}

// GET /clinica/pacientes → { pacientes: [...] } mascotas que tienen o tuvieron cita con él
export function obtenerMisPacientes() {
  return peticion("/clinica/pacientes");
}

// GET /clinica/pacientes/:mascotaId → expediente (el backend lo anota en auditoria_expediente)
export function obtenerExpediente(mascotaId) {
  return peticion(`/clinica/pacientes/${mascotaId}`);
}


// ---------- Pantalla de consulta ----------
// GET /clinica/catalogos/consulta → { padecimientos, medicamentos, tiposExamen, productosPreventivos }
export const obtenerCatalogosConsulta = () => peticion("/clinica/catalogos/consulta");

// GET /clinica/consultas/:id → { consulta, mascota, propietario, pesoAnterior, cartilla, alertas }
export const obtenerConsulta = (id) => peticion(`/clinica/consultas/${id}`);

// PUT /clinica/consultas/:id → manda SOLO lo de la pestaña, ej. { diagnosticos, tratamiento }
export const guardarConsulta = (id, cambios) => peticion(`/clinica/consultas/${id}`, { metodo: "PUT", cuerpo: cambios });

// POST /clinica/consultas/:id/finalizar → cita 504; la consulta ya no se edita
export const finalizarConsulta = (id) => peticion(`/clinica/consultas/${id}/finalizar`, { metodo: "POST" });

// POST /clinica/consultas/:id/examenes?tipoExamenId=  (multipart: el archivo va en el campo "archivo")
export const subirExamen = (id, tipoExamenId, archivo) =>
  subirArchivo(`/clinica/consultas/${id}/examenes?tipoExamenId=${tipoExamenId}`, archivo, "archivo");

// POST /clinica/consultas/:id/cita { tipo: "CONTROL"|"REFERIR", veterinarioId, fecha, horaInicio, motivo }
export const citaDesdeConsulta = (id, datos) => peticion(`/clinica/consultas/${id}/cita`, { metodo: "POST", cuerpo: datos });

// POST /clinica/dosis/:id/aplicar { consultaId, lote } → la aplica HOY el veterinario de la sesión
export const aplicarDosis = (dosisId, consultaId, lote) =>
  peticion(`/clinica/dosis/${dosisId}/aplicar`, { metodo: "POST", cuerpo: { consultaId, lote } });

// POST /clinica/consultas/:id/dosis { productoId, fechaProgramada } → nueva dosis PENDIENTE en la cartilla
export const programarDosis = (consultaId, datos) =>
  peticion(`/clinica/consultas/${consultaId}/dosis`, { metodo: "POST", cuerpo: datos });

// GET /clinica/veterinarios/:id/disponibilidad?fecha= → { bloques: [{ horaInicio, horaFin, disponible }] }
export const obtenerDisponibilidad = (personalId, fecha) =>
  peticion(`/clinica/veterinarios/${personalId}/disponibilidad?fecha=${fecha}`);