
// Controlador del Inicio del Administrador

import * as servicio from "../services/adminInicio.service.js";

// GET /admin/inicio
export async function resumen(req, res) {
  res.json(await servicio.resumen(req.personal));
}