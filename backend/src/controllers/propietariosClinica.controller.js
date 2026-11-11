

// Controladores de Propietarios y Mascotas en la clínica (el body ya viene limpio por Zod)

import * as servicio from "../services/propietariosClinica.service.js";

export async function listar(req, res) {
  res.json(await servicio.listar());
}

export async function obtener(req, res) {
  res.json(await servicio.obtener(req.params.id));
}

export async function registrar(req, res) {
  res.status(201).json(await servicio.registrar(req.usuarioId, req.body));
}

export async function actualizar(req, res) {
  res.json(await servicio.actualizar(req.params.id, req.body));
}

export async function reenviarCodigo(req, res) {
  res.json(await servicio.reenviarCodigo(req.params.id));
}

export async function listarMascotas(req, res) {
  res.json(await servicio.listarMascotas());
}

export async function obtenerMascota(req, res) {
  res.json(await servicio.obtenerMascota(req.params.id, req.personal.clinicaId));
}

export async function registrarMascota(req, res) {
  res.status(201).json(await servicio.registrarMascota(req.usuarioId, req.params.id, req.body));
}