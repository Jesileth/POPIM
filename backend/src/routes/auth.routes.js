

import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

router.post("/registro", authController.registro);

export default router;