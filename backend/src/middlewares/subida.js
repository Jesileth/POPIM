//

import multer from "multer";
import { ErrorHttp } from "../utils/errores.js";

const MAX_MB = 5;

const recibir = multer({
  storage: multer.memoryStorage(), // el archivo llega a memoria; luego lo validamos y guardamos nosotros
  limits: { fileSize: MAX_MB * 1024 * 1024, files: 1 },
}).single("foto"); // "foto" es el nombre del campo, el mismo que usa tu subirArchivo

export function recibirFoto(req, res, next) {
  recibir(req, res, (error) => {
    if (!error) return next();
    if (error.code === "LIMIT_FILE_SIZE")
      return next(new ErrorHttp(413, `La imagen no puede pesar más de ${MAX_MB} MB`, "foto"));
    next(new ErrorHttp(400, "No pudimos leer la imagen", "foto"));
  });
}


// Resultados de exámenes: PDF, JPG o PNG en el campo "archivo"
const recibirArchivo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MB * 1024 * 1024, files: 1 },
}).single("archivo");

export function recibirExamen(req, res, next) {
  recibirArchivo(req, res, (error) => {
    if (!error) return next();
    if (error.code === "LIMIT_FILE_SIZE")
      return next(new ErrorHttp(413, `El archivo no puede pesar más de ${MAX_MB} MB`, "archivo"));
    next(new ErrorHttp(400, "No pudimos leer el archivo", "archivo"));
  });
}