

// Controladores del portal de la clínica: leen la petición y llaman al servicio.
// req.personal = { id, clinicaId, rol } lo pone el middleware cargarPersonal.

import { ErrorHttp } from "../utils/errores.js";
import { esFechaValida } from "../utils/fechas.js";
import * as clinicaService from "../services/clinica.service.js";

const texto = (v) => (typeof v === "string" ? v.trim() : "");

function fechaDeQuery(req) {
  const fecha = texto(req.query.fecha);
  if (!esFechaValida(fecha)) throw new ErrorHttp(400, "Elige una fecha válida", "fecha");
  return fecha;
}

// GET /clinica/agenda?fecha=AAAA-MM-DD
export async function agenda(req, res) {
  res.json(await clinicaService.agenda(req.personal.clinicaId, fechaDeQuery(req)));
}

// GET /clinica/veterinarios
export async function veterinarios(req, res) {
  res.json(await clinicaService.veterinarios(req.personal.clinicaId));
}

// GET /clinica/veterinarios/disponibles-ahora
export async function disponiblesAhora(req, res) {
  res.json(await clinicaService.disponiblesAhora(req.personal.clinicaId));
}

// GET /clinica/veterinarios/:id/disponibilidad?fecha=
export async function disponibilidad(req, res) {
  res.json(await clinicaService.disponibilidad(req.personal.clinicaId, req.params.id, fechaDeQuery(req)));
}

// GET /clinica/propietarios/buscar?q=
export async function buscarPropietarios(req, res) {
  const q = texto(req.query.q);
  if (q.length < 2) throw new ErrorHttp(400, "Escribe al menos 2 letras o números para buscar", "q");
  res.json(await clinicaService.buscarPropietarios(q.slice(0, 100)));
}

// GET /clinica/propietarios/:id/mascotas
export async function mascotasDePropietario(req, res) {
  res.json(await clinicaService.mascotasDePropietario(req.params.id));
}

// POST /clinica/citas  (el body ya viene limpio por validar(esquemaCitaClinica))
export async function agendarCita(req, res) {
  res.status(201).json(await clinicaService.agendarCita(req.personal, req.usuarioId, req.body));
}

// POST /clinica/citas/emergencia
export async function registrarEmergencia(req, res) {
  res.status(201).json(await clinicaService.registrarEmergencia(req.personal, req.usuarioId, req.body));
}