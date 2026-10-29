import { formatearEdad, formatearFecha, formatearFechaHora, formatearHora } from "@/lib/formato";

const AZUL = [63, 117, 179];
const OSCURO = [36, 65, 95];
const GRIS = [105, 128, 143];
const CLARO = [231, 241, 251];
const MARGEN = 14;

// Quita tildes y símbolos para usar el texto como nombre de archivo
const paraArchivo = (texto) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

// jsPDF y la tabla se cargan solo cuando alguien pide un PDF
async function nuevoDocumento(orientacion = "portrait") {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF({ orientation: orientacion, unit: "mm", format: "a4" });
  return { doc, autoTable };
}

async function cargarLogo() {
  try {
    const respuesta = await fetch("/Imagenes/LogoPopim.png");
    if (!respuesta.ok) return null;
    const blob = await respuesta.blob();
    return await new Promise((resolver) => {
      const lector = new FileReader();
      lector.onload = () => resolver(lector.result);
      lector.onerror = () => resolver(null);
      lector.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Banda azul con la marca + título. Devuelve la posición vertical donde sigue el contenido.
async function dibujarEncabezado(doc, titulo, subtitulo) {
  const ancho = doc.internal.pageSize.getWidth();
  doc.setFillColor(...AZUL);
  doc.rect(0, 0, ancho, 26, "F");

  let x = MARGEN;
  const logo = await cargarLogo();
  if (logo) {
    const { width, height } = doc.getImageProperties(logo);
    const alto = 17;
    const anchoLogo = (width / height) * alto;
    doc.addImage(logo, "PNG", MARGEN, 4.5, anchoLogo, alto);
    x = MARGEN + anchoLogo + 4;
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("POPIM", x, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Gestión de citas y salud animal", x, 20);

  doc.setTextColor(...OSCURO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(titulo, MARGEN, 38);

  if (subtitulo) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...GRIS);
    doc.text(subtitulo, MARGEN, 44);
    return 50;
  }
  return 44;
}

// Pie con fecha de generación y número de página en todas las hojas
function dibujarPie(doc) {
  const total = doc.getNumberOfPages();
  const generado = new Intl.DateTimeFormat("es", { dateStyle: "long", timeStyle: "short" }).format(new Date());
  for (let pagina = 1; pagina <= total; pagina++) {
    doc.setPage(pagina);
    const { width, height } = doc.internal.pageSize;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRIS);
    doc.text(`Generado el ${generado} · POPIM`, MARGEN, height - 8);
    doc.text(`Página ${pagina} de ${total}`, width - MARGEN, height - 8, { align: "right" });
  }
}

function parrafo(doc, texto, y, { tamano = 9, color = GRIS } = {}) {
  const ancho = doc.internal.pageSize.getWidth() - MARGEN * 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(tamano);
  doc.setTextColor(...color);
  const lineas = doc.splitTextToSize(texto, ancho);
  doc.text(lineas, MARGEN, y);
  return y + lineas.length * (tamano * 0.45) + 2;
}

const ESTILO_FILAS = {
  theme: "striped",
  styles: { fontSize: 11, textColor: OSCURO, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 } },
  alternateRowStyles: { fillColor: CLARO },
  columnStyles: { 0: { cellWidth: 42, fontStyle: "bold", textColor: GRIS } },
  margin: { left: MARGEN, right: MARGEN },
};

// ---------- Comprobante de una cita ----------
export async function crearComprobanteCita(cita) {
  const { doc, autoTable } = await nuevoDocumento();
  const y = await dibujarEncabezado(doc, "Comprobante de cita", `Estado actual: ${cita.estado.nombre}`);

  const { veterinario, clinica, mascota } = cita;
  autoTable(doc, {
    ...ESTILO_FILAS,
    startY: y + 2,
    body: [
      ["Mascota", `${mascota.nombre} (${mascota.codigoUnico})`],
      ["Fecha", formatearFecha(cita.fecha)],
      ["Hora", `${formatearHora(cita.horaInicio)} - ${formatearHora(cita.horaFin)}`],
      [
        "Veterinario",
        veterinario.especialidad
          ? `${veterinario.nombreCompleto} · ${veterinario.especialidad}`
          : veterinario.nombreCompleto,
      ],
      ["Clínica", clinica.nombreComercial],
      ["Dirección", clinica.direccion],
      ["Motivo", cita.motivoConsulta],
      ...(cita.motivoCancelacion ? [["Cancelada por", cita.motivoCancelacion]] : []),
    ],
  });

  const siguiente = parrafo(
    doc,
    "Este documento es un respaldo de tu cita. Su estado puede cambiar, por ejemplo cuando la clínica la confirma o se cancela. Consulta siempre Mis citas en el portal para ver el estado actual.",
    doc.lastAutoTable.finalY + 8,
  );
  parrafo(doc, `Código de la cita: ${cita.id}`, siguiente + 2);

  dibujarPie(doc);
  return doc;
}

export async function descargarComprobanteCita(cita) {
  const doc = await crearComprobanteCita(cita);
  doc.save(`cita-${paraArchivo(cita.mascota.nombre)}-${cita.fecha}.pdf`);
}

// ---------- Agenda: lista de citas (respaldo) ----------
export async function crearAgendaCitas(citas, { titulo = "Mi agenda de citas", propietario } = {}) {
  const { doc, autoTable } = await nuevoDocumento("landscape");
  const y = await dibujarEncabezado(doc, titulo, propietario ? `Propietario: ${propietario}` : undefined);

  autoTable(doc, {
    startY: y + 2,
    head: [["Fecha", "Hora", "Mascota", "Veterinario", "Clínica", "Motivo", "Estado"]],
    body: citas.map((c) => [
      formatearFecha(c.fecha),
      formatearHora(c.horaInicio),
      `${c.mascota.nombre} (${c.mascota.codigoUnico})`,
      c.veterinario.nombreCompleto,
      c.clinica.nombreComercial,
      c.motivoConsulta,
      c.estado.nombre,
    ]),
    styles: { fontSize: 9, textColor: OSCURO, cellPadding: 3 },
    headStyles: { fillColor: AZUL, textColor: 255 },
    alternateRowStyles: { fillColor: CLARO },
    margin: { left: MARGEN, right: MARGEN },
  });

  dibujarPie(doc);
  return doc;
}

export async function descargarAgendaCitas(citas, opciones) {
  const doc = await crearAgendaCitas(citas, opciones);
  doc.save(`agenda-popim-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ---------- Receta digital de una consulta ----------
export async function crearRecetaPdf(consulta) {
  const { doc, autoTable } = await nuevoDocumento();
  const { receta, mascota, veterinario, clinica } = consulta;
  const y = await dibujarEncabezado(doc, "Receta digital", `Emitida el ${formatearFechaHora(receta.fecha)}`);

  autoTable(doc, {
    ...ESTILO_FILAS,
    startY: y + 2,
    body: [
      ["Paciente", `${mascota.nombre} (${mascota.codigoUnico})`],
      ["Especie y raza", `${mascota.especie.nombre} · ${mascota.raza?.nombre ?? "Mestizo"}`],
      [
        "Veterinario",
        veterinario
          ? `${veterinario.nombreCompleto}${veterinario.numeroLicencia ? ` · Licencia ${veterinario.numeroLicencia}` : ""}`
          : "No registrado",
      ],
      ["Clínica", clinica ? clinica.nombreComercial : "No registrada"],
    ],
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [["Medicamento", "Dosis", "Frecuencia", "Duración"]],
    body: receta.items.map((item) => [
      item.medicamento.presentacion
        ? `${item.medicamento.nombre}\n${item.medicamento.presentacion}`
        : item.medicamento.nombre,
      item.dosis,
      item.frecuencia,
      `${item.duracionDias} ${item.duracionDias === 1 ? "día" : "días"}`,
    ]),
    styles: { fontSize: 10, textColor: OSCURO, cellPadding: 3 },
    headStyles: { fillColor: AZUL, textColor: 255 },
    alternateRowStyles: { fillColor: CLARO },
    margin: { left: MARGEN, right: MARGEN },
  });

  let siguiente = doc.lastAutoTable.finalY + 8;
  if (receta.observaciones) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...OSCURO);
    doc.text("Observaciones", MARGEN, siguiente);
    siguiente = parrafo(doc, receta.observaciones, siguiente + 5, { tamano: 10, color: OSCURO });
  }
  parrafo(
    doc,
    "Receta digital generada por POPIM. Sigue las indicaciones del veterinario y consulta con la clínica ante cualquier duda.",
    siguiente + 4,
  );

  dibujarPie(doc);
  return doc;
}

export async function descargarRecetaPdf(consulta) {
  const doc = await crearRecetaPdf(consulta);
  doc.save(`receta-${paraArchivo(consulta.mascota.nombre)}-${consulta.receta.fecha.slice(0, 10)}.pdf`);
}

// ---------- Reporte de salud de una mascota (REQ-019) ----------
export async function crearReporteSalud(mascota, dosis) {
  const { doc, autoTable } = await nuevoDocumento();
  const y = await dibujarEncabezado(doc, "Reporte de salud", `${mascota.nombre} · ${mascota.codigoUnico}`);

  autoTable(doc, {
    ...ESTILO_FILAS,
    startY: y + 2,
    body: [
      ["Especie y raza", `${mascota.especie.nombre} · ${mascota.raza?.nombre ?? "Mestizo"}`],
      ["Sexo", mascota.sexo === "MACHO" ? "Macho" : "Hembra"],
      ["Edad", formatearEdad(mascota.edadActualMeses)],
    ],
  });

  let siguiente = doc.lastAutoTable.finalY + 10;
  for (const [tipo, titulo] of [["VACUNA", "Vacunas"], ["DESPARASITANTE", "Desparasitación"]]) {
    const filas = dosis
      .filter((d) => d.producto.tipo === tipo)
      .sort((a, b) => a.fechaProgramada.localeCompare(b.fechaProgramada));

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...OSCURO);
    doc.text(titulo, MARGEN, siguiente);

    autoTable(doc, {
      startY: siguiente + 3,
      head: [["Producto", "Programada", "Aplicada", "Estado", "Lote"]],
      body: filas.length
        ? filas.map((d) => [
            d.producto.nombre,
            formatearFecha(d.fechaProgramada),
            d.fechaAplicada ? formatearFecha(d.fechaAplicada) : "-",
            d.estado.nombre,
            d.lote ?? "-",
          ])
        : [["Sin registros", "", "", "", ""]],
      styles: { fontSize: 10, textColor: OSCURO, cellPadding: 3 },
      headStyles: { fillColor: AZUL, textColor: 255 },
      alternateRowStyles: { fillColor: CLARO },
      margin: { left: MARGEN, right: MARGEN },
    });
    siguiente = doc.lastAutoTable.finalY + 10;
  }

  dibujarPie(doc);
  return doc;
}

export async function descargarReporteSalud(mascota, dosis) {
  const doc = await crearReporteSalud(mascota, dosis);
  doc.save(`reporte-salud-${paraArchivo(mascota.nombre)}.pdf`);
}