import { ErrorHttp } from "../utils/errores.js";

export function validar(esquema) {
  return (req, _res, next) => {
    const resultado = esquema.safeParse(req.body ?? {});
    if (!resultado.success) {
      const problema = resultado.error.issues[0];
      throw new ErrorHttp(400, problema.message, problema.path[0]);
    }
    req.body = resultado.data; // ya limpio: sin espacios, correo en minúsculas
    next();
  };
}

// safeParse revisa los datos contra un “molde”.
//  Si algo no cuadra, tira el mismo ErrorHttp de siempre. Si todo va bien, reemplaza req.body por la versión ya limpia.