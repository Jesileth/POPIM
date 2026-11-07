
// Rutas del portal de la clínica: TODAS empiezan con /api/clinica
// y TODAS pasan primero por autenticar + cargarPersonal.

import { Router } from "express";
import { autenticar } from "../middlewares/autenticar.js";
import { cargarPersonal } from "../middlewares/personal.js";
import { requierePermiso } from "../middlewares/permisos.js";
import { validar } from "../middlewares/validar.js";
import {
  esquemaCitaClinica, esquemaEmergencia, esquemaCancelarCita, esquemaReprogramar,
} from "../schemas/clinica.schemas.js";
import * as clinica from "../controllers/clinica.controller.js";
import * as citasClinica from "../controllers/citasClinica.controller.js";

const router = Router();

router.use(autenticar, cargarPersonal);

// Agenda y veterinarios
router.get("/agenda", requierePermiso("AGENDA_VER_TODOS"), clinica.agenda);
router.get("/veterinarios", requierePermiso("AGENDA_VER"), clinica.veterinarios);
router.get("/veterinarios/disponibles-ahora", requierePermiso("CITAS_EMERGENCIA_REGISTRAR"), clinica.disponiblesAhora);
router.get("/veterinarios/:id/disponibilidad", requierePermiso("AGENDA_VER"), clinica.disponibilidad);

// Propietarios (para elegir a quién se le agenda)
router.get("/propietarios/buscar", requierePermiso("PROPIETARIOS_VER"), clinica.buscarPropietarios);
router.get("/propietarios/:id/mascotas", requierePermiso("PROPIETARIOS_VER"), clinica.mascotasDePropietario);

// Crear citas
router.post("/citas", requierePermiso("CITAS_AGENDAR"), validar(esquemaCitaClinica), clinica.agendarCita);
router.post("/citas/emergencia", requierePermiso("CITAS_EMERGENCIA_REGISTRAR"), validar(esquemaEmergencia), clinica.registrarEmergencia);


// Citas en recepción. OJO con el orden: las rutas fijas (/solicitadas, /reprogramables)
// van ANTES de /citas/:id, si no Express creería que "solicitadas" es un id.
router.get("/citas", requierePermiso("RECEPCION_VER"), citasClinica.delDia);
router.get("/citas/solicitadas", requierePermiso("CITAS_CONFIRMAR"), citasClinica.solicitadas);
router.get("/citas/reprogramables", requierePermiso("CITAS_REPROGRAMAR"), citasClinica.reprogramables);
router.get("/citas/:id", requierePermiso("RECEPCION_VER"), citasClinica.detalle);
router.post("/citas/:id/confirmar", requierePermiso("CITAS_CONFIRMAR"), citasClinica.confirmar);
router.post("/citas/:id/cancelar", requierePermiso("CITAS_CANCELAR_CLINICA"), validar(esquemaCancelarCita), citasClinica.cancelar);
router.post("/citas/:id/reprogramar", requierePermiso("CITAS_REPROGRAMAR"), validar(esquemaReprogramar), citasClinica.reprogramar);

export default router;