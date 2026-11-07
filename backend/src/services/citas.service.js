

// gabriela lalala


import { ErrorHttp } from "../utils/errores.js";
import * as citasRepo from "../repositories/citas.repository.js";
import * as agendaService from "./agenda.service.js";

const MSG_OCUPADO = "Ese horario acaba de ser reservado. Elige otro.";
const ESTADOS_CANCELABLES = [501, 502]; // Solicitada y Confirmada

function formatear(f) {
  return {
    id: f.id,
    fecha: f.fecha,
    horaInicio: f.horaInicio.slice(0, 5),
    horaFin: f.horaFin.slice(0, 5),
    motivoConsulta: f.motivoConsulta,
    estado: { codigo: f.estadoCodigo, nombre: f.estadoNombre },
    motivoCancelacion: f.motivoCancelacion,
    mascota: { id: f.mascotaId, nombre: f.mascotaNombre, codigoUnico: f.mascotaCodigo },
    veterinario: { id: f.vetId, nombreCompleto: f.vetNombre, especialidad: f.vetEspecialidad },
    clinica: { id: f.clinicaId, nombreComercial: f.clinicaNombre, direccion: f.clinicaDireccion },
  };
}

export async function listar(usuarioId) {
  const filas = await citasRepo.listarPorUsuario(usuarioId);
  return { citas: filas.map(formatear) };
}

export async function solicitar(usuarioId, d) {
  const [mascotaValida, agenda] = await Promise.all([
    citasRepo.mascotaActivaDeUsuario(d.mascotaId, usuarioId),
    agendaService.disponibilidad(d.veterinarioId, d.fecha),
  ]);
  if (!mascotaValida) throw new ErrorHttp(400, "La mascota no existe", "mascota");

  const bloque = agenda.bloques.find((b) => b.horaInicio === d.horaInicio);
  if (!bloque) throw new ErrorHttp(400, "Ese horario no existe para el veterinario elegido", "hora");
  if (!bloque.disponible) throw new ErrorHttp(409, MSG_OCUPADO, "hora");

  try {
    const id = await citasRepo.crearCita({
      usuarioId,
      mascotaId: d.mascotaId,
      veterinarioId: d.veterinarioId,
      fecha: d.fecha,
      horaInicio: bloque.horaInicio,
      horaFin: bloque.horaFin,
      motivoConsulta: d.motivoConsulta,
    });
    return { cita: formatear(await citasRepo.buscarDeUsuario(id, usuarioId)) };
  } catch (error) {
    // Alguien reservó el mismo bloque en el mismo instante: la base lo rechazó con uq_bloque
    if (error.code === "ER_DUP_ENTRY" && (error.sqlMessage || "").includes("uq_bloque")) {
      throw new ErrorHttp(409, MSG_OCUPADO, "hora");
    }
    throw error;
  }
}

export async function cancelar(usuarioId, citaId, motivo) {
  const fila = await citasRepo.buscarDeUsuario(citaId, usuarioId);
  if (!fila) throw new ErrorHttp(404, "No encontramos esa cita");

  const mensaje = "Esta cita ya no se puede cancelar";
  if (!ESTADOS_CANCELABLES.includes(fila.estadoId)) throw new ErrorHttp(409, mensaje);

  const hecho = await citasRepo.cancelarCita({
    citaId,
    usuarioId,
    motivo,
    estadoAnteriorId: fila.estadoId,
  });
  if (!hecho) throw new ErrorHttp(409, mensaje);

  return { cita: formatear(await citasRepo.buscarDeUsuario(citaId, usuarioId)) };
}