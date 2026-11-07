

// Controladores de las citas de RECEPCIÓN. req.personal lo pone cargarPersonal.

import { ErrorHttp } from "../utils/errores.js";
import { esFechaValida } from "../utils/fechas.js";
import * as citasClinicaService from "../services/citasClinica.service.js";

// GET /clinica/citas?fecha=AAAA-MM-DD
export async function delDia(req, res) {
  const fecha = typeof req.query.fecha === "string" ? req.query.fecha : "";
  if (!esFechaValida(fecha)) throw new ErrorHttp(400, "Elige una fecha válida", "fecha");
  res.json(await citasClinicaService.delDia(req.personal.clinicaId, fecha));
}

// GET /clinica/citas/solicitadas
export async function solicitadas(req, res) {
  res.json(await citasClinicaService.solicitadas(req.personal.clinicaId));
}

// GET /clinica/citas/reprogramables
export async function reprogramables(req, res) {
  res.json(await citasClinicaService.reprogramables(req.personal.clinicaId));
}

// GET /clinica/citas/:id
export async function detalle(req, res) {
  res.json(await citasClinicaService.detalle(req.personal.clinicaId, req.params.id));
}

// POST /clinica/citas/:id/confirmar
export async function confirmar(req, res) {
  res.json(await citasClinicaService.confirmar(req.personal.clinicaId, req.usuarioId, req.params.id));
}

// POST /clinica/citas/:id/cancelar { motivo }
export async function cancelar(req, res) {
  res.json(await citasClinicaService.cancelar(req.personal.clinicaId, req.usuarioId, req.params.id, req.body.motivo));
}

// POST /clinica/citas/:id/reprogramar { veterinarioId, fecha, horaInicio, motivo }
export async function reprogramar(req, res) {
  res.json(await citasClinicaService.reprogramar(req.personal.clinicaId, req.usuarioId, req.params.id, req.body));
}