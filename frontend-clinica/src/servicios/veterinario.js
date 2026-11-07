// Servicios del rol VETERINARIO.
// Ya usan peticion(): mientras NEXT_PUBLIC_USAR_MOCK no sea "false", lib/mock.js los responde;
// cuando el backend tenga estas rutas, funcionarán sin cambiar nada aquí.
import { peticion } from "@/lib/api";

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