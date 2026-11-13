import { peticion } from "@/lib/api";

// ---------- Personal (Administrador de la clínica) ----------
// Todas van a /api/admin/...: el backend sabe de qué clínica eres por tu sesión,
// por eso ninguna función manda el id de la clínica.

export const listarPersonal = () => peticion("/admin/personal");
export const listarEspecialidades = () => peticion("/admin/especialidades");

// Paso 1 de "Vincular personal": ¿existe ese correo? ¿se puede vincular?
export const buscarPorCorreo = (correo) =>
  peticion(`/admin/personal/buscar?correo=${encodeURIComponent(correo.trim())}`);

export const vincularPersonal = (datos) => peticion("/admin/personal", { metodo: "POST", cuerpo: datos });

export const actualizarDatosProfesionales = (personalId, datos) =>
  peticion(`/admin/personal/${personalId}/profesional`, { metodo: "PUT", cuerpo: datos });

export const desbloquearPersonal = (personalId) =>
  peticion(`/admin/personal/${personalId}/desbloquear`, { metodo: "POST" });

export const cambiarVinculo = (personalId, activo) =>
  peticion(`/admin/personal/${personalId}/vinculo`, { metodo: "PATCH", cuerpo: { activo } });

// ---------- Horarios y bloqueos ----------

// Horario semanal, horario de la clínica y bloqueos de una persona
export const obtenerHorario = (personalId) => peticion(`/admin/horarios/${personalId}`);

// turnos = [{ dia: "LUNES", inicio: "08:00", fin: "12:00" }, ...] (reemplaza el horario completo)
export const guardarHorario = (personalId, turnos) =>
  peticion(`/admin/horarios/${personalId}`, { metodo: "PUT", cuerpo: { turnos } });

// datos = { inicio: "2026-11-20T08:00", fin: "2026-11-20T12:00", motivo: "Vacaciones" }
export const crearBloqueo = (personalId, datos) =>
  peticion(`/admin/horarios/${personalId}/bloqueos`, { metodo: "POST", cuerpo: datos });

export const borrarBloqueo = (bloqueoId) => peticion(`/admin/bloqueos/${bloqueoId}`, { metodo: "DELETE" });

// ---------- Mi clínica ----------
// TEMPORAL: todavía es de demostración. Se conecta en el paso de "Mi clínica".
export const guardarClinica = async (datos) => ({ ...datos });