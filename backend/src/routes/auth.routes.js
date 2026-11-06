

import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { autenticar } from "../middlewares/autenticar.js";
import { validar } from "../middlewares/validar.js";
import { esquemaSolicitarRecuperacion } from "../schemas/auth.schemas.js";


const router = Router();

router.post("/registro", authController.registro);
router.post("/login", authController.login);
router.get("/sesion", autenticar, authController.sesion);
router.post("/logout", authController.logout);
router.post("/recuperacion/solicitar", validar(esquemaSolicitarRecuperacion), authController.solicitarRecuperacion);

export default router;