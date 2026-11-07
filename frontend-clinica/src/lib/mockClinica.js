/* Datos simulados con la forma de la BD de POPIM (Usuarios, Propietarios, Mascotas,
   Personal_clinica, Citas...). Todo vive en memoria: al recargar la página se reinicia. */
   
import { ErrorApi } from "@/lib/simulador";
import { ahoraISO, formatearEdad, horaAhora, hoyISO, iniciales, sumarDias } from "@/lib/formato";
import { ESTADOS, ID_ESTADO_CITA } from "@/lib/estados";
import { normalizarCedula, normalizarTelefono } from "@/lib/validaciones";

const HOY = hoyISO();
const d = (n) => sumarDias(HOY, n);
// Como d(n), pero si cae domingo se corre al día hábil más cercano (el Dr. Herrera no atiende domingos).
// Hacia el pasado se corre al sábado; hacia el futuro, al lunes.
const habil = (n) => {
  const f = d(n);
  if (new Date(`${f}T00:00:00`).getDay() !== 0) return f;
  return sumarDias(f, n < 0 ? -1 : 1);
};
const sig = (h) => `${String(Number(h.slice(0, 2)) + 1).padStart(2, "0")}:00`;
let seq = 100;

// ---------- Sesión ----------
export const CLINICA = {
  id: "c1", nombreComercial: "POPIM Central - Managua",
  direccion: "Km 5 Carretera Masaya, Managua", duracionCitaMin: 60,
};
const RECEPCIONISTA = {
  id: "u-rec", nombreCompleto: "Rosa Calero", rol: "Recepcionista",
  telefono: "8555-0101", correo: "recepcion@clinica.com",
  fechaIngreso: "2025-03-10", estado: "Activo", ultimoAcceso: "Hoy, 07:52",
};

export const obtenerSesion = () => ({ usuario: RECEPCIONISTA, clinica: CLINICA });
export function actualizarPerfil({ nombreCompleto, telefono }) {
  Object.assign(RECEPCIONISTA, { nombreCompleto, telefono });
  return { usuario: RECEPCIONISTA };
}
export function cambiarPassword({ actual }) {
  if (actual === "error") throw new ErrorApi("La contraseña actual es incorrecta.", 400);
  return {};
}

// ---------- Catálogos ----------
export const ID_ESPECIE_OTRO = "12";
const ESPECIES = ["Canino", "Felino", "Ave", "Roedor", "Reptil", "Equino", "Bovino", "Porcinos", "Ovino", "Caprino", "Anfibios", "Otro"]
  .map((nombre, i) => ({ id: i + 1, nombre }));
const ALIAS = { Canino: "Perro", Felino: "Gato" }; // el diseño muestra Perro/Gato
const RAZAS = {
  1: ["Mestizo", "Labrador Retriever", "Pastor Alemán", "Golden Retriever", "Bulldog Francés", "Beagle", "Poodle / Caniche", "Rottweiler", "Yorkshire Terrier", "Chihuahua", "Shih Tzu"],
  2: ["Mestizo", "Persa", "Maine Coon", "Siamés", "Ragdoll", "Bengalí"],
  3: ["Mestizo", "Perico Australiano", "Canario", "Loro Amazonas"],
  4: ["Mestizo", "Hámster Sirio", "Cobaya / Cuyo", "Chinchilla"],
  5: ["Mestizo", "Iguana Verde", "Geco Leopardo"],
  6: ["Mestizo", "Cuarto de Milla", "Paso Fino"],
  7: ["Mestizo", "Holstein", "Brahman"],
  8: ["Mestizo", "Duroc"], 9: ["Mestizo", "Dorper"], 10: ["Mestizo", "Saanen", "Boer"],
  11: ["Mestizo", "Ajolote"], 12: [],
};
// TODO: reemplazar por la lista completa de RAZAS_MOCK de frontend-propietario
export const obtenerEspecies = () => ({ especies: ESPECIES });
export const obtenerRazas = (especieId) => ({
  razas: (RAZAS[especieId] ?? []).map((nombre, i) => ({ id: Number(especieId) * 100 + i + 1, nombre })),
});

// ---------- Veterinarios (Personal_clinica + Perfil_veterinario + Horarios_personal) ----------
const VETS = [
  { id: "v1", nombreCompleto: "Dra. Ana Morales", especialidad: "Medicina general", horaInicio: "08:00", horaFin: "16:00", almuerzo: "12:00" },
  { id: "v2", nombreCompleto: "Dr. José Rivera", especialidad: "Dermatología", horaInicio: "09:00", horaFin: "17:00", almuerzo: "12:00" },
  { id: "v3", nombreCompleto: "Dra. Karla Díaz", especialidad: "Cirugía menor", horaInicio: "08:00", horaFin: "16:00", almuerzo: "13:00" },
  // sabadoHasta: el sábado solo atiende en la mañana (lo usa "Mi agenda" del veterinario)
  { id: "v4", nombreCompleto: "Dr. Luis Herrera", especialidad: "Medicina general", horaInicio: "08:00", horaFin: "17:00", almuerzo: "12:00", sabadoHasta: "12:00" },
];
// Bloqueos_agenda (vacaciones, permisos, cirugías largas)
const BLOQUEOS = [
  { vetId: "v3", fecha: HOY, hora: "11:00", motivo: "Cirugía programada" },
  { vetId: "v4", fecha: HOY, hora: "16:00", motivo: "Permiso personal" },
  // Agregados para la agenda del veterinario (Dr. Luis Herrera)
  { vetId: "v4", fecha: habil(1), hora: "11:00", motivo: "Cirugía programada" },
  { vetId: "v4", fecha: habil(3), hora: "14:00", motivo: "Permiso personal" },
  { vetId: "v4", fecha: habil(3), hora: "15:00", motivo: "Permiso personal" },
];
const vetPorId = (id) => VETS.find((v) => v.id === id);
export const listarVeterinarios = () => ({
  veterinarios: VETS.map((v) => ({ ...v, iniciales: iniciales(v.nombreCompleto) })),
});

// ---------- Propietarios y mascotas ----------
const prop = (id, nombreCompleto, telefono, cedula, correo, estado, direccion = "") =>
  ({ id, nombreCompleto, telefono, cedula, correo, direccion, estado });
const PROPIETARIOS = [
  prop("p1", "Carlos Méndez", "8888-1234", "001-120390-0012A", "carlos.mendez@correo.com", "ACTIVO", "Altamira, Managua"),
  prop("p2", "Pedro Gómez", "8800-1122", "001-050485-0010B", "pedro.gomez@correo.com", "ACTIVO"),
  prop("p3", "María López", "8811-3344", "001-210992-0003C", "maria.lopez@correo.com", "ACTIVO"),
  prop("p4", "Sofía Ruiz", "8822-5566", "001-150798-0021D", "sofia.ruiz@correo.com", "ACTIVO"),
  prop("p5", "Ricardo Silva", "8654-2201", null, null, "PROVISIONAL"),
  prop("p6", "Laura Castillo", "8777-4521", "001-300588-0008E", "laura.castillo@correo.com", "ACTIVO"),
  prop("p7", "Andrés Torres", "8833-7788", "001-111180-0014F", "andres.torres@correo.com", "ACTIVO"),
  prop("p8", "Daniela Pérez", "8421-9087", "001-020201-0005G", "daniela.perez@correo.com", "PENDIENTE", "Villa Fontana, Managua"),
  prop("p9", "Jorge Medina", "8844-9900", "001-090375-0017H", "jorge.medina@correo.com", "ACTIVO"),
  prop("p10", "Ernesto Vega", "8312-6670", "001-180694-0009J", "ernesto.vega@correo.com", "ACTIVO"),
  prop("p11", "Gabriela Núñez", "8590-1144", "001-251089-0011K", "gabriela.nunez@correo.com", "ACTIVO"),
  prop("p12", "Marco Ríos", "8733-2098", "001-070791-0006L", "marco.rios@correo.com", "ACTIVO"),
];
const masc = (id, codigoUnico, nombre, especie, raza, sexo, edadActualMeses, propietarioId) =>
  ({ id, codigoUnico, nombre, especie, raza, sexo, edadActualMeses, propietarioId });
const MASCOTAS = [
  masc("m1", "PET-4482-KX", "Max", "Perro", "Labrador", "MACHO", 60, "p1"),
  masc("m2", "PET-5120-CM", "Pelusa", "Gato", "Mestizo", "HEMBRA", 8, "p1"),
  masc("m3", "PET-7310-RS", "Canela", "Perro", "Mestizo", "HEMBRA", 24, "p5"),
  masc("m4", "PET-2291-MC", "Michi", "Gato", "Siamés", "HEMBRA", 36, "p6"),
  masc("m5", "PET-6604-DP", "Coco", "Conejo", "Mestizo", "MACHO", 14, "p8"),
  masc("m6", "PET-3057-SR", "Kiara", "Perro", "Poodle", "HEMBRA", 30, "p4"),
  masc("m7", "PET-1001-PG", "Rocky", "Perro", "Pastor alemán", "MACHO", 48, "p2"),
  masc("m8", "PET-1002-ML", "Luna", "Gato", "Mestizo", "HEMBRA", 20, "p3"),
  masc("m9", "PET-1003-AT", "Toby", "Perro", "Beagle", "MACHO", 40, "p7"),
  masc("m10", "PET-1004-JM", "Bruno", "Perro", "Mestizo", "MACHO", 72, "p9"),
  masc("m11", "PET-1005-EV", "Simba", "Gato", "Mestizo", "MACHO", 12, "p10"),
  masc("m12", "PET-1006-GN", "Bella", "Perro", "Shih Tzu", "HEMBRA", 36, "p11"),
  masc("m13", "PET-1007-MR", "Thor", "Perro", "Rottweiler", "MACHO", 24, "p12"),
  masc("m14", "PET-1008-AT", "Milo", "Gato", "Mestizo", "MACHO", 30, "p7"),
];
const propPorId = (id) => PROPIETARIOS.find((p) => p.id === id);
const mascPorId = (id) => MASCOTAS.find((m) => m.id === id);
const refPropietario = (p) => ({ id: p.id, nombreCompleto: p.nombreCompleto, telefono: p.telefono, correo: p.correo });

// ---------- Citas ----------
const cita = (id, mascotaId, veterinarioId, dia, horaInicio, motivoConsulta, estado, x = {}) => ({
  id, mascotaId, veterinarioId, fecha: d(dia), horaInicio, horaFin: sig(horaInicio), motivoConsulta, estado,
  esEmergencia: false, prioridad: "NORMAL", personaPresentador: null, // citas.prioridad y citas.persona_presentador
  motivoCancelacion: null, enConsultaDesde: null, creadaPor: "PROPIETARIO",
  solicitadaEl: `${d(dia)}T07:00`, historial: [], ...x,
});
const CITAS = [
  cita("c1", "m1", "v1", 0, "08:00", "Vacunación anual", "COMPLETADA", { solicitadaEl: `${d(-3)}T10:00` }),
  cita("c2", "m7", "v1", 0, "09:00", "Cojera en pata trasera", "ATENCION", { enConsultaDesde: "09:06" }),
  cita("c3", "m8", "v2", 0, "09:00", "Control de peso", "ATENCION", { enConsultaDesde: "09:12" }),
  cita("c4", "m6", "v1", 0, "10:00", "Desparasitación", "CONFIRMADA"),
  // Emergencia registrada por recepción a las 10:52 para el Dr. Luis Herrera; él aún no abre la consulta
  cita("c5", "m3", "v4", 0, "11:00", "Golpe en la calle", "ATENCION", {
    esEmergencia: true, prioridad: "CRITICA", personaPresentador: "Sofía Silva (hija del dueño)",
    enConsultaDesde: "10:52", creadaPor: "RECEPCIONISTA", solicitadaEl: `${d(0)}T10:52`,
  }),
  cita("c6", "m4", "v4", 0, "10:00", "Vómitos frecuentes desde hace dos días, come poco.", "SOLICITADA", { solicitadaEl: `${d(-1)}T15:20` }),
  cita("c7", "m9", "v2", 0, "11:00", "Revisión de piel", "CONFIRMADA"),
  cita("c8", "m5", "v3", 0, "12:00", "Primera consulta", "SOLICITADA", { solicitadaEl: `${d(0)}T07:40` }),
  cita("c9", "m10", "v4", 0, "14:00", "Seguimiento de tratamiento", "CONFIRMADA"),
  cita("c10", "m2", "v2", 0, "15:00", "Control general", "CANCELADA", { motivoCancelacion: "El propietario no podrá asistir." }),
  cita("c11", "m11", "v2", 1, "09:00", "Vacuna antirrábica", "SOLICITADA", { solicitadaEl: `${d(-1)}T19:05` }),
  cita("c12", "m12", "v1", 2, "14:00", "Control posoperatorio", "SOLICITADA", { solicitadaEl: `${d(0)}T08:15` }),
  cita("c13", "m13", "v4", 3, "08:00", "Revisión general", "SOLICITADA", { solicitadaEl: `${d(0)}T09:30` }),
  // ---- Agregadas para el veterinario Dr. Luis Herrera (v4) ----
  cita("c20", "m12", "v4", 0, "09:00", "Control posoperatorio (esterilización hace 10 días)", "ATENCION", { enConsultaDesde: "09:04" }),
  cita("c21", "m13", "v4", 0, "08:00", "Revisión general", "COMPLETADA"),
  cita("c22", "m9", "v4", -1, "08:00", "Vacuna anual", "COMPLETADA", { fecha: habil(-1) }),
  cita("c23", "m14", "v4", -1, "10:00", "Picazón en oído", "COMPLETADA", { fecha: habil(-1) }),
  cita("c24", "m1", "v4", 1, "08:00", "Control de peso", "CONFIRMADA", { fecha: habil(1) }),
  cita("c25", "m7", "v4", 1, "10:00", "Control de oído", "CONFIRMADA", { fecha: habil(1) }),
  cita("c26", "m11", "v4", 2, "09:00", "Revisión de piel", "CONFIRMADA", { fecha: habil(2) }),
  cita("c27", "m8", "v4", 2, "13:00", "Seguimiento", "CONFIRMADA", { fecha: habil(2) }),
  cita("c28", "m6", "v4", 4, "10:00", "Primera consulta", "SOLICITADA", { fecha: habil(4), solicitadaEl: `${d(0)}T08:40` }),
];
const activa = (c) => !["CANCELADA", "AUSENTE"].includes(c.estado);
const porFechaHora = (a, b) => `${a.fecha}${a.horaInicio}`.localeCompare(`${b.fecha}${b.horaInicio}`);

function vista(c) {
  const m = mascPorId(c.mascotaId);
  const p = propPorId(m.propietarioId);
  const v = vetPorId(c.veterinarioId);
  const base = [{ titulo: "Solicitada", detalle: c.creadaPor === "PROPIETARIO" ? `${p.nombreCompleto} (propietario)` : "Recepción", fecha: c.solicitadaEl }];
  if (c.estado !== "SOLICITADA" && !c.historial.length) base.push({ titulo: ESTADOS[c.estado].nombre, detalle: "Recepción", fecha: c.solicitadaEl });
  return {
    id: c.id, fecha: c.fecha, horaInicio: c.horaInicio, horaFin: c.horaFin, motivoConsulta: c.motivoConsulta,
    estado: c.estado, esEmergencia: c.esEmergencia, motivoCancelacion: c.motivoCancelacion,
    enConsultaDesde: c.enConsultaDesde, solicitadaEl: c.solicitadaEl, creadaPor: c.creadaPor,
    historial: [...base, ...c.historial],
    mascota: { id: m.id, nombre: m.nombre, codigoUnico: m.codigoUnico, especie: m.especie, raza: m.raza, sexo: m.sexo, edadActualMeses: m.edadActualMeses },
    propietario: refPropietario(p),
    veterinario: { id: v.id, nombreCompleto: v.nombreCompleto, especialidad: v.especialidad },
  };
}

// ---------- Agenda: los bloques no se guardan, se calculan ----------
const horasDe = () => {
  const ini = Math.min(...VETS.map((v) => Number(v.horaInicio.slice(0, 2))));
  const fin = Math.max(...VETS.map((v) => Number(v.horaFin.slice(0, 2))));
  return Array.from({ length: fin - ini }, (_, i) => `${String(ini + i).padStart(2, "0")}:00`);
};
function celda(v, fecha, hora) {
  if (hora < v.horaInicio || hora >= v.horaFin) return { tipo: "FUERA" };
  if (hora === v.almuerzo) return { tipo: "BLOQUEO", motivo: "Almuerzo" };
  const b = BLOQUEOS.find((x) => x.vetId === v.id && x.fecha === fecha && x.hora === hora);
  if (b) return { tipo: "BLOQUEO", motivo: b.motivo };
  const c = CITAS.find((x) => x.veterinarioId === v.id && x.fecha === fecha && x.horaInicio === hora && activa(x));
  return c ? { tipo: "CITA", cita: vista(c) } : { tipo: "LIBRE" };
}
export function obtenerAgenda(fecha) {
  const horas = horasDe();
  return {
    fecha, horas, clinica: CLINICA,
    veterinarios: VETS.map((v) => ({
      id: v.id, nombreCompleto: v.nombreCompleto, iniciales: iniciales(v.nombreCompleto),
      especialidad: v.especialidad, horaInicio: v.horaInicio, horaFin: v.horaFin,
      celdas: Object.fromEntries(horas.map((h) => [h, celda(v, fecha, h)])),
    })),
  };
}
export function obtenerDisponibilidad(vetId, fecha) {
  const v = vetPorId(vetId);
  if (!v || !fecha) return { bloques: [] };
  return {
    bloques: horasDe()
      .map((h) => ({ horaInicio: h, horaFin: sig(h), tipo: celda(v, fecha, h).tipo }))
      .filter((b) => b.tipo !== "FUERA")
      .map((b) => ({ horaInicio: b.horaInicio, horaFin: b.horaFin, disponible: b.tipo === "LIBRE" })),
  };
}

// ---------- Citas: consultas y acciones ----------
export const citasDelDia = (fecha) => ({
  citas: CITAS.filter((c) => c.fecha === fecha).sort(porFechaHora).map(vista),
  totalVeterinarios: VETS.length,
});
export const citasSolicitadas = () => ({
  citas: CITAS.filter((c) => c.estado === "SOLICITADA" && c.fecha >= HOY).sort(porFechaHora).map(vista),
});
export const citasReprogramables = () => ({
  citas: CITAS.filter((c) => ["SOLICITADA", "CONFIRMADA"].includes(c.estado) && !c.esEmergencia && c.fecha >= HOY)
    .sort(porFechaHora).map(vista),
});
export function obtenerCita(id) {
  const c = CITAS.find((x) => x.id === id);
  if (!c) throw new ErrorApi("No encontramos esa cita.", 404);
  return { cita: vista(c) };
}
const buscar = (id) => {
  const c = CITAS.find((x) => x.id === id);
  if (!c) throw new ErrorApi("No encontramos esa cita.", 404);
  return c;
};
const anotar = (c, titulo, detalle) => c.historial.push({ titulo, detalle, fecha: ahoraISO() });
const POR = `${RECEPCIONISTA.nombreCompleto} (recepción)`;

export function confirmarCita(id) {
  const c = buscar(id);
  if (c.estado !== "SOLICITADA") throw new ErrorApi("Solo se pueden confirmar citas solicitadas.", 409);
  c.estado = "CONFIRMADA";
  anotar(c, "Confirmada", POR);
  return { cita: vista(c) };
}
export function cancelarCita(id, motivo) {
  const c = buscar(id);
  if (c.esEmergencia) throw new ErrorApi("Las emergencias no se pueden cancelar.", 409);
  if (!["SOLICITADA", "CONFIRMADA"].includes(c.estado)) throw new ErrorApi("Esta cita ya no se puede cancelar.", 409);
  if (!motivo || motivo.trim().length < 5) throw new ErrorApi("Escribe el motivo (mínimo 5 caracteres).", 400);
  c.estado = "CANCELADA"; // 505 exige motivo_cancelacion (chk_cita_cancel)
  c.motivoCancelacion = motivo.trim();
  anotar(c, "Cancelada", `${POR} · ${motivo.trim()}`);
  return { cita: vista(c) };
}
export function reprogramarCita(id, { veterinarioId, fecha, horaInicio, motivo }) {
  const c = buscar(id);
  if (c.esEmergencia) throw new ErrorApi("Las emergencias no se reprograman.", 409);
  if (celda(vetPorId(veterinarioId), fecha, horaInicio).tipo !== "LIBRE") throw new ErrorApi("Ese bloque ya no está disponible. Elige otro.", 409);
  Object.assign(c, { veterinarioId, fecha, horaInicio, horaFin: sig(horaInicio) });
  anotar(c, "Reprogramada", `${POR} · ${motivo}`);
  return { cita: vista(c) };
}
export function crearCita({ veterinarioId, fecha, horaInicio, mascotaId, motivoConsulta }) {
  if (celda(vetPorId(veterinarioId), fecha, horaInicio).tipo !== "LIBRE") throw new ErrorApi("Ese bloque ya no está disponible.", 409);
  const c = cita(`c${++seq}`, mascotaId, veterinarioId, 0, horaInicio, motivoConsulta, "CONFIRMADA", {
    fecha, creadaPor: "RECEPCIONISTA", solicitadaEl: ahoraISO(),
    historial: [{ titulo: "Confirmada", detalle: `${POR} · cita agendada en recepción`, fecha: ahoraISO() }],
  });
  CITAS.push(c);
  return { cita: vista(c) };
}
// Las emergencias nacen ya en curso (no pasan por confirmación)
export function crearEmergencia({ veterinarioId, mascotaId, motivoConsulta }) {
  const v = vetPorId(veterinarioId);
  const ahora = horaAhora().slice(0, 2) + ":00";
  const ultima = `${String(Number(v.horaFin.slice(0, 2)) - 1).padStart(2, "0")}:00`;
  const hora = ahora < v.horaInicio ? v.horaInicio : ahora > ultima ? ultima : ahora;
  const c = cita(`c${++seq}`, mascotaId, veterinarioId, 0, hora, motivoConsulta, "ATENCION", {
    esEmergencia: true, enConsultaDesde: horaAhora(), creadaPor: "RECEPCIONISTA", solicitadaEl: ahoraISO(),
  });
  CITAS.push(c);
  return { cita: vista(c) };
}

// ---------- Propietarios ----------
const mascotasDe = (pid) => MASCOTAS.filter((m) => m.propietarioId === pid);
export const listarPropietarios = () => ({
  propietarios: PROPIETARIOS.map((p) => ({ ...p, totalMascotas: mascotasDe(p.id).length, codigosMascotas: mascotasDe(p.id).map((m) => m.codigoUnico) })),
});
export function obtenerPropietario(id) {
  const p = propPorId(id);
  if (!p) throw new ErrorApi("No encontramos a ese propietario.", 404);
  return { propietario: p, mascotas: mascotasDe(id) };
}
function validarUnicos({ cedula, telefono, correo }, ignorarId) {
  const otros = PROPIETARIOS.filter((p) => p.id !== ignorarId);
  if (cedula && otros.some((p) => p.cedula && normalizarCedula(p.cedula) === normalizarCedula(cedula))) throw new ErrorApi("Esa cédula ya está registrada.", 409);
  if (telefono && otros.some((p) => normalizarTelefono(p.telefono) === normalizarTelefono(telefono))) throw new ErrorApi("Ese teléfono ya está registrado.", 409);
  if (correo && otros.some((p) => p.correo === correo)) throw new ErrorApi("Ese correo ya está registrado.", 409);
}
export function actualizarPropietario(id, datos) {
  const p = propPorId(id);
  if (!p) throw new ErrorApi("No encontramos a ese propietario.", 404);
  if (p.estado === "ACTIVO") throw new ErrorApi("La cuenta ya está activa: solo el propietario puede cambiar sus datos.", 403);
  validarUnicos(datos, id);
  Object.assign(p, datos);
  return { propietario: p };
}
export function reenviarCodigo(id) {
  const p = propPorId(id);
  if (!p?.correo) throw new ErrorApi("Agrega un correo para poder enviar el código de activación.", 400);
  return { enviadoA: p.correo };
}
function crearMascota(propietario, m) {
  const especie = ESPECIES.find((e) => String(e.id) === String(m.especieId));
  const raza = (RAZAS[m.especieId] ?? []).find((_, i) => Number(m.especieId) * 100 + i + 1 === Number(m.razaId));
  const nueva = {
    id: `m${++seq}`,
    codigoUnico: `PET-${1000 + Math.floor(Math.random() * 9000)}-${iniciales(propietario.nombreCompleto)}`,
    nombre: m.nombre.trim(), especie: ALIAS[especie?.nombre] ?? especie?.nombre ?? "Otro", raza: raza ?? "Mestizo",
    sexo: m.sexo, edadActualMeses: m.unidadEdad === "ANIOS" ? Number(m.edad) * 12 : Number(m.edad), propietarioId: propietario.id,
  };
  MASCOTAS.push(nueva);
  return nueva;
}
// tipo "PROPIETARIO" -> queda PENDIENTE (recibe código); "OTRA" -> PROVISIONAL (sin credenciales)
export function registrarPropietario({ tipo, propietario, mascota }) {
  validarUnicos(propietario);
  const p = { id: `p${++seq}`, direccion: "", ...propietario, estado: tipo === "PROPIETARIO" ? "PENDIENTE" : "PROVISIONAL" };
  PROPIETARIOS.push(p);
  return { propietario: p, mascota: crearMascota(p, mascota) };
}

// ---------- Mascotas ----------
export const listarMascotas = () => ({
  mascotas: MASCOTAS.map((m) => ({ ...m, propietario: refPropietario(propPorId(m.propietarioId)) })),
});
export function obtenerMascota(id) {
  const m = mascPorId(id);
  if (!m) throw new ErrorApi("No encontramos esa mascota.", 404);
  return {
    mascota: m, propietario: refPropietario(propPorId(m.propietarioId)),
    citas: CITAS.filter((c) => c.mascotaId === id).sort((a, b) => porFechaHora(b, a)).map(vista),
  };
}
export function registrarMascota(propietarioId, datos) {
  const p = propPorId(propietarioId);
  if (!p) throw new ErrorApi("Elige un propietario válido.", 404);
  return { mascota: crearMascota(p, datos) };
}


// ===========================================================================
// VETERINARIO (Agenda propia, Atención de hoy y consultas)
// Estas funciones ya devuelven la MISMA forma que mandará el backend,
// así lib/mock.js solo las llama (no tiene que traducir nada).
// ===========================================================================

// "08:00" -> "08:00:00" (MySQL manda las horas TIME con segundos)
const s = (h) => (h.length === 5 ? `${h}:00` : h);
// 0 = domingo, 1 = lunes ... 6 = sábado
const diaSemana = (fecha) => new Date(`${fecha}T00:00:00`).getDay();

// Tabla consultas (+ signos, hallazgos, diagnóstico, receta). Una consulta siempre sale de una cita.
// fin: null = la consulta sigue abierta ("En curso")
const consulta = (id, citaId, x = {}) => ({
  id, citaId, inicio: null, fin: null, signos: null, observaciones: "", hallazgos: [],
  diagnostico: null, tratamiento: "", receta: [], examenes: [], control: null, ...x,
});
const CONSULTAS = [
  consulta("co1", "c22", {
    inicio: `${habil(-1)}T08:10`, fin: `${habil(-1)}T08:35`,
    signos: { pesoKg: 14.2, temperatura: 38.4, frecuenciaCardiaca: 96 },
    diagnostico: "Sano", tratamiento: "Antirrábica aplicada.",
  }),
  consulta("co2", "c23", {
    inicio: `${habil(-1)}T10:05`, fin: `${habil(-1)}T10:40`,
    signos: { pesoKg: 4.1, temperatura: 38.9, frecuenciaCardiaca: 150 },
    hallazgos: ["Cerumen oscuro y enrojecimiento en el oído izquierdo."],
    diagnostico: "Otitis externa",
    receta: [{ medicamento: "Otomax gotas óticas", indicaciones: "5 gotas en el oído izquierdo c/12 h × 7 días" }],
  }),
  consulta("co3", "c21", {
    inicio: `${HOY}T08:02`, fin: `${HOY}T08:40`,
    signos: { pesoKg: 38.5, temperatura: 38.5, frecuenciaCardiaca: 90 },
    diagnostico: "Sano", control: { fecha: d(30), hora: "08:00" },
  }),
  consulta("co4", "c20", {
    inicio: `${HOY}T09:04`,
    signos: { pesoKg: 6.4, temperatura: 38.6, frecuenciaCardiaca: 110 },
    observaciones: "Paciente alerta, buen apetito según la propietaria.",
    hallazgos: ["Herida quirúrgica cicatrizando bien, sin secreción.", "Leve enrojecimiento en el borde inferior de la sutura."],
  }),
];
const consultaDeCita = (citaId) => CONSULTAS.find((co) => co.citaId === citaId);

// Lo que todavía le falta a una consulta abierta (para el aviso "faltan diagnóstico y receta")
function faltantes(co) {
  const faltan = [];
  if (!co.signos) faltan.push("signos");
  if (!co.diagnostico) faltan.push("diagnóstico");
  if (co.receta.length === 0) faltan.push("receta");
  return faltan;
}

// Una cita con la forma que necesitan las pantallas del veterinario
function citaVet(c) {
  const m = mascPorId(c.mascotaId);
  const p = propPorId(m.propietarioId);
  const co = consultaDeCita(c.id);
  return {
    id: c.id,
    fecha: c.fecha,
    horaInicio: s(c.horaInicio),
    horaFin: s(c.horaFin),
    estadoId: ID_ESTADO_CITA[c.estado],
    esEmergencia: c.esEmergencia,
    prioridad: c.prioridad,
    personaPresentador: c.personaPresentador,
    registradaA: c.solicitadaEl.slice(11, 16),
    motivo: c.motivoConsulta,
    mascota: {
      id: m.id, nombre: m.nombre, codigoUnico: m.codigoUnico,
      especie: m.especie, raza: m.raza, edad: formatearEdad(m.edadActualMeses),
    },
    propietario: { id: p.id, nombreCompleto: p.nombreCompleto, telefono: p.telefono },
    // null = el veterinario todavía no abre la consulta de esta cita
    consulta: co
      ? {
          id: co.id,
          iniciadaA: co.inicio.slice(11, 16),
          finalizada: Boolean(co.fin),
          faltan: faltantes(co),
          diagnostico: co.diagnostico,
          control: co.control,
        }
      : null,
  };
}

// Horario de un día: entre semana con almuerzo; sábado solo hasta sabadoHasta; domingo no atiende
function horarioDelDia(v, fecha) {
  const dia = diaSemana(fecha);
  if (dia === 0) return { horario: [], bloqueos: [] };
  const fin = dia === 6 ? v.sabadoHasta ?? v.horaFin : v.horaFin;
  const bloqueos = v.almuerzo < fin
    ? [{ horaInicio: s(v.almuerzo), horaFin: s(sig(v.almuerzo)), motivo: "Almuerzo" }]
    : [];
  return { horario: [{ inicio: s(v.horaInicio), fin: s(fin) }], bloqueos };
}

// GET /clinica/mi-agenda?desde=&hasta=  → un "día" por fecha, cada uno con horario, bloqueos y citas
export function miAgenda(personalId, desde, hasta) {
  const v = vetPorId(personalId);
  if (!v) throw new ErrorApi("No encontramos tu perfil de veterinario.", 404);
  if (!desde || !hasta || desde > hasta) throw new ErrorApi("El rango de fechas no es válido.", 400);

  const dias = [];
  for (let fecha = desde; fecha <= hasta; fecha = sumarDias(fecha, 1)) {
    const { horario, bloqueos } = horarioDelDia(v, fecha);
    dias.push({
      fecha,
      horario,
      bloqueos: [
        ...bloqueos,
        ...BLOQUEOS.filter((b) => b.vetId === v.id && b.fecha === fecha)
          .map((b) => ({ horaInicio: s(b.hora), horaFin: s(sig(b.hora)), motivo: b.motivo })),
      ],
      citas: CITAS.filter((c) => c.veterinarioId === v.id && c.fecha === fecha && activa(c))
        .sort(porFechaHora)
        .map(citaVet),
    });
  }
  return { desde, hasta, duracionBloqueMin: CLINICA.duracionCitaMin, dias };
}

// GET /clinica/atencion/hoy → todas las citas de HOY del veterinario (la pantalla las agrupa)
export function atencionHoy(personalId) {
  const v = vetPorId(personalId);
  if (!v) throw new ErrorApi("No encontramos tu perfil de veterinario.", 404);
  return {
    fecha: HOY,
    citas: CITAS.filter((c) => c.veterinarioId === v.id && c.fecha === HOY && activa(c))
      .sort(porFechaHora)
      .map(citaVet),
  };
}

// POST /clinica/consultas { citaId } → abre la consulta y la cita pasa a "En curso" (503)
export function iniciarConsulta(personalId, citaId) {
  const c = buscar(citaId);
  const v = vetPorId(personalId);
  if (c.veterinarioId !== personalId) throw new ErrorApi("Esta cita no es tuya.", 403);

  // Si ya existe (doble clic, o la abrió en otra pestaña) devolvemos la misma
  const existente = consultaDeCita(c.id);
  if (existente) return { consultaId: existente.id };

  if (c.fecha !== HOY) throw new ErrorApi("Solo puedes iniciar consultas de hoy.", 409);
  if (c.estado === "SOLICITADA") throw new ErrorApi("Recepción aún no confirma esta cita.", 409);
  const sePuede = c.estado === "CONFIRMADA" || (c.esEmergencia && c.estado === "ATENCION");
  if (!sePuede) throw new ErrorApi("Esta cita ya no se puede atender.", 409);

  const nueva = consulta(`co${++seq}`, c.id, { inicio: ahoraISO() });
  CONSULTAS.push(nueva);
  c.estado = "ATENCION";
  c.enConsultaDesde = c.enConsultaDesde ?? horaAhora();
  anotar(c, "En curso", `${v.nombreCompleto} inició la consulta`);
  return { consultaId: nueva.id };
}
