
//

import { Router } from "express";
import { autenticar } from "../middlewares/autenticar.js";
import { requierePermiso } from "../middlewares/permisos.js";
import * as citasController from "../controllers/citas.controller.js";

const router = Router();

router.use(autenticar);

router.get("/", requierePermiso("CITAS_VER"), citasController.listar);
router.post("/", requierePermiso("CITAS_SOLICITAR"), citasController.solicitar);
router.post("/:id/cancelar", requierePermiso("CITAS_CANCELAR"), citasController.cancelar);

export default router;