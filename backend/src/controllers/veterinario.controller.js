

// Controladores del rol VETERINARIO (req.personal viene de cargarPersonal)

import * as servicio from "../services/veterinario.service.js";
import { CARPETA_EXAMENES } from "../config/archivos.js";
import { dibujarReceta } from "../services/recetaPdf.js";

export async function miAgenda(req, res) {
  res.json(await servicio.miAgenda(req.personal, req.query.desde, req.query.hasta));
}

export async function atencionHoy(req, res) {
  res.json(await servicio.atencionHoy(req.personal));
}

export async function iniciarConsulta(req, res) {
  res.status(201).json(await servicio.iniciarConsulta(req.personal, req.usuarioId, req.body.citaId));
}

export async function misConsultas(req, res) {
  res.json(await servicio.misConsultas(req.personal));
}

export async function obtenerConsulta(req, res) {
  res.json(await servicio.obtenerConsulta(req.personal, req.params.id));
}

export async function misPacientes(req, res) {
  res.json(await servicio.misPacientes(req.personal));
}

export async function expediente(req, res) {
  res.json(await servicio.expediente(req.personal, req.usuarioId, req.params.mascotaId, req.ip));
}

export async function catalogos(req, res) {
  res.json(await servicio.catalogosConsulta());
}


export async function guardarConsulta(req, res) {
  res.json(await servicio.guardarConsulta(req.personal, req.usuarioId, req.params.id, req.body, req.ip));
}

export async function finalizarConsulta(req, res) {
  res.json(await servicio.finalizarConsulta(req.personal, req.usuarioId, req.params.id, req.ip));
}


export async function citaDesdeConsulta(req, res) {
  res.status(201).json(await servicio.citaDesdeConsulta(req.personal, req.usuarioId, req.params.id, req.body));
}

export async function programarDosis(req, res) {
  res.json(await servicio.programarDosis(req.personal, req.params.id, req.body));
}

export async function aplicarDosis(req, res) {
  res.json(await servicio.aplicarDosis(req.personal, req.usuarioId, req.params.id, req.body, req.ip));
}

export async function subirExamen(req, res) {
  res.status(201).json(
    await servicio.subirExamen(req.personal, req.usuarioId, req.params.id, req.query.tipoExamenId, req.file, req.ip)
  );
}

// El archivo se manda con su tipo real; "attachment" hace que el navegador lo descargue
export async function archivoExamen(req, res) {
  const a = await servicio.archivoExamen(req.usuarioId, req.params.id, req.ip);
  res.set("X-Content-Type-Options", "nosniff");
  res.type(a.mimeType);
  res.attachment(a.nombreOriginal);
  res.sendFile(a.nombre, { root: CARPETA_EXAMENES }, (error) => {
    if (error && !res.headersSent) res.status(404).json({ mensaje: "No encontramos el archivo" });
  });
}

// Primero se arman (y revisan) los datos; solo si todo está bien se empieza a mandar el PDF
export async function recetaPdf(req, res) {
  const receta = await servicio.datosReceta(req.personal, req.params.id);
  res.type("application/pdf");
  res.attachment(`receta-${receta.mascota.nombre}.pdf`);
  dibujarReceta(receta, res);
}