
//
// Rutas del Administrador de una clínica: TODAS empiezan con /api/admin.
// Pasan por autenticar + cargarPersonal: así cada consulta usa la clínica
// de la sesión (req.personal.clinicaId) y nunca una que mande el navegador.

import { Router } from "express";
import { autenticar } from "../middlewares/autenticar.js";
import { cargarPersonal } from "../middlewares/personal.js";
import { requierePermiso } from "../middlewares/permisos.js";
import { validar } from "../middlewares/validar.js";
import { esquemaVincularPersonal, esquemaDatosProfesionales, esquemaVinculo } from "../schemas/admin.schemas.js";
import * as personal from "../controllers/adminPersonal.controller.js";

const router = Router();

router.use(autenticar, cargarPersonal);

// ---------- Personal ----------
// !! El orden: "/personal/buscar" va antes que las rutas con ":id"
router.get("/especialidades", requierePermiso("PERSONAL_VER"), personal.especialidades);
router.get("/personal", requierePermiso("PERSONAL_VER"), personal.listarPersonal);
router.get("/personal/buscar", requierePermiso("PERSONAL_VINCULAR"), personal.buscarPorCorreo);
router.post("/personal", requierePermiso("PERSONAL_VINCULAR"), validar(esquemaVincularPersonal), personal.vincularPersonal);
router.put("/personal/:id/profesional", requierePermiso("PERSONAL_EDITAR"), validar(esquemaDatosProfesionales), personal.actualizarProfesional);
router.post("/personal/:id/desbloquear", requierePermiso("CUENTAS_DESBLOQUEAR"), personal.desbloquear);
router.patch("/personal/:id/vinculo", requierePermiso("PERSONAL_DESACTIVAR"), validar(esquemaVinculo), personal.cambiarVinculo);

export default router;