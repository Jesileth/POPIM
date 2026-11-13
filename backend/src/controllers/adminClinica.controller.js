
// Controladores de "Mi clínica" del Administrador

import * as servicio from "../services/adminClinica.service.js";

// GET /admin/clinica
export async function obtener(req, res) {
  res.json(await servicio.obtener(req.personal));
}

// PUT /admin/clinica  { telefono, correo, duracionCitaMin }
export async function actualizar(req, res) {
  res.json(await servicio.actualizar(req.body, req.personal));
}

// POST /admin/clinica/logo  (multipart, campo "foto")
export async function subirLogo(req, res) {
  res.json(await servicio.subirLogo(req.file, req.personal));
}

// DELETE /admin/clinica/logo
export async function quitarLogo(req, res) {
  res.json(await servicio.quitarLogo(req.personal));
}