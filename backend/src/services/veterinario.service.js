
// Reglas del rol VETERINARIO. "personal" viene de cargarPersonal: { id, clinicaId, rol }

import { ErrorHttp } from "../utils/errores.js";
import { DIAS_SEMANA, deMinutos, hoyLocal, esFechaValida, aLocalManagua } from "../utils/fechas.js";
import * as repo from "../repositories/veterinario.repository.js";
import * as clinicaRepo from "../repositories/clinica.repository.js";
import { minutosEnElDia } from "./agenda.service.js";
import { textoEdad, agendarCita } from "./clinica.service.js";
import { guardarExamen } from "../config/archivos.js";

const ESTADO_DOSIS = { 601: "PENDIENTE", 602: "APLICADA", 603: "VENCIDA" };

// "2026-11-07" → "2026-11-08"
function sumarDias(fecha, n) {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const numero = (v) => (v === null || v === undefined ? null : Number(v)); // MySQL da los DECIMAL como texto
const horaLocal = (momento) => aLocalManagua(momento)?.slice(11, 16) ?? null; // UTC → "09:06"
const aControl = (t) => (t ? { fecha: t.slice(0, 10), hora: t.slice(11, 16) } : null);

function signosDe(f) {
  if (f.pesoKg === null && f.temperatura === null && f.frecuenciaCardiaca === null) return null;
  return { pesoKg: numero(f.pesoKg), temperatura: numero(f.temperatura), frecuenciaCardiaca: f.frecuenciaCardiaca };
}

// ---------- Cartilla y alertas ----------

// Una pendiente cuya fecha ya pasó se muestra como VENCIDA
function dosisVista(d, hoy) {
  const codigo = ESTADO_DOSIS[d.estadoId];
  return {
    id: d.id, productoId: d.productoId, nombre: d.nombre, tipo: d.tipo,
    fechaProgramada: d.fechaProgramada, fechaAplicada: d.fechaAplicada,
    estado: codigo === "PENDIENTE" && d.fechaProgramada < hoy ? "VENCIDA" : codigo,
    lote: d.lote,
  };
}

// Primero lo pendiente o vencido (la fecha más cercana arriba), luego lo aplicado (lo más reciente arriba)
function ordenarCartilla(a, b) {
  const aplicadaA = a.estado === "APLICADA";
  const aplicadaB = b.estado === "APLICADA";
  if (aplicadaA !== aplicadaB) return aplicadaA - aplicadaB;
  return aplicadaA
    ? b.fechaAplicada.localeCompare(a.fechaAplicada)
    : a.fechaProgramada.localeCompare(b.fechaProgramada);
}

function cartillaDe(filas, mascotaId, hoy) {
  return filas.filter((d) => d.mascotaId === mascotaId).map((d) => dosisVista(d, hoy)).sort(ordenarCartilla);
}

// El frontend arma el texto de cada alerta ("Antirrábica vencida desde…")
function alertasDe(cartilla, hoy) {
  const limite = sumarDias(hoy, 14);
  const alertas = [];
  for (const d of cartilla) {
    if (d.estado === "VENCIDA") alertas.push({ codigo: "DOSIS_VENCIDA", nombre: d.nombre, fecha: d.fechaProgramada });
    else if (d.estado === "PENDIENTE" && d.fechaProgramada <= limite)
      alertas.push({ codigo: "DOSIS_PROXIMA", nombre: d.nombre, fecha: d.fechaProgramada });
  }
  return alertas;
}

// ---------- Mi agenda y Atención de hoy ----------

// Una cita con la forma que usan Mi agenda y Atención de hoy
function citaVet(f) {
  const faltan = [];
  if (!f.tieneSignos) faltan.push("signos");
  if (!f.diagnostico) faltan.push("diagnóstico");
  if (!f.itemsReceta) faltan.push("receta");
  return {
    id: f.id,
    fecha: f.fecha,
    horaInicio: f.horaInicio,
    horaFin: f.horaFin,
    estadoId: f.estadoId,
    esEmergencia: Boolean(f.esEmergencia),
    prioridad: f.prioridad,
    personaPresentador: f.personaPresentador,
    registradaA: horaLocal(f.fechaCreacion),
    motivo: f.motivo,
    mascota: {
      id: f.mascotaId, nombre: f.mascotaNombre, codigoUnico: f.mascotaCodigo,
      especie: f.especie, raza: f.raza, edad: textoEdad(f.edadMeses),
    },
    propietario: { id: f.propietarioId, nombreCompleto: f.propietarioNombre, telefono: f.propietarioTelefono },
    // null = todavía no abre la consulta de esta cita
    consulta: f.consultaId
      ? {
          id: f.consultaId,
          iniciadaA: horaLocal(f.consultaInicio),
          finalizada: Boolean(f.consultaCierre),
          faltan,
          diagnostico: f.diagnostico,
          control: aControl(f.control),
        }
      : null,
  };
}

export async function miAgenda(personal, desde, hasta) {
  if (!esFechaValida(desde) || !esFechaValida(hasta) || desde > hasta)
    throw new ErrorHttp(400, "El rango de fechas no es válido");
  if (sumarDias(desde, 42) < hasta) throw new ErrorHttp(400, "Pide como máximo 6 semanas");

  const [citas, horarios, bloqueos, duracion] = await Promise.all([
    repo.citasDelVeterinario(personal.id, desde, hasta),
    repo.horarioSemanal(personal.id),
    repo.bloqueosEnRango(personal.id, desde, hasta),
    clinicaRepo.duracionCita(personal.clinicaId),
  ]);

  const dias = [];
  for (let fecha = desde; fecha <= hasta; fecha = sumarDias(fecha, 1)) {
    const diaSemana = DIAS_SEMANA[new Date(`${fecha}T00:00:00`).getDay()];
    dias.push({
      fecha,
      horario: horarios.filter((h) => h.dia === diaSemana).map((h) => ({ inicio: h.inicio, fin: h.fin })),
      // Un bloqueo de varios días se recorta a las horas de ESTE día
      bloqueos: bloqueos
        .filter((b) => b.inicio.slice(0, 10) <= fecha && b.fin.slice(0, 10) >= fecha)
        .map((b) => ({
          horaInicio: `${deMinutos(minutosEnElDia(b.inicio, fecha))}:00`,
          horaFin: `${deMinutos(Math.min(minutosEnElDia(b.fin, fecha), 1439))}:00`,
          motivo: b.motivo ?? "No disponible",
        }))
        .filter((b) => b.horaInicio < b.horaFin),
      citas: citas.filter((c) => c.fecha === fecha).map(citaVet),
    });
  }
  return { desde, hasta, duracionBloqueMin: duracion, dias };
}

export async function atencionHoy(personal) {
  const hoy = hoyLocal();
  const citas = await repo.citasDelVeterinario(personal.id, hoy, hoy);
  return { fecha: hoy, citas: citas.map(citaVet) };
}

// ---------- Iniciar consulta ----------
// La cita pasa a "En curso" (503). Si ya tenía consulta (doble clic), se devuelve la misma.
export async function iniciarConsulta(personal, usuarioId, citaId) {
  const cita = await repo.citaParaConsulta(citaId);
  if (!cita) throw new ErrorHttp(404, "No encontramos esa cita");
  if (cita.veterinarioId !== personal.id) throw new ErrorHttp(403, "Esta cita no es tuya");
  if (cita.consultaId) return { consultaId: cita.consultaId };

  if (cita.fecha !== hoyLocal()) throw new ErrorHttp(409, "Solo puedes iniciar consultas de hoy");
  if (cita.estadoId === 501) throw new ErrorHttp(409, "Recepción aún no confirma esta cita");
  if (cita.estadoId !== 502) throw new ErrorHttp(409, "Esta cita ya no se puede atender");

  try {
    const consultaId = await repo.abrirConsulta(cita, personal.id, usuarioId);
    if (!consultaId) throw new ErrorHttp(409, "La cita cambió de estado. Recarga la pantalla.");
    return { consultaId };
  } catch (error) {
    // Dos clics casi al mismo tiempo: la segunda choca con uq_consulta_cita → devolvemos la primera
    if (error.code === "ER_DUP_ENTRY") {
      const otra = await repo.citaParaConsulta(citaId);
      if (otra?.consultaId) return { consultaId: otra.consultaId };
    }
    throw error;
  }
}

// ---------- Mis consultas ----------
export async function misConsultas(personal) {
  const filas = await repo.consultasDelVeterinario(personal.id);
  return {
    consultas: filas.map((f) => ({
      id: f.id,
      citaId: f.citaId,
      inicio: aLocalManagua(f.inicio),
      abierta: !f.cierre,
      esEmergencia: Boolean(f.esEmergencia),
      prioridad: f.prioridad ?? "NORMAL",
      motivo: f.motivo,
      diagnostico: f.diagnostico,
      mascota: { id: f.mascotaId, nombre: f.mascotaNombre },
      propietario: { nombreCompleto: f.propietarioNombre },
      examenesPendientes: 0, // en resultados_examen siempre hay archivo: no hay "pendientes"
      control: aControl(f.control),
      referidoA: f.referidoA,
      tratamiento: f.tratamiento ?? "",
    })),
  };
}

// ---------- Pacientes ----------
export async function misPacientes(personal) {
  const filas = await repo.pacientesDelVeterinario(personal.id);
  const dosis = await repo.dosisDeMascotas(filas.map((f) => f.id));
  const hoy = hoyLocal();

  const pacientes = filas.map((f) => ({
    mascota: { id: f.id, nombre: f.nombre, especie: f.especie, codigoUnico: f.codigoUnico },
    propietario: { nombreCompleto: f.propietarioNombre },
    ultimaVisita: aLocalManagua(f.ultimaVisita)?.slice(0, 10) ?? null,
    alertas: alertasDe(cartillaDe(dosis, f.id, hoy), hoy),
  }));
  // Primero los de visita más reciente; los que nunca han venido, al final
  pacientes.sort((a, b) => (b.ultimaVisita ?? "").localeCompare(a.ultimaVisita ?? ""));
  return { pacientes };
}

// ---------- Armar consultas con sus tablas hijas ----------

// Une cada consulta con sus diagnósticos, hallazgos, tratamiento, receta y exámenes
async function conDetalles(filas) {
  const det = await repo.detallesDeConsultas(filas.map((f) => f.id));
  const de = (lista, id) => lista.filter((x) => x.consultaId === id);

  return filas.map((f) => {
    const recetaFilas = de(det.recetas, f.id);
    const tratamiento = de(det.tratamientos, f.id)[0];
    return {
      fila: f,
      signos: signosDe(f),
      hallazgos: de(det.hallazgos, f.id).map((h) => h.descripcion),
      diagnosticos: de(det.diagnosticos, f.id).map((d) => ({
        padecimientoId: d.padecimientoId, nombre: d.nombre, clasificacion: d.clasificacion, descripcion: d.descripcion ?? "",
      })),
      tratamiento: tratamiento
        ? { descripcion: tratamiento.descripcion, fechaInicio: tratamiento.fechaInicio, duracionDias: tratamiento.duracionDias }
        : null,
      receta: {
        observaciones: recetaFilas[0]?.observaciones ?? "",
        // LEFT JOIN: una receta sin medicamentos trae una fila con medicamentoId null
        items: recetaFilas.filter((r) => r.medicamentoId).map((r) => ({
          medicamentoId: r.medicamentoId, nombre: r.nombre, presentacion: r.presentacion,
          dosis: r.dosis, frecuencia: r.frecuencia, duracionDias: r.duracionDias,
        })),
      },
      examenes: de(det.examenes, f.id).map((e) => ({
        id: e.id, tipoExamenId: e.tipoExamenId, tipo: e.tipo, nombreOriginal: e.nombreOriginal,
        mimeType: e.mimeType, tamanoBytes: e.tamanoBytes, fechaCarga: aLocalManagua(e.fechaCarga),
        archivoUrl: null, // se descarga por /clinica/examenes/:id/archivo (ruta protegida)
        estado: "CON_RESULTADO", resultado: null,
      })),
    };
  });
}

// "Meloxicam gotas 0.5 mg/ml" · "0.3 ml cada 24 h × 5 días"
const recetaCorta = (items) =>
  items.map((it) => ({
    medicamento: `${it.nombre} ${it.presentacion}`.trim(),
    indicaciones: `${it.dosis} ${it.frecuencia.toLowerCase()} × ${it.duracionDias} días`,
  }));

const mascotaVista = (m) => ({
  id: m.id, nombre: m.nombre, codigoUnico: m.codigoUnico, especie: m.especie, raza: m.raza,
  sexo: m.sexo, edad: textoEdad(m.edadMeses),
});

// ---------- Expediente (toda la red POPIM) ----------
export async function expediente(personal, usuarioId, mascotaId, ip) {
  const m = await repo.mascotaConExpediente(mascotaId);
  if (!m) throw new ErrorHttp(404, "No encontramos esa mascota");

  const [filas, dosis] = await Promise.all([repo.consultasDeMascota(mascotaId), repo.dosisDeMascotas([mascotaId])]);
  const completas = await conDetalles(filas);
  const hoy = hoyLocal();
  const cartilla = cartillaDe(dosis, mascotaId, hoy);

  const consultas = completas.map(({ fila: f, signos, hallazgos, receta, examenes, tratamiento }) => ({
    id: f.id,
    fecha: aLocalManagua(f.inicio).slice(0, 10),
    abierta: !f.cierre,
    motivo: f.motivo,
    veterinario: f.veterinario,
    clinica: f.clinica,
    esEstaClinica: f.clinicaId === personal.clinicaId,
    diagnostico: f.diagnostico,
    signos,
    hallazgos,
    receta: recetaCorta(receta.items),
    examenes,
    tratamiento: tratamiento?.descripcion ?? "",
  }));

  // Queda registrado quién consultó el expediente (no se puede borrar ni cambiar)
  if (m.expedienteId) await repo.auditar(usuarioId, m.expedienteId, "CONSULTAR", "expedientes_clinicos", m.expedienteId, ip);

  return {
    mascota: mascotaVista(m),
    propietario: { nombreCompleto: m.propietarioNombre, telefono: m.propietarioTelefono },
    ultimoPeso: consultas.find((c) => c.signos?.pesoKg)?.signos.pesoKg ?? null,
    consultas,
    cartilla,
    examenes: consultas.flatMap((c) => c.examenes.map((e) => ({ ...e, fecha: c.fecha, motivo: c.motivo }))),
    alertas: alertasDe(cartilla, hoy),
  };
}

// ---------- Pantalla de consulta ----------
export async function obtenerConsulta(personal, consultaId) {
  const f = await repo.buscarConsulta(consultaId);
  if (!f || f.clinicaId !== personal.clinicaId) throw new ErrorHttp(404, "No encontramos esa consulta");

  const [[c], m, dosis, pesoAnterior] = await Promise.all([
    conDetalles([f]),
    repo.mascotaConExpediente(f.mascotaId),
    repo.dosisDeMascotas([f.mascotaId]),
    repo.pesoAnterior(f.mascotaId, f.id, f.inicio),
  ]);
  const hoy = hoyLocal();
  const cartilla = cartillaDe(dosis, f.mascotaId, hoy);

  return {
    consulta: {
      id: f.id, citaId: f.citaId, abierta: !f.cierre,
      iniciadaA: horaLocal(f.inicio), finalizadaEl: aLocalManagua(f.cierre),
      fecha: f.fecha, horaCita: f.horaCita, motivo: f.motivo,
      esEmergencia: Boolean(f.esEmergencia), prioridad: f.prioridad,
      veterinario: { personalId: f.personalId, nombreCompleto: f.veterinario },
      signos: c.signos, observaciones: f.observaciones ?? "", hallazgos: c.hallazgos,
      diagnosticos: c.diagnosticos, tratamiento: c.tratamiento, receta: c.receta, examenes: c.examenes,
      control: aControl(f.control), referidoA: f.referidoA,
    },
    mascota: mascotaVista(m),
    propietario: { nombreCompleto: m.propietarioNombre, telefono: m.propietarioTelefono },
    pesoAnterior: numero(pesoAnterior),
    cartilla,
    alertas: alertasDe(cartilla, hoy),
  };
}

// ---------- Catálogos de las pestañas (una sola petición) ----------
export async function catalogosConsulta() {
  return repo.catalogosConsulta();
}



// ---------- Guardar y finalizar ----------

// Solo el veterinario que la atiende puede cambiarla, y solo mientras siga abierta
async function consultaEditable(personal, consultaId) {
  const f = await repo.buscarConsulta(consultaId);
  if (!f || f.clinicaId !== personal.clinicaId) throw new ErrorHttp(404, "No encontramos esa consulta");
  if (f.personalId !== personal.id) throw new ErrorHttp(403, "Esta consulta no es tuya");
  if (f.cierre) throw new ErrorHttp(409, "La consulta ya está finalizada y no se puede editar");
  return f;
}

// PUT /clinica/consultas/:id → guarda lo que mande la pestaña y devuelve la consulta completa
export async function guardarConsulta(personal, usuarioId, consultaId, d, ip) {
  const f = await consultaEditable(personal, consultaId);

  // Los catálogos se revisan aquí para dar un mensaje claro (y no un error de llave foránea)
  if (d.diagnosticos?.length) {
    const ids = d.diagnosticos.map((x) => x.padecimientoId);
    if ((await repo.contarPadecimientos(ids)) !== ids.length)
      throw new ErrorHttp(400, "Hay un padecimiento que no existe en el catálogo", "diagnosticos");
  }
  if (d.receta?.items.length) {
    const ids = d.receta.items.map((x) => x.medicamentoId);
    if ((await repo.contarMedicamentosActivos(ids)) !== ids.length)
      throw new ErrorHttp(400, "Hay un medicamento que no existe o ya no está activo", "receta");
  }

  await repo.guardarConsulta(f.id, f.expedienteId, usuarioId, d, ip);
  return obtenerConsulta(personal, consultaId);
}

// POST /clinica/consultas/:id/finalizar → exige los 3 signos y al menos un diagnóstico
export async function finalizarConsulta(personal, usuarioId, consultaId, ip) {
  const f = await consultaEditable(personal, consultaId);
  if (f.pesoKg === null || f.temperatura === null || f.frecuenciaCardiaca === null)
    throw new ErrorHttp(400, "Registra los signos (peso, temperatura y frecuencia) antes de finalizar");
  if (!f.diagnostico) throw new ErrorHttp(400, "Agrega al menos un diagnóstico antes de finalizar");

  const cerrada = await repo.finalizarConsulta(f, usuarioId, ip);
  if (!cerrada) throw new ErrorHttp(409, "La consulta ya estaba finalizada");
  return obtenerConsulta(personal, consultaId);
}



// ---------- Cita de control / referir ----------
// Control = cita nueva con él mismo · Referir = cita con un colega de ESTA clínica.
// Se puede hacer con la consulta abierta o ya finalizada (recepción también lo sugiere al finalizar).
export async function citaDesdeConsulta(personal, usuarioId, consultaId, d) {
  const f = await repo.buscarConsulta(consultaId);
  if (!f || f.clinicaId !== personal.clinicaId) throw new ErrorHttp(404, "No encontramos esa consulta");
  if (f.personalId !== personal.id) throw new ErrorHttp(403, "Esta consulta no es tuya");

  const esControl = d.tipo === "CONTROL";
  const veterinarioId = esControl ? personal.id : d.veterinarioId;
  if (!veterinarioId) throw new ErrorHttp(400, "Elige a qué colega lo refieres", "veterinarioId");
  if (!esControl && veterinarioId === personal.id) throw new ErrorHttp(400, "Para referir elige a otro colega", "veterinarioId");

  const motivo = (d.motivo ?? `${esControl ? "Control" : "Referida"}: ${f.motivo ?? "consulta"}`).slice(0, 255);

  // agendarCita revisa: fecha no pasada, veterinario de mi clínica, mascota activa y bloque LIBRE
  const { id } = await agendarCita(personal, usuarioId, {
    veterinarioId, fecha: d.fecha, horaInicio: d.horaInicio, mascotaId: f.mascotaId, motivo,
    referidaDesde: f.id,
    motivoHistorial: esControl ? "Cita de control agendada por el veterinario" : "Referida por un colega",
  });
  return { citaId: id };
}

// ---------- Vacunas ----------

// POST /clinica/consultas/:id/dosis → nueva dosis PENDIENTE en su cartilla
export async function programarDosis(personal, consultaId, d) {
  const f = await consultaEditable(personal, consultaId);
  if (!(await repo.productoExiste(d.productoId))) throw new ErrorHttp(400, "Elige la vacuna o el desparasitante", "productoId");
  if (d.fechaProgramada < hoyLocal()) throw new ErrorHttp(400, "La fecha debe ser de hoy en adelante", "fechaProgramada");

  await repo.programarDosis(f.mascotaId, d.productoId, d.fechaProgramada);
  return obtenerConsulta(personal, consultaId);
}

// POST /clinica/dosis/:id/aplicar → la aplica HOY, dentro de una consulta abierta suya
export async function aplicarDosis(personal, usuarioId, dosisId, d, ip) {
  const f = await consultaEditable(personal, d.consultaId);
  const dosis = await repo.buscarDosis(dosisId);
  if (!dosis) throw new ErrorHttp(404, "No encontramos esa dosis");
  if (dosis.mascotaId !== f.mascotaId) throw new ErrorHttp(400, "Esa dosis es de otra mascota");

  const aplicada = await repo.aplicarDosis({
    dosisId, fecha: hoyLocal(), personalId: personal.id, consultaId: f.id, lote: d.lote,
  });
  if (!aplicada) throw new ErrorHttp(409, "Esa dosis ya está aplicada");
  await repo.auditar(usuarioId, f.expedienteId, "MODIFICAR", "dosis_preventivas", dosisId, ip);
  return obtenerConsulta(personal, d.consultaId);
}

// ---------- Exámenes ----------

// POST /clinica/consultas/:id/examenes?tipoExamenId= (multipart, campo "archivo").
// Se permite aunque la consulta esté finalizada (los resultados suelen llegar después).
export async function subirExamen(personal, usuarioId, consultaId, tipoExamenId, archivo, ip) {
  const f = await repo.buscarConsulta(consultaId);
  if (!f || f.clinicaId !== personal.clinicaId) throw new ErrorHttp(404, "No encontramos esa consulta");
  if (f.personalId !== personal.id) throw new ErrorHttp(403, "Esta consulta no es tuya");

  const tipo = Number(tipoExamenId);
  if (!Number.isInteger(tipo) || !(await repo.tipoExamenExiste(tipo)))
    throw new ErrorHttp(400, "Elige el tipo de examen", "tipoExamenId");
  if (!archivo) throw new ErrorHttp(400, "Adjunta el archivo del resultado", "archivo");

  const guardado = await guardarExamen(archivo.buffer);
  if (!guardado) throw new ErrorHttp(400, "Solo se aceptan archivos PDF, JPG o PNG", "archivo");

  await repo.insertarExamen({
    expedienteId: f.expedienteId, consultaId: f.id, tipoExamenId: tipo,
    archivoUrl: `examenes/${guardado.nombre}`,
    nombreOriginal: (archivo.originalname || "resultado").slice(0, 255),
    mimeType: guardado.mimeType, tamanoBytes: archivo.size, usuarioId,
  });
  await repo.auditar(usuarioId, f.expedienteId, "CREAR", "resultados_examen", null, ip);
  return obtenerConsulta(personal, consultaId);
}

// GET /clinica/examenes/:id/archivo → datos para mandar el archivo (y queda en la bitácora)
export async function archivoExamen(usuarioId, examenId, ip) {
  const e = await repo.buscarExamen(examenId);
  if (!e) throw new ErrorHttp(404, "No encontramos ese examen");
  await repo.auditar(usuarioId, e.expedienteId, "CONSULTAR", "resultados_examen", e.id, ip);
  return { nombre: e.archivoUrl.split("/").pop(), nombreOriginal: e.nombreOriginal, mimeType: e.mimeType };
}

// ---------- Receta en PDF ----------
// Arma los datos de la receta; el controlador la dibuja con recetaPdf.js
export async function datosReceta(personal, consultaId) {
  const datos = await obtenerConsulta(personal, consultaId); // revisa que sea de mi clínica
  const { consulta: c, mascota: m, propietario: p } = datos;
  if (c.receta.items.length === 0) throw new ErrorHttp(404, "Esta consulta todavía no tiene medicamentos en la receta");

  const extra = await repo.datosParaReceta(consultaId);
  const [anio, mes, dia] = c.fecha.split("-");

  return {
    clinica: { nombre: extra.clinica, direccion: extra.direccion, telefono: extra.telefono },
    veterinario: { nombre: `MV. ${c.veterinario.nombreCompleto}`, licencia: extra.licencia },
    fecha: `${dia}/${mes}/${anio}`,
    mascota: {
      nombre: m.nombre, codigo: m.codigoUnico, especie: m.especie, raza: m.raza,
      sexo: m.sexo === "MACHO" ? "Macho" : "Hembra", edad: m.edad, pesoKg: c.signos?.pesoKg,
    },
    propietario: p.nombreCompleto,
    diagnostico: c.diagnosticos.map((x) => x.nombre).join(", "),
    items: c.receta.items.map((it) => ({
      medicamento: `${it.nombre} ${it.presentacion}`.trim(), dosis: it.dosis, frecuencia: it.frecuencia, duracionDias: it.duracionDias,
    })),
    indicaciones: c.receta.observaciones,
  };
}