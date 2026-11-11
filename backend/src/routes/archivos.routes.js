
// archivo que muestra la ruta de las fotos
import path from "node:path";
import { Router } from "express";
import { autenticar } from "../middlewares/autenticar.js";
import { RAIZ_UPLOADS, esNombreValido } from "../config/archivos.js";
import { ErrorHttp } from "../utils/errores.js";

const router = Router();

router.use(autenticar); // solo quien inició sesión ve las fotos

//#region guardado de mascotas
/*
router.get("/mascotas/:nombre", (req, res) => {
  if (!esNombreValido(req.params.nombre)) throw new ErrorHttp(404, "Archivo no encontrado");

  res.set("X-Content-Type-Options", "nosniff");
  res.set("Cache-Control", "private, max-age=3600");
  res.sendFile(
    req.params.nombre,
    { root: path.join(RAIZ_UPLOADS, "mascotas"), cacheControl: false },
    (error) => {
      if (error && !res.headersSent) res.status(404).json({ mensaje: "Archivo no encontrado" });
    }
  );
});

*/
//#endregion

const CARPETAS = ["mascotas", "perfiles"];

router.get("/:carpeta/:nombre", (req, res) => {
  const { carpeta, nombre } = req.params;
  if (!CARPETAS.includes(carpeta) || !esNombreValido(nombre))
    throw new ErrorHttp(404, "Archivo no encontrado");

  res.set("X-Content-Type-Options", "nosniff");
  res.set("Cache-Control", "private, max-age=3600");
  res.sendFile(
    nombre,
    { root: path.join(RAIZ_UPLOADS, carpeta), cacheControl: false },
    (error) => {
      if (error && !res.headersSent) res.status(404).json({ mensaje: "Archivo no encontrado" });
    }
  );
});

export default router;