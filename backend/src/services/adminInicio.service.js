
//

// Arma el Inicio del Administrador: tarjetas, citas de hoy, avisos, el mes y los bloqueos.
// "yo" = req.personal: { id, clinicaId, rol }

import { hoyLocal, deMinutos, ahoraEnMinutos } from "../utils/fechas.js";
import * as repo from "../repositories/adminInicio.repository.js";

export async function resumen(yo) {
  const hoy = hoyLocal();
  const ahora = `${hoy} ${deMinutos(ahoraEnMinutos())}:00`;

  // Las 4 consultas no dependen entre sí: se piden a la vez
  const [personal, porVeterinario, mes, bloqueos] = await Promise.all([
    repo.personalActivo(yo.clinicaId),
    repo.citasDeHoyPorVeterinario(yo.clinicaId, hoy),
    repo.resumenDelMes(yo.clinicaId, hoy),
    repo.proximosBloqueos(yo.clinicaId, ahora),
  ]);

  // ---- Tarjetas de arriba (se suman en JavaScript a partir de lo que ya trajimos) ----
  const sumar = (campo) => porVeterinario.reduce((total, v) => total + v[campo], 0);
  const contarRol = (rol) => personal.filter((p) => p.rol === rol).length;
  const bloqueadas = personal.filter((p) => p.cuentaEstadoId === 103);

  const tarjetas = {
    citasHoy: sumar("finalizadas") + sumar("enCurso") + sumar("confirmadas") + sumar("solicitadas") + sumar("noAsistio"),
    solicitadasHoy: sumar("solicitadas"),
    enCurso: sumar("enCurso"),
    personalActivo: personal.length,
    veterinarios: contarRol("VETERINARIO"),
    recepcionistas: contarRol("RECEPCIONISTA"),
    administradores: contarRol("ADMINISTRADOR"),
    cuentasBloqueadas: bloqueadas.length,
  };

  // ---- "Requiere tu atención": cosas que solo el administrador puede resolver ----
  const avisos = [
    ...bloqueadas.map((p) => ({
      tipo: "BLOQUEADA", personalId: p.personalId,
      texto: `La cuenta de ${p.nombreCompleto} está bloqueada por intentos fallidos.`,
    })),
    ...bloqueos.filter((b) => b.citasAfectadas > 0).map((b) => ({
      tipo: "BLOQUEO_CON_CITAS", personalId: b.personalId,
      texto: `El bloqueo «${b.motivo}» de ${b.nombreCompleto} choca con ${b.citasAfectadas} ${b.citasAfectadas === 1 ? "cita pendiente" : "citas pendientes"}.`,
    })),
    ...personal.filter((p) => p.cuentaEstadoId === 101).map((p) => ({
      tipo: "SIN_ACTIVAR", personalId: p.personalId,
      texto: `${p.nombreCompleto} aún no activa su cuenta.`,
    })),
    ...personal.filter((p) => p.rol === "VETERINARIO" && p.turnos === 0).map((p) => ({
      tipo: "SIN_HORARIO", personalId: p.personalId,
      texto: `${p.nombreCompleto} no tiene horario: nadie puede agendar con él o ella.`,
    })),
  ];

  return {
    hoy,
    tarjetas,
    porVeterinario: porVeterinario.map((v) => ({
      ...v,
      total: v.finalizadas + v.enCurso + v.confirmadas + v.solicitadas + v.noAsistio,
    })),
    avisos,
    mes,
    proximosBloqueos: bloqueos,
  };
}