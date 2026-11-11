
//

// Controladores de Clínicas del Super Administrador (el body ya viene limpio por Zod)

import * as servicio from "../services/superClinicas.service.js";

// GET /super/clinicas?q=texto&estado=ACTIVAS|INACTIVAS
export async function listarClinicas(req, res) {
  res.json(await servicio.listar({ q: req.query.q, estado: req.query.estado }));
}

export async function obtenerClinica(req, res) {
  res.json(await servicio.obtener(req.params.id));
}

export async function registrarClinica(req, res) {
  res.status(201).json(await servicio.registrar(req.usuarioId, req.body));
}

export async function actualizarClinica(req, res) {
  res.json(await servicio.actualizar(req.params.id, req.body));
}

export async function cambiarEstadoClinica(req, res) {
  res.json(await servicio.cambiarEstado(req.params.id, req.body.activa));
}

export async function asignarAdministrador(req, res) {
  res.status(201).json(await servicio.asignarAdministrador(req.usuarioId, req.params.id, req.body));
}