//
//#region 
/*
import { ErrorHttp } from "../utils/errores.js";
import * as usuariosRepo from "../repositories/usuarios.repository.js";

export function requierePermiso(codigo) {
  return async (req, res, next) => {
    const permisos = await usuariosRepo.obtenerPermisos(req.usuarioId);
    if (!permisos.includes(codigo)) {
      throw new ErrorHttp(403, "No tienes permiso para esta acción");
    }
    next();
  };
}

*/
//#endregion

import { ErrorHttp } from "../utils/errores.js";
import * as usuariosRepo from "../repositories/usuarios.repository.js";

const cache = new Map();
const VIGENCIA_MS = 60 * 1000;

async function permisosDe(usuarioId) {
  const guardado = cache.get(usuarioId);
  if (guardado && guardado.expira > Date.now()) return guardado.permisos;

  const permisos = await usuariosRepo.obtenerPermisos(usuarioId);
  cache.set(usuarioId, { permisos, expira: Date.now() + VIGENCIA_MS });
  return permisos;
}

export function requierePermiso(codigo) {
  return async (req, res, next) => {
    const permisos = await permisosDe(req.usuarioId);
    if (!permisos.includes(codigo)) {
      throw new ErrorHttp(403, "No tienes permiso para esta acción");
    }
    next();
  };
}