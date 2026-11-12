//

// Dibuja el reporte de rendimiento de la red en PDF con pdfkit (igual que recetaPdf.js).
// Recibe lo mismo que devuelve superReportes.service.generar() y lo manda directo a la respuesta.

import PDFDocument from "pdfkit";

const AZUL = "#1f3a5f";
const GRIS = "#5b6b7f";
const LINEA = "#d9e1ea";
const FONDO = "#f1f5fa";
const MARGEN = 50;

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const nombreMes = (aaaaMm) => `${MESES[Number(aaaaMm.slice(5, 7)) - 1]} ${aaaaMm.slice(0, 4)}`;
const fechaCorta = (f) => `${f.slice(8, 10)}/${f.slice(5, 7)}/${f.slice(0, 4)}`;
const pct = (v) => (v === null ? "—" : `${v} %`);

export function dibujarReporteGlobal(r, salida) {
  const doc = new PDFDocument({ size: "LETTER", margin: MARGEN, info: { Title: "Reporte de rendimiento - POPIM" } });
  doc.pipe(salida);
  const ancho = doc.page.width - MARGEN * 2;

  // ---------- Encabezado ----------
  doc.fillColor(AZUL).font("Helvetica-Bold").fontSize(20).text("POPIM");
  doc.fillColor(GRIS).font("Helvetica").fontSize(10).text("Red de clínicas veterinarias");
  doc.moveDown(0.6);
  doc.fillColor(AZUL).font("Helvetica-Bold").fontSize(14).text("Reporte de rendimiento de la red");
  doc.fillColor(GRIS).font("Helvetica").fontSize(10)
    .text(`Período: ${fechaCorta(r.periodo.desde)} al ${fechaCorta(r.periodo.hasta)}`)
    .text(`Clínicas: ${r.clinica ? r.clinica.nombre : "todas las clínicas de la red"}`)
    .text(`Generado: ${r.generadoEn}`);
  separador(doc);

  // ---------- Resumen ----------
  titulo(doc, "Resumen");
  const cifras = [
    ["Citas totales", r.resumen.citas],
    ["Atendidas", r.resumen.atendidas],
    ["Canceladas", r.resumen.canceladas],
    ["No asistió", r.resumen.noAsistio],
    ["Asistencia", pct(r.resumen.asistencia)],
    ["Propietarios nuevos", r.resumen.propietariosNuevos],
  ];
  const anchoCaja = (ancho - 5 * 8) / 6;
  const yCajas = doc.y;
  cifras.forEach(([etiqueta, valor], i) => {
    const x = MARGEN + i * (anchoCaja + 8);
    doc.roundedRect(x, yCajas, anchoCaja, 46, 6).fill(FONDO);
    doc.fillColor(AZUL).font("Helvetica-Bold").fontSize(15).text(String(valor), x, yCajas + 8, { width: anchoCaja, align: "center" });
    doc.fillColor(GRIS).font("Helvetica").fontSize(8).text(etiqueta, x, yCajas + 29, { width: anchoCaja, align: "center" });
  });
  doc.x = MARGEN;
  doc.y = yCajas + 60;

  // ---------- Citas por clínica ----------
  titulo(doc, "Total de citas por clínica");
  tabla(doc, {
    columnas: [
      { titulo: "Clínica", ancho: 0.31 },
      { titulo: "Total", ancho: 0.08, alinear: "right" },
      { titulo: "Atendidas", ancho: 0.11, alinear: "right" },
      { titulo: "Canceladas", ancho: 0.13, alinear: "right" },
      { titulo: "No asistió", ancho: 0.12, alinear: "right" },
      { titulo: "Pendientes", ancho: 0.12, alinear: "right" },
      { titulo: "Asistencia", ancho: 0.13, alinear: "right" },
    ],
    filas: r.porClinica.map((c) => [
      c.activa ? c.nombre : `${c.nombre} (inactiva)`,
      c.total, c.atendidas, c.canceladas, c.noAsistio, c.pendientes, pct(c.asistencia),
    ]),
    vacio: "No hay clínicas en el período.",
  });

  // ---------- Propietarios nuevos ----------
  titulo(doc, "Propietarios nuevos registrados (últimos 6 meses)");
  tabla(doc, {
    columnas: [
      { titulo: "Mes", ancho: 0.4 },
      { titulo: "Nuevos", ancho: 0.2, alinear: "right" },
      { titulo: "Por su cuenta", ancho: 0.2, alinear: "right" },
      { titulo: "Por recepción", ancho: 0.2, alinear: "right" },
    ],
    filas: r.propietariosPorMes.map((m) => [nombreMes(m.mes), m.total, m.porSuCuenta, m.porRecepcion]),
  });
  doc.fillColor(GRIS).font("Helvetica").fontSize(8)
    .text("Los propietarios son de toda la red: no pertenecen a una clínica.", MARGEN, doc.y, { width: ancho });
  doc.moveDown(0.8);

  // ---------- Frecuencia de servicios ----------
  titulo(doc, "Frecuencia de servicios");
  tabla(doc, {
    columnas: [
      { titulo: "Servicio", ancho: 0.6 },
      { titulo: "Veces", ancho: 0.2, alinear: "right" },
      { titulo: "Del total", ancho: 0.2, alinear: "right" },
    ],
    filas: r.servicios.map((s) => [s.nombre, s.total, pct(s.porcentaje)]),
  });

  doc.end();
}

function titulo(doc, texto) {
  saltoSiHaceFalta(doc, 60);
  doc.fillColor(AZUL).font("Helvetica-Bold").fontSize(12).text(texto, MARGEN, doc.y);
  doc.moveDown(0.4);
}

function separador(doc) {
  doc.moveDown(0.6);
  doc.moveTo(MARGEN, doc.y).lineTo(doc.page.width - MARGEN, doc.y).strokeColor(LINEA).stroke();
  doc.moveDown(0.8);
}

// Si no cabe lo que sigue, pasa a una página nueva
function saltoSiHaceFalta(doc, alto) {
  if (doc.y + alto > doc.page.height - MARGEN) doc.addPage();
}

// Tabla sencilla: cada columna tiene un ancho en fracción (0.34 = 34 % del ancho útil)
function tabla(doc, { columnas, filas, vacio = "Sin datos." }) {
  const ancho = doc.page.width - MARGEN * 2;
  const ALTO = 20;

  const dibujarFila = (valores, { negrita = false, fondo = null } = {}) => {
    saltoSiHaceFalta(doc, ALTO);
    const y = doc.y;
    if (fondo) doc.rect(MARGEN, y, ancho, ALTO).fill(fondo);
    let x = MARGEN;
    columnas.forEach((col, i) => {
      const w = col.ancho * ancho;
      doc.fillColor(negrita ? AZUL : "black").font(negrita ? "Helvetica-Bold" : "Helvetica").fontSize(9)
        .text(String(valores[i] ?? ""), x + 6, y + 6,
        // height + ellipsis: si el texto no cabe en una línea, se corta con "…" en vez de encimarse
        { width: w - 12, height: 11, align: col.alinear ?? "left", ellipsis: true });
      x += w;
    });
    doc.moveTo(MARGEN, y + ALTO).lineTo(MARGEN + ancho, y + ALTO).strokeColor(LINEA).stroke();
    doc.x = MARGEN;
    doc.y = y + ALTO;
  };

  dibujarFila(columnas.map((c) => c.titulo), { negrita: true, fondo: FONDO });
  if (filas.length === 0) {
    doc.fillColor(GRIS).font("Helvetica").fontSize(9).text(vacio, MARGEN + 6, doc.y + 6);
  }
  filas.forEach((f) => dibujarFila(f));
  doc.moveDown(1);
}