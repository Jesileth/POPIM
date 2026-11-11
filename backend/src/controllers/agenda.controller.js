
//

import { ErrorHttp } from "../utils/errores.js";
import { hoyLocal } from "../utils/fechas.js";
import * as agendaService from "../services/agenda.service.js";

export async function clinicas(req, res) {
  res.json(await agendaService.clinicas());
}

export async function veterinarios(req, res) {
  res.json(await agendaService.veterinarios(req.params.id));
}

export async function disponibilidad(req, res) {
  const fecha = typeof req.query.fecha === "string" ? req.query.fecha : "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(new Date(`${fecha}T00:00:00`).getTime()))
    throw new ErrorHttp(400, "Elige una fecha válida", "fecha");
  if (fecha < hoyLocal())
    throw new ErrorHttp(400, "No puedes elegir una fecha pasada", "fecha");

  res.json(await agendaService.disponibilidad(req.params.id, fecha));
}