
//

import { ErrorHttp } from "../utils/errores.js";
import * as catalogosRepo from "../repositories/catalogos.repository.js";

export async function obtenerEspecies() {
  return { especies: await catalogosRepo.listarEspecies() };
}

export async function obtenerRazas(especieId) {
  if (!(await catalogosRepo.existeEspecie(especieId))) {
    throw new ErrorHttp(404, "La especie no existe");
  }
  return { razas: await catalogosRepo.listarRazasDeEspecie(especieId) };
}