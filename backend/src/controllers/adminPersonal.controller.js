
//

// Controladores de Personal del Administrador.
// req.personal (lo pone cargarPersonal) = { id, clinicaId, rol } de quien inició sesión

import * as servicio from "../services/adminPersonal.service.js";

export async function listarPersonal(req, res) {
  res.json(await servicio.listar(req.personal));
}

export async function especialidades(req, res) {
  res.json(await servicio.especialidades());
}

// GET /admin/personal/buscar?correo=...
export async function buscarPorCorreo(req, res) {
  res.json(await servicio.buscarPorCorreo(req.query.correo, req.personal));
}

export async function vincularPersonal(req, res) {
  res.status(201).json(await servicio.vincular(req.body, req.personal, req.usuarioId));
}

export async function actualizarProfesional(req, res) {
  res.json(await servicio.actualizarProfesional(req.params.id, req.body, req.personal));
}

export async function desbloquear(req, res) {
  res.json(await servicio.desbloquear(req.params.id, req.personal));
}

export async function cambiarVinculo(req, res) {
  res.json(await servicio.cambiarVinculo(req.params.id, req.body.activo, req.personal));
}