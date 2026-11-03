
//

import {Router} from "express";
import {autenticar} from "../middlewares/autenticar.js"
import {requierePermiso} from "../middlewares/permisos.js"
import {recibirFoto} from "../middlewares/subida.js"
import * as perfilController from "../controllers/perfil.controller.js"

const router = Router();

router.use(autenticar);

router.get("/", requierePermiso("PERFIL_VER"), perfilController.obtener);
router.put("/", requierePermiso("PERFIL_EDITAR"), perfilController.guardar);
router.get("/foto", requierePermiso("PERFIL_EDITAR"), recibirFoto, perfilController.subirFoto);
router.post("/foto", requierePermiso("PERFIL_EDITAR"), recibirFoto, perfilController.subirFoto);
router.delete("/foto", requierePermiso("PERFIL_EDITAR"), perfilController.quitarFoto);
router.post("/password", requierePermiso ("PERFIL_EDITAR"), perfilController.cambiarPassword);

export default router;
