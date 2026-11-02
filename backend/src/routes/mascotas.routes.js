//

import { Router } from "express";
import { autenticar } from "../middlewares/autenticar.js";
import { requierePermiso } from "../middlewares/permisos.js";
import * as mascotasController from "../controllers/mascotas.controller.js";

const router = Router();

router.use(autenticar);

router.get("/", requierePermiso("MASCOTAS_VER"), mascotasController.listar);
router.post("/", requierePermiso("MASCOTAS_REGISTRAR"), mascotasController.registrar);

export default router;