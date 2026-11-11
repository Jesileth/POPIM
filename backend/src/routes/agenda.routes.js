
//

import { Router } from "express";
import { autenticar } from "../middlewares/autenticar.js";
import { requierePermiso } from "../middlewares/permisos.js";
import * as agendaController from "../controllers/agenda.controller.js";

const router = Router();
const protegida = [autenticar, requierePermiso("CITAS_SOLICITAR")];

router.get("/clinicas", protegida, agendaController.clinicas);
router.get("/clinicas/:id/veterinarios", protegida, agendaController.veterinarios);
router.get("/veterinarios/:id/disponibilidad", protegida, agendaController.disponibilidad);

export default router;