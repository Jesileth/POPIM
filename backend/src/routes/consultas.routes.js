
import { Router } from "express";
import { autenticar } from "../middlewares/autenticar.js";
import { requierePermiso } from "../middlewares/permisos.js";
import * as expedienteController from "../controllers/expediente.controller.js";

const router = Router();

router.use(autenticar);

// Detalle de una consulta finalizada, solo para el dueño de la mascota
router.get("/:id", requierePermiso("EXPEDIENTE_VER"), expedienteController.consulta);

export default router;