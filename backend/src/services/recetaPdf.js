

// Dibuja la receta digital en PDF con pdfkit y la manda directo a la respuesta (sin guardar archivo)

import PDFDocument from "pdfkit";

const AZUL = "#1f3a5f";
const GRIS = "#5b6b7f";
const LINEA = "#d9e1ea";

// r = { clinica:{nombre,direccion,telefono}, veterinario:{nombre,licencia}, fecha,
//       mascota:{nombre,codigo,especie,raza,sexo,edad,pesoKg}, propietario,
//       diagnostico, items:[{medicamento,dosis,frecuencia,duracionDias}], indicaciones }
export function dibujarReceta(r, salida) {
  const doc = new PDFDocument({ size: "LETTER", margin: 50, info: { Title: `Receta - ${r.mascota.nombre}` } });
  doc.pipe(salida);
  const ancho = doc.page.width - 100;

  // Encabezado: clínica
  doc.fillColor(AZUL).font("Helvetica-Bold").fontSize(20).text(r.clinica.nombre);
  doc.fillColor(GRIS).font("Helvetica").fontSize(10).text(r.clinica.direccion ?? "");
  if (r.clinica.telefono) doc.text(`Tel. ${r.clinica.telefono}`);
  doc.moveDown(0.5);
  doc.fillColor(AZUL).font("Helvetica-Bold").fontSize(13).text("RECETA MÉDICA VETERINARIA", { align: "right" });
  doc.fillColor(GRIS).font("Helvetica").fontSize(10).text(`Fecha: ${r.fecha}`, { align: "right" });
  linea(doc);

  // Paciente y propietario
  const fila = (etiqueta, valor) => {
    doc.font("Helvetica-Bold").fillColor(AZUL).text(`${etiqueta}: `, { continued: true });
    doc.font("Helvetica").fillColor("black").text(valor || "—");
  };
  doc.fontSize(11);
  fila("Paciente", `${r.mascota.nombre} (${r.mascota.codigo})`);
  fila("Especie y raza", `${r.mascota.especie} - ${r.mascota.raza}`);
  fila("Sexo y edad", `${r.mascota.sexo} - ${r.mascota.edad}`);
  if (r.mascota.pesoKg) fila("Peso", `${r.mascota.pesoKg} kg`);
  fila("Propietario", r.propietario);
  if (r.diagnostico) fila("Diagnóstico", r.diagnostico);
  linea(doc);

  // Medicamentos
  doc.fillColor(AZUL).font("Helvetica-Bold").fontSize(12).text("Rp/");
  doc.moveDown(0.3);
  r.items.forEach((it, i) => {
    doc.fillColor("black").font("Helvetica-Bold").fontSize(11).text(`${i + 1}. ${it.medicamento}`);
    doc.font("Helvetica").fillColor(GRIS).fontSize(10)
      .text(`${it.dosis} - ${it.frecuencia} - durante ${it.duracionDias} ${it.duracionDias === 1 ? "día" : "días"}`, { indent: 14 });
    doc.moveDown(0.4);
  });

  // Indicaciones para el propietario
  if (r.indicaciones) {
    linea(doc);
    doc.fillColor(AZUL).font("Helvetica-Bold").fontSize(12).text("Indicaciones");
    doc.fillColor("black").font("Helvetica").fontSize(10).text(r.indicaciones, { width: ancho });
  }

  // Firma
  doc.moveDown(4);
  const x = doc.page.width - 50 - 220;
  doc.moveTo(x, doc.y).lineTo(x + 220, doc.y).strokeColor(GRIS).stroke();
  doc.moveDown(0.3);
  doc.fillColor("black").font("Helvetica-Bold").fontSize(10).text(r.veterinario.nombre, x, doc.y, { width: 220, align: "center" });
  if (r.veterinario.licencia)
    doc.font("Helvetica").fillColor(GRIS).text(`Licencia ${r.veterinario.licencia}`, x, doc.y, { width: 220, align: "center" });

  doc.end();
}

function linea(doc) {
  doc.moveDown(0.6);
  doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor(LINEA).stroke();
  doc.moveDown(0.6);
}