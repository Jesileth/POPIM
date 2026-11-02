//

import { Router } from "express";
import { autenticar } from "../middlewares/autenticar.js";
import { requierePermiso } from "../middlewares/permisos.js";
import * as mascotasController from "../controllers/mascotas.controller.js";
import { recibirFoto } from "../middlewares/subida.js";

const router = Router();

router.use(autenticar);

router.get("/", requierePermiso("MASCOTAS_VER"), mascotasController.listar);
router.post("/", requierePermiso("MASCOTAS_REGISTRAR"), mascotasController.registrar);
router.post("/:id/foto", requierePermiso("MASCOTAS_EDITAR_FOTO"), recibirFoto, mascotasController.subirFoto);
router.delete("/:id/foto", requierePermiso("MASCOTAS_EDITAR_FOTO"), mascotasController.quitarFoto);

export default router;