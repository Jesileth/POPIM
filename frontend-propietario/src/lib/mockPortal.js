const DIAS = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];

// colocamos los Nombres tal como están en Catalogo_estados
const ESTADOS = {
  SOLICITADA: { codigo: "SOLICITADA", nombre: "Solicitada" },
  CONFIRMADA: { codigo: "CONFIRMADA", nombre: "Confirmada" },
  ATENCION: { codigo: "ATENCION", nombre: "En Curso" },
  COMPLETADA: { codigo: "COMPLETADA", nombre: "Atención Finalizada" },
  CANCELADA: { codigo: "CANCELADA", nombre: "Cancelada" },
};

const ok = (datos, estado = 200) => ({ ok: true, estado, datos });
const fallo = (estado, error) => ({ ok: false, estado, error });

const iso = (fecha) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
const enDias = (n) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + n);
  return iso(fecha);
};
const aMinutos = (hora) => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};
const deMinutos = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const horario = (dias, horaInicio, horaFin) =>
  dias.map((diaSemana) => ({ diaSemana, horaInicio, horaFin }));

const SESION = {
  usuario: { id: "u1", nombreCompleto: "Propietario de Prueba", rol: "PROPIETARIO", fotoPerfilUrl: null },
  // Lo que devolvería la vista v_menu_usuario
  menu: [
    { id: 1, etiqueta: "Mis mascotas", ruta: "/mis-mascotas", icono: "paw", orden: 1 },
    { id: 2, etiqueta: "Solicitar cita", ruta: "/solicitar-cita", icono: "calendar-plus", orden: 2 },
    { id: 3, etiqueta: "Mis citas", ruta: "/mis-citas", icono: "calendar-check", orden: 3 },
  ],
  // Lo que devolvería la vista v_permisos_usuario
  permisos: ["MASCOTAS_VER", "MASCOTAS_REGISTRAR", "CITAS_VER", "CITAS_SOLICITAR", "CITAS_CANCELAR"],
};

const MASCOTAS = [
  {
    id: "m1",
    codigoUnico: "PET-4482-KX",
    nombre: "Pelusa",
    especie: { id: 1, nombre: "Canino" },
    raza: { id: 4, nombre: "Mestizo" },
    sexo: "HEMBRA",
    edadActualMeses: 26,
    fotoUrl: null,
  },
  {
    id: "m2",
    codigoUnico: "PET-1190-QW",
    nombre: "Molly",
    especie: { id: 2, nombre: "Felino" },
    raza: { id: 40, nombre: "Angora" }, // 
    sexo: "MACHO",
    edadActualMeses: 8,
    fotoUrl: null,
  },
];

const CLINICAS = [
  { id: "c1", nombreComercial: "POPIM Central - Managua", direccion: "Km 5 Carretera Masaya, Managua", duracionCitaMin: 60 },
  { id: "c2", nombreComercial: "POPIM Altamira - Managua", direccion: "Altamira D'Este, Managua", duracionCitaMin: 60 },
];

const VETERINARIOS = [
  {
    id: "v1",
    clinicaId: "c1",
    nombreCompleto: "Dra. Mariana Rojas",
    especialidad: "Medicina general",
    presentacion: "Atención integral de perros y gatos.",
    horarios: horario(["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"], "08:00", "16:00"),
  },
  {
    id: "v2",
    clinicaId: "c1",
    nombreCompleto: "Dr. Julián López",
    especialidad: "Dermatología",
    presentacion: "Problemas de piel, alergias y pelaje.",
    horarios: horario(["MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"], "10:00", "18:00"),
  },
  {
    id: "v3",
    clinicaId: "c1",
    nombreCompleto: "Dra. Carla Sequeira",
    especialidad: "Cirugía menor",
    presentacion: null,
    horarios: horario(["LUNES", "MARTES", "MIERCOLES", "JUEVES"], "09:00", "15:00"),
  },
  {
    id: "v4",
    clinicaId: "c2",
    nombreCompleto: "Dr. Luis Mendoza",
    especialidad: "Cirugía general",
    presentacion: null,
    horarios: horario(["LUNES", "MIERCOLES", "VIERNES"], "08:00", "12:00"),
  },
];

const refMascota = (id) => {
  const { nombre, codigoUnico } = MASCOTAS.find((m) => m.id === id);
  return { id, nombre, codigoUnico };
};
const refVeterinario = (id) => {
  const { nombreCompleto, especialidad } = VETERINARIOS.find((v) => v.id === id);
  return { id, nombreCompleto, especialidad };
};
const refClinica = (id) => {
  const { nombreComercial, direccion } = CLINICAS.find((c) => c.id === id);
  return { id, nombreComercial, direccion };
};

const CITAS = [
  {
    id: "ci1",
    fecha: enDias(3),
    horaInicio: "09:00",
    horaFin: "10:00",
    motivoConsulta: "Control general y vacuna anual",
    estado: ESTADOS.CONFIRMADA,
    motivoCancelacion: null,
    mascota: refMascota("m1"),
    veterinario: refVeterinario("v1"),
    clinica: refClinica("c1"),
  },
  {
    id: "ci2",
    fecha: enDias(-20),
    horaInicio: "10:00",
    horaFin: "11:00",
    motivoConsulta: "Revisión de la piel",
    estado: ESTADOS.COMPLETADA,
    motivoCancelacion: null,
    mascota: refMascota("m2"),
    veterinario: refVeterinario("v2"),
    clinica: refClinica("c1"),
  },
  {
    id: "ci3",
    fecha: enDias(-8),
    horaInicio: "11:00",
    horaFin: "12:00",
    motivoConsulta: "Desparasitación",
    estado: ESTADOS.CANCELADA,
    motivoCancelacion: "No podré asistir ese día",
    mascota: refMascota("m1"),
    veterinario: refVeterinario("v1"),
    clinica: refClinica("c1"),
  },
];

// Bloques = horario del veterinario − citas activas (no se guardan en la base de datos)
function calcularBloques(veterinarioId, fecha) {
  const vet = VETERINARIOS.find((v) => v.id === veterinarioId);
  if (!vet || !fecha) return [];
  const clinica = CLINICAS.find((c) => c.id === vet.clinicaId);
  const dia = DIAS[new Date(`${fecha}T00:00:00`).getDay()];
  const ahora = new Date();
  const esHoy = fecha === iso(ahora);
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const bloques = [];

  for (const h of vet.horarios.filter((x) => x.diaSemana === dia)) {
    for (
      let t = aMinutos(h.horaInicio);
      t + clinica.duracionCitaMin <= aMinutos(h.horaFin);
      t += clinica.duracionCitaMin
    ) {
      const horaInicio = deMinutos(t);
      const ocupado = CITAS.some(
        (c) =>
          c.veterinario.id === veterinarioId &&
          c.fecha === fecha &&
          c.horaInicio === horaInicio &&
          c.estado.codigo !== "CANCELADA",
      );
      bloques.push({
        horaInicio,
        horaFin: deMinutos(t + clinica.duracionCitaMin),
        disponible: !ocupado && !(esHoy && t <= minutosAhora),
      });
    }
  }
  return bloques;
}

// Devuelve una respuesta simulada, o null si la ruta no es del portal
export function simularPortal(ruta, metodo, cuerpo) {
  const [camino, consulta = ""] = ruta.split("?");
  const parametros = new URLSearchParams(consulta);

  if (camino === "/auth/sesion") return ok(SESION);
  if (camino === "/auth/logout") return ok({});
  if (camino === "/mascotas" && metodo === "GET") return ok({ mascotas: MASCOTAS });
  if (camino === "/clinicas") return ok({ clinicas: CLINICAS });

  let coincide = camino.match(/^\/clinicas\/([^/]+)\/veterinarios$/);
  if (coincide) {
    return ok({ veterinarios: VETERINARIOS.filter((v) => v.clinicaId === coincide[1]) });
  }

  coincide = camino.match(/^\/veterinarios\/([^/]+)\/disponibilidad$/);
  if (coincide) {
    const fecha = parametros.get("fecha");
    return ok({ fecha, bloques: calcularBloques(coincide[1], fecha) });
  }

  if (camino === "/citas" && metodo === "GET") return ok({ citas: CITAS });

  if (camino === "/citas" && metodo === "POST") {
    const bloque = calcularBloques(cuerpo.veterinarioId, cuerpo.fecha).find(
      (b) => b.horaInicio === cuerpo.horaInicio,
    );
    if (!bloque) return fallo(400, "Ese horario no existe para el veterinario elegido.");
    if (!bloque.disponible) return fallo(409, "Ese horario acaba de ser reservado. Elige otro.");

    const vet = VETERINARIOS.find((v) => v.id === cuerpo.veterinarioId);
    const cita = {
      id: `ci${CITAS.length + 1}`,
      fecha: cuerpo.fecha,
      horaInicio: bloque.horaInicio,
      horaFin: bloque.horaFin,
      motivoConsulta: cuerpo.motivoConsulta,
      estado: ESTADOS.SOLICITADA, // toda cita nueva nace Solicitada (501)
      motivoCancelacion: null,
      mascota: refMascota(cuerpo.mascotaId),
      veterinario: refVeterinario(cuerpo.veterinarioId),
      clinica: refClinica(vet.clinicaId),
    };
    CITAS.push(cita);
    return ok({ cita }, 201);
  }

  coincide = camino.match(/^\/citas\/([^/]+)\/cancelar$/);
  if (coincide && metodo === "POST") {
    const cita = CITAS.find((c) => c.id === coincide[1]);
    if (!cita) return fallo(404, "No encontramos esa cita.");
    if (!["SOLICITADA", "CONFIRMADA"].includes(cita.estado.codigo)) {
      return fallo(409, "Esta cita ya no se puede cancelar.");
    }
    cita.estado = ESTADOS.CANCELADA;
    cita.motivoCancelacion = cuerpo.motivoCancelacion;
    return ok({ cita });
  }

  return null;
}