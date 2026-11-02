
//

import { ErrorHttp } from "../utils/errores.js";
import * as catalogosService from "../services/catalogos.service.js";

export async function especies(req, res) {
  res.json(await catalogosService.obtenerEspecies());
}

export async function razas(req, res) {
  const especieId = Number(req.params.id);
  if (!Number.isInteger(especieId) || especieId < 1) {
    throw new ErrorHttp(400, "Especie no válida");
  }
  res.json(await catalogosService.obtenerRazas(especieId));
}