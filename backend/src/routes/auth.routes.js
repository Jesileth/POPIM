

import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { autenticar } from "../middlewares/autenticar.js";


const router = Router();

router.post("/registro", authController.registro);
router.post("/login", authController.login);
router.get("/sesion", autenticar, authController.sesion);
router.post("/logout", authController.logout);

export default router;