//

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