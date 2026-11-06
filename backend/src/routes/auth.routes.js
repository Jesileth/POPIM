

import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { autenticar } from "../middlewares/autenticar.js";
import { validar } from "../middlewares/validar.js";
import {
  esquemaSolicitarRecuperacion,
  esquemaVerificarRecuperacion,
  esquemaRestablecerContrasena,
} from "../schemas/auth.schemas.js";

const router = Router();

router.post("/registro", authController.registro);
router.post("/login", authController.login);
router.get("/sesion", autenticar, authController.sesion);
router.post("/logout", authController.logout);

router.post("/recuperacion/solicitar", validar(esquemaSolicitarRecuperacion), authController.solicitarRecuperacion);
router.post("/recuperacion/verificar", validar(esquemaVerificarRecuperacion), authController.verificarRecuperacion);
router.post("/recuperacion/restablecer", validar(esquemaRestablecerContrasena), authController.restablecerContrasena);

export default router;