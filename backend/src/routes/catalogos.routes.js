//

import { Router } from "express";
import { autenticar } from "../middlewares/autenticar.js";
import * as catalogosController from "../controllers/catalogos.controller.js";

const router = Router();

router.use(autenticar); // todas las rutas de este archivo exigen sesión iniciada

router.get("/especies", catalogosController.especies);
router.get("/especies/:id/razas", catalogosController.razas);

export default router;