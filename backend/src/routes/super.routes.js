
//

// Rutas del Super Administrador: TODAS empiezan con /api/super.
// No usan cargarPersonal: el Super Administrador no pertenece a una clínica.
// Lo que lo protege son sus permisos (solo el rol SUPER_ADMIN los tiene).

import { Router } from "express";
import { autenticar } from "../middlewares/autenticar.js";
import { requierePermiso } from "../middlewares/permisos.js";
import { validar } from "../middlewares/validar.js";
import { ErrorHttp } from "../utils/errores.js";
import {
  esquemaRegistrarClinica, esquemaEditarClinica, esquemaEstadoClinica, esquemaAsignarAdministrador,
} from "../schemas/super.schemas.js";
import * as clinicas from "../controllers/superClinicas.controller.js";

const router = Router();

// Solo con una sesión del portal de la clínica
function soloPortalClinica(req, res, next) {
  if (req.portal !== "CLINICA") throw new ErrorHttp(403, "Esta opción es del portal de la clínica");
  next();
}

router.use(autenticar, soloPortalClinica);

// ---------- Clínicas (REQ-020) ----------
router.get("/clinicas", requierePermiso("CLINICAS_VER"), clinicas.listarClinicas);
router.post("/clinicas", requierePermiso("CLINICAS_REGISTRAR"), validar(esquemaRegistrarClinica), clinicas.registrarClinica);
router.get("/clinicas/:id", requierePermiso("CLINICAS_VER"), clinicas.obtenerClinica);
router.put("/clinicas/:id", requierePermiso("CLINICAS_EDITAR"), validar(esquemaEditarClinica), clinicas.actualizarClinica);
router.patch("/clinicas/:id/estado", requierePermiso("CLINICAS_CAMBIAR_ESTADO"), validar(esquemaEstadoClinica), clinicas.cambiarEstadoClinica);
router.post("/clinicas/:id/administrador", requierePermiso("CLINICAS_EDITAR"), validar(esquemaAsignarAdministrador), clinicas.asignarAdministrador);

export default router;