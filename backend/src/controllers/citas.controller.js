

// 

import { ErrorHttp } from "../utils/errores.js";
import { esFechaValida, hoyLocal } from "../utils/fechas.js";
import * as citasService from "../services/citas.service.js";

const texto = (v) => (typeof v === "string" ? v.trim() : "");

export async function listar(req, res) {
  res.json(await citasService.listar(req.usuarioId));
}

export async function solicitar(req, res) {
  const b = req.body ?? {};
  const mascotaId = texto(b.mascotaId);
  const veterinarioId = texto(b.veterinarioId);
  const fecha = texto(b.fecha);
  const horaInicio = texto(b.horaInicio);
  const motivoConsulta = texto(b.motivoConsulta);

  if (!mascotaId) throw new ErrorHttp(400, "Elige una mascota", "mascota");
  if (!veterinarioId) throw new ErrorHttp(400, "Elige un veterinario", "veterinario");
  if (!esFechaValida(fecha)) throw new ErrorHttp(400, "Elige una fecha válida", "fecha");
  if (fecha < hoyLocal()) throw new ErrorHttp(400, "No puedes elegir una fecha pasada", "fecha");
  if (!/^\d{2}:\d{2}$/.test(horaInicio)) throw new ErrorHttp(400, "Elige un horario", "hora");
  if (motivoConsulta.length < 3 || motivoConsulta.length > 255)
    throw new ErrorHttp(400, "Cuéntanos el motivo de la consulta (máximo 255 letras)", "motivoConsulta");

  const creada = await citasService.solicitar(req.usuarioId, {
    mascotaId, veterinarioId, fecha, horaInicio, motivoConsulta,
  });
  res.status(201).json(creada);
}

export async function cancelar(req, res) {
  const motivo = texto(req.body?.motivoCancelacion);
  if (motivo.length < 3 || motivo.length > 255)
    throw new ErrorHttp(400, "Cuéntanos el motivo de la cancelación (máximo 255 letras)", "motivoCancelacion");

  res.json(await citasService.cancelar(req.usuarioId, req.params.id, motivo));
}