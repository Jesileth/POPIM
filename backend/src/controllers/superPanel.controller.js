
// Controlador del Panel general del Super Administrador

import * as servicio from "../services/superPanel.service.js";

// GET /super/panel
export async function obtenerPanel(req, res) {
  res.json(await servicio.obtener());
}