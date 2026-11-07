//

import { Router } from "express";
import { autenticar } from "../middlewares/autenticar.js";
import { requierePermiso } from "../middlewares/permisos.js";
import * as mascotasController from "../controllers/mascotas.controller.js";
import { recibirFoto } from "../middlewares/subida.js";
import * as expedienteController from "../controllers/expediente.controller.js"

const router = Router();

router.use(autenticar);

router.get("/", requierePermiso("MASCOTAS_VER"), mascotasController.listar);
router.post("/", requierePermiso("MASCOTAS_REGISTRAR"), mascotasController.registrar);
router.post("/:id/foto", requierePermiso("MASCOTAS_EDITAR_FOTO"), recibirFoto, mascotasController.subirFoto);
router.delete("/:id/foto", requierePermiso("MASCOTAS_EDITAR_FOTO"), mascotasController.quitarFoto);
router.get("/:id", requierePermiso("MASCOTAS_VER"), mascotasController.obtener);

// cartilla, expediente y examenes 
router.get("/:id/cartilla", requierePermiso("MASCOTAS_VER"), expedienteController.cartilla);
router.get("/:id/consultas", requierePermiso("EXPEDIENTE_VER"), expedienteController.consultas);
router.get("/:id/examenes", requierePermiso("EXPEDIENTE_VER"), expedienteController.examenes);

export default router;