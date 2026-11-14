//

import * as expedienteService from "../services/expediente.service.js";

export async function cartilla(req, res) {
  res.json(await expedienteService.cartilla(req.usuarioId, req.params.id));
}

export async function consultas(req, res) {
  res.json(await expedienteService.consultas(req.usuarioId, req.params.id));
}

export async function examenes(req, res) {
  res.json(await expedienteService.examenes(req.usuarioId, req.params.id));
}

export async function consulta(req, res) {
  res.json(await expedienteService.consulta(req.usuarioId, req.params.id));
}