

// Reglas de las citas en la RECEPCIÓN de una clínica (patrón State: qué cambio se permite en cada estado)
//   SOLICITADA (501) → confirmar, cancelar, reprogramar
//   CONFIRMADA (502) → cancelar, reprogramar
//   Emergencias: NO se confirman, NO se cancelan, NO se reprograman desde recepción.

import { ErrorHttp } from "../utils/errores.js";
import { aLocalManagua, hoyLocal } from "../utils/fechas.js";
import * as citasClinicaRepo from "../repositories/citasClinica.repository.js";
import * as citasRepo from "../repositories/citas.repository.js";
import * as clinicaRepo from "../repositories/clinica.repository.js";
import * as agendaRepo from "../repositories/agenda.repository.js";
import * as agendaService from "./agenda.service.js";

const MSG_OCUPADO = "Ese bloque ya no está disponible. Elige otro.";
const MSG_CAMBIO = "La cita cambió mientras la revisabas. Actualiza la página.";

// Fila de la BD → la forma que usan las pantallas de recepción
function formatear(f, historial = []) {
  return {
    id: f.id,
    fecha: f.fecha,
    horaInicio: f.horaInicio,
    horaFin: f.horaFin,
    motivoConsulta: f.motivoConsulta,
    motivoCancelacion: f.motivoCancelacion,
    estado: f.estado, // "SOLICITADA", "CONFIRMADA", "ATENCION"…
    estadoId: f.estadoId,
    esEmergencia: Boolean(f.esEmergencia),
    prioridad: f.prioridad,
    personaPresentador: f.personaPresentador,
    creadaPor: f.creadaPorPropietario ? "PROPIETARIO" : "CLINICA",
    solicitadaEl: aLocalManagua(f.fechaCreacion), // "2026-11-07T02:56"
    enConsultaDesde: f.enConsultaDesde ? aLocalManagua(f.enConsultaDesde).slice(11, 16) : null,
    mascota: {
      id: f.mascotaId, nombre: f.mascotaNombre, codigoUnico: f.mascotaCodigo,
      especie: f.especie, raza: f.raza ?? "Mestizo", sexo: f.mascotaSexo, edadActualMeses: f.mascotaEdadMeses,
    },
    propietario: {
      id: f.propietarioId, nombreCompleto: f.propietarioNombre,
      telefono: f.propietarioTelefono, correo: f.propietarioCorreo,
    },
    veterinario: { id: f.vetId, nombreCompleto: f.vetNombre, especialidad: f.vetEspecialidad },
    historial: historial.map((h) => ({
      titulo: h.titulo,
      detalle: h.motivo ? `${h.quien} · ${h.motivo}` : h.quien,
      fecha: aLocalManagua(h.fecha),
    })),
  };
}

// La cita con su historial (para el detalle y para responder después de cada acción)
async function citaCompleta(citaId, clinicaId) {
  const [fila, historial] = await Promise.all([
    citasClinicaRepo.buscar(citaId, clinicaId),
    citasClinicaRepo.historial(citaId),
  ]);
  if (!fila) throw new ErrorHttp(404, "No encontramos esa cita");
  return formatear(fila, historial);
}

// La busca y revisa que recepción pueda tocarla
async function citaModificable(citaId, clinicaId, estadosPermitidos, mensaje) {
  const fila = await citasClinicaRepo.buscar(citaId, clinicaId);
  if (!fila) throw new ErrorHttp(404, "No encontramos esa cita");
  if (fila.esEmergencia) throw new ErrorHttp(409, "Las emergencias no se modifican desde recepción");
  if (!estadosPermitidos.includes(fila.estadoId)) throw new ErrorHttp(409, mensaje);
  return fila;
}

// ---------- Listas ----------
export async function delDia(clinicaId, fecha) {
  const [filas, { filas: vets }] = await Promise.all([
    citasClinicaRepo.delDia(clinicaId, fecha),
    agendaRepo.listarVeterinarios(clinicaId),
  ]);
  return { citas: filas.map((f) => formatear(f)), totalVeterinarios: vets.length };
}

export async function solicitadas(clinicaId) {
  const filas = await citasClinicaRepo.solicitadas(clinicaId, hoyLocal());
  return { citas: filas.map((f) => formatear(f)) };
}

export async function reprogramables(clinicaId) {
  const filas = await citasClinicaRepo.reprogramables(clinicaId, hoyLocal());
  return { citas: filas.map((f) => formatear(f)) };
}

export async function detalle(clinicaId, citaId) {
  return { cita: await citaCompleta(citaId, clinicaId) };
}

// ---------- Acciones ----------
export async function confirmar(clinicaId, usuarioId, citaId) {
  await citaModificable(citaId, clinicaId, [501], "Solo se pueden confirmar citas solicitadas");
  const hecho = await citasClinicaRepo.confirmar(citaId, usuarioId);
  if (!hecho) throw new ErrorHttp(409, MSG_CAMBIO);
  return { cita: await citaCompleta(citaId, clinicaId) };
}

export async function cancelar(clinicaId, usuarioId, citaId, motivo) {
  const fila = await citaModificable(citaId, clinicaId, [501, 502], "Esta cita ya no se puede cancelar");
  // Misma operación que usa el propietario: 505 + motivo + historial
  const hecho = await citasRepo.cancelarCita({ citaId, usuarioId, motivo, estadoAnteriorId: fila.estadoId });
  if (!hecho) throw new ErrorHttp(409, MSG_CAMBIO);
  return { cita: await citaCompleta(citaId, clinicaId) };
}

export async function reprogramar(clinicaId, usuarioId, citaId, d) {
  const fila = await citaModificable(citaId, clinicaId, [501, 502], "Esta cita ya no se puede reprogramar");

  if (d.fecha < hoyLocal()) throw new ErrorHttp(400, "Elige una fecha de hoy en adelante", "fecha");
  if (!(await clinicaRepo.veterinarioDeClinica(d.veterinarioId, clinicaId)))
    throw new ErrorHttp(400, "Elige un veterinario de tu clínica", "vet");

  const { bloques } = await agendaService.disponibilidad(d.veterinarioId, d.fecha);
  const bloque = bloques.find((b) => b.horaInicio === d.horaInicio);
  if (!bloque || !bloque.disponible) throw new ErrorHttp(409, MSG_OCUPADO, "hora");

  try {
    const hecho = await citasClinicaRepo.reprogramar({
      citaId, usuarioId, motivo: d.motivo, estadoId: fila.estadoId,
      // cómo estaba (para cita_reprogramaciones y para comprobar que nadie la cambió)
      fechaAnterior: fila.fecha, horaAnterior: `${fila.horaInicio}:00`, veterinarioAnteriorId: fila.vetId,
      // cómo queda
      veterinarioId: d.veterinarioId, fecha: d.fecha, horaInicio: bloque.horaInicio, horaFin: bloque.horaFin,
    });
    if (!hecho) throw new ErrorHttp(409, MSG_CAMBIO);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY" && (error.sqlMessage || "").includes("uq_bloque"))
      throw new ErrorHttp(409, MSG_OCUPADO, "hora");
    throw error;
  }
  return { cita: await citaCompleta(citaId, clinicaId) };
}