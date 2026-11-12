
//

// Controladores de Reportes globales del Super Administrador

import * as servicio from "../services/superReportes.service.js";
import { dibujarReporteGlobal } from "../services/reporteGlobalPdf.js";

// GET /super/reportes?desde=2026-11-01&hasta=2026-11-30&clinicaId=...
export async function obtenerReporte(req, res) {
  res.json(await servicio.generar(req.query));
}

// GET /super/reportes.pdf?... (mismos filtros)
// Primero se arman (y revisan) los datos; solo si todo está bien se empieza a mandar el PDF
export async function reportePdf(req, res) {
  const reporte = await servicio.generar(req.query);
  res.type("application/pdf");
  res.attachment(`reporte-popim-${reporte.periodo.desde}-al-${reporte.periodo.hasta}.pdf`);
  dibujarReporteGlobal(reporte, res);
}