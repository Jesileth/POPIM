
//
// Controladores de Horarios y bloqueos del Administrador

import * as servicio from "../services/adminHorarios.service.js";

// GET /admin/horarios/:personalId
export async function obtenerHorario(req, res) {
  res.json(await servicio.obtener(req.params.personalId, req.personal));
}

// PUT /admin/horarios/:personalId  { turnos: [{ dia, inicio, fin }] }
export async function guardarHorario(req, res) {
  res.json(await servicio.guardarHorario(req.params.personalId, req.body.turnos, req.personal));
}

// POST /admin/horarios/:personalId/bloqueos  { inicio, fin, motivo }
export async function crearBloqueo(req, res) {
  res.status(201).json(await servicio.crearBloqueo(req.params.personalId, req.body, req.personal));
}

// DELETE /admin/bloqueos/:id
export async function borrarBloqueo(req, res) {
  res.json(await servicio.borrarBloqueo(req.params.id, req.personal));
}