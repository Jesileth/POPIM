
// Un middleware es una función que se ejecuta “en el camino” de la petición. Este atrapa todos los errores en un solo lugar

import { ErrorHttp } from "../utils/errores.js";

export function noEncontrado(req, res, next) {
  next(new ErrorHttp(404, "Ruta no encontrada"));
}

export function manejarErrores(error, req, res, next) {
  if (error instanceof ErrorHttp) {
    return res.status(error.estado).json({ mensaje: error.message, campo: error.campo });
  }
  console.error("Error inesperado:", error);
  res.status(500).json({ mensaje: "Error interno del servidor" });
}