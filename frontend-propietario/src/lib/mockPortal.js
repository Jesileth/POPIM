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

export const MASCOTAS = [
  {
    id: "m1",
    codigoUnico: "PET-4482-KX",
    nombre: "Popim",
    especie: { id: 1, nombre: "Canino" },
    raza: { id: 4, nombre: "Mestizo" },
    sexo: "MACHO",
    edadActualMeses: 26,
    fotoUrl: null,
  },
  {
    id: "m2",
    codigoUnico: "PET-1190-QW",
    nombre: "Molly",
    especie: { id: 2, nombre: "Felino" },
    raza: { id: 40, nombre: "Angora" }, // 
    sexo: "HEMBRA",
    edadActualMeses: 8,
    fotoUrl: null,
  },
];

export const CLINICAS = [
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
    consultaId: "k1",
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

const hace = (dias, hora = "10:00:00") => `${enDias(-dias)}T${hora}`;

const DOSIS = {
  PENDIENTE: { codigo: "PENDIENTE", nombre: "Pendiente" },
  APLICADA: { codigo: "APLICADA", nombre: "Aplicada" },
  VENCIDA: { codigo: "VENCIDA", nombre: "Vencida" },
};

const DETALLES_MASCOTA = {
  m1: { fechaNacimiento: null, fechaRegistro: hace(400, "09:00:00") },
  m2: { fechaNacimiento: enDias(-240), fechaRegistro: hace(240, "09:00:00") },
};

// Cartillas + Dosis_preventivas (la dosis vencida es la que el backend marca con el estado 603)
const CARTILLAS = {
  m1: [
    { id: "dp1", producto: { id: 1, tipo: "VACUNA", nombre: "Antirrábica" }, fechaProgramada: enDias(-200), fechaAplicada: enDias(-200), estado: DOSIS.APLICADA, lote: "RB-2231", observaciones: null, aplicadaPor: "Dra. Mariana Rojas", clinicaId: "c1"},
    { id: "dp2", producto: { id: 2, tipo: "VACUNA", nombre: "Parvovirus" }, fechaProgramada: enDias(-120), fechaAplicada: enDias(-120), estado: DOSIS.APLICADA, lote: "PV-1180", observaciones: null, aplicadaPor: "Dra. Mariana Rojas", clinicaId: "c1" },
    { id: "dp3", producto: { id: 1, tipo: "VACUNA", nombre: "Antirrábica" }, fechaProgramada: enDias(165), fechaAplicada: null, estado: DOSIS.PENDIENTE, lote: null, observaciones: "Refuerzo anual", aplicadaPor: null },
    { id: "dp4", producto: { id: 4, tipo: "DESPARASITANTE", nombre: "Desparasitante interno" }, fechaProgramada: enDias(-15), fechaAplicada: null, estado: DOSIS.VENCIDA, lote: null, observaciones: null, aplicadaPor: null },
    { id: "dp5", producto: { id: 5, tipo: "DESPARASITANTE", nombre: "Desparasitante externo" }, fechaProgramada: enDias(2), fechaAplicada: null, estado: DOSIS.PENDIENTE, lote: null, observaciones: null, aplicadaPor: null },
    { id: "dp6", producto: { id: 6, tipo: "DESPARASITANTE", nombre: "Desparasitante interno" }, fechaProgramada: enDias(0), fechaAplicada: enDias(0), estado: DOSIS.APLICADA, lote: "DI-0455-89", observaciones: null, aplicadaPor: "Dr. Julián López", clinicaId: "c2" },
  ],
  m2: [
    { id: "dp11", producto: { id: 3, tipo: "VACUNA", nombre: "Triple felina" }, fechaProgramada: enDias(-100), fechaAplicada: enDias(-100), estado: DOSIS.APLICADA, lote: "TF-0902", observaciones: null, aplicadaPor: "Dra. Mariana Rojas" },
    { id: "dp12", producto: { id: 4, tipo: "DESPARASITANTE", nombre: "Desparasitante interno" }, fechaProgramada: enDias(-20), fechaAplicada: enDias(-20), estado: DOSIS.APLICADA, lote: "DI-0455", observaciones: null, aplicadaPor: "Dr. Julián López" },
    { id: "dp13", producto: { id: 3, tipo: "VACUNA", nombre: "Triple felina" }, fechaProgramada: enDias(20), fechaAplicada: null, estado: DOSIS.PENDIENTE, lote: null, observaciones: "Refuerzo", aplicadaPor: null },
  ],
};

// Resultados_examen (consultaId null = resultado del historial general, REQ-018)
const EXAMENES = [
  { id: "e1", mascotaId: "m2", consultaId: "k1", tipoExamen: { id: 1, nombre: "Hemograma" }, nombreOriginal: "hemograma-michi.pdf", mimeType: "application/pdf", tamanoBytes: 184320, fechaCarga: hace(20, "11:30:00") },
  { id: "e2", mascotaId: "m1", consultaId: "k2", tipoExamen: { id: 3, nombre: "Radiografía" }, nombreOriginal: "radiografia-abdomen-pelusa.jpg", mimeType: "image/jpeg", tamanoBytes: 2411724, fechaCarga: hace(60, "21:10:00") },
  { id: "e3", mascotaId: "m1", consultaId: null, tipoExamen: { id: 5, nombre: "Coproparasitológico" }, nombreOriginal: "coproparasitologico.pdf", mimeType: "application/pdf", tamanoBytes: 96000, fechaCarga: hace(120, "09:15:00") },
];

const CONSULTAS = [
  {
    id: "k1",
    mascotaId: "m2",
    citaId: "ci2",
    fechaInicio: hace(20, "10:05:00"),
    fechaCierre: hace(20, "10:50:00"),
    esEmergencia: false,
    prioridad: "NORMAL",
    observacionesGenerales: "Piel con irritación leve en el abdomen. Evitar cambios bruscos de alimento mientras dure el tratamiento.",
    pesoKg: "4.20",
    temperaturaC: "38.6",
    frecuenciaCardiaca: 140,
    veterinario: { id: "v2", nombreCompleto: "Dr. Julián López", especialidad: "Dermatología", numeroLicencia: "VET-2231" },
    clinica: refClinica("c1"),
    hallazgos: [{ id: "h1", descripcion: "Enrojecimiento y descamación en la zona abdominal.", fecha: hace(20, "10:20:00") }],
    diagnosticos: [
      { id: "d1", padecimiento: { id: 12, codigo: "DER-004", nombre: "Dermatitis alérgica", clasificacion: "Dermatológico" }, descripcion: "Probable alergia alimentaria.", fecha: hace(20, "10:35:00") },
    ],
    tratamientos: [
      { id: "t1", diagnosticoId: "d1", descripcion: "Baños medicados dos veces por semana.", fechaInicio: enDias(-20), duracionDias: 14, indicaciones: "Dejar actuar el shampoo 10 minutos y secar bien el pelaje." },
      { id: "t2", diagnosticoId: "d1", descripcion: "Dieta hipoalergénica.", fechaInicio: enDias(-20), duracionDias: 60, indicaciones: "No ofrecer premios ni comida casera durante el tratamiento." },
    ],
    receta: {
      id: "r1",
      fecha: hace(20, "10:45:00"),
      observaciones: "Administrar con alimento. Si hay vómitos, suspender y avisar a la clínica.",
      items: [
        { id: 1, medicamento: { id: 3, nombre: "Prednisolona", presentacion: "Tabletas 5 mg" }, dosis: "1/2 tableta", frecuencia: "Cada 12 horas", duracionDias: 7 },
        { id: 2, medicamento: { id: 9, nombre: "Shampoo de clorhexidina", presentacion: "Frasco 250 ml" }, dosis: "Aplicar y dejar 10 minutos", frecuencia: "2 veces por semana", duracionDias: 14 },
      ],
    },
    dosisAplicadas: [
      { id: "dp12", producto: { id: 4, tipo: "DESPARASITANTE", nombre: "Desparasitante interno" }, fechaAplicada: enDias(-20), lote: "DI-0455" },
    ],
  },
  {
    id: "k2",
    mascotaId: "m1",
    citaId: null, // emergencia sin cita previa
    fechaInicio: hace(60, "20:40:00"),
    fechaCierre: hace(60, "22:00:00"),
    esEmergencia: true,
    prioridad: "URGENTE",
    observacionesGenerales: "Llegó con vómitos repetidos desde la tarde. Se estabilizó en la clínica.",
    pesoKg: "24.80",
    temperaturaC: "39.4",
    frecuenciaCardiaca: 120,
    veterinario: null, // Consultas no guarda veterinario ni clínica cuando no hay cita
    clinica: null,
    hallazgos: [{ id: "h2", descripcion: "Abdomen sensible y deshidratación leve.", fecha: hace(60, "21:00:00") }],
    diagnosticos: [
      { id: "d2", padecimiento: { id: 31, codigo: "DIG-002", nombre: "Gastroenteritis aguda", clasificacion: "Digestivo" }, descripcion: null, fecha: hace(60, "21:30:00") },
    ],
    tratamientos: [
      { id: "t3", diagnosticoId: "d2", descripcion: "Fluidoterapia y reposo digestivo.", fechaInicio: enDias(-60), duracionDias: 3, indicaciones: "Dieta blanda en porciones pequeñas." },
    ],
    receta: {
      id: "r2",
      fecha: hace(60, "21:50:00"),
      observaciones: null,
      items: [
        { id: 3, medicamento: { id: 8, nombre: "Omeprazol", presentacion: "Cápsulas 20 mg" }, dosis: "1 cápsula", frecuencia: "Una vez al día", duracionDias: 5 },
      ],
    },
    dosisAplicadas: [],
  },
];

function resumirConsulta(c) {
  const cita = CITAS.find((x) => x.id === c.citaId);
  return {
    id: c.id,
    fechaInicio: c.fechaInicio,
    esEmergencia: c.esEmergencia,
    prioridad: c.prioridad,
    motivo: cita ? cita.motivoConsulta : null,
    veterinario: c.veterinario
      ? { nombreCompleto: c.veterinario.nombreCompleto, especialidad: c.veterinario.especialidad }
      : null,
    totalDiagnosticos: c.diagnosticos.length,
    tieneReceta: Boolean(c.receta),
    totalExamenes: EXAMENES.filter((e) => e.consultaId === c.id).length,
  };
}

function detalleConsulta(c) {
  const { citaId, mascotaId, ...resto } = c;
  const cita = CITAS.find((x) => x.id === citaId);
  return {
    ...resto,
    mascota: MASCOTAS.find((m) => m.id === mascotaId),
    cita: cita ? { id: cita.id, motivoConsulta: cita.motivoConsulta } : null,
    examenes: EXAMENES.filter((e) => e.consultaId === c.id),
  };
}


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

      coincide = camino.match(/^\/mascotas\/([^/]+)$/);
  if (coincide && metodo === "GET") {
    const mascota = MASCOTAS.find((m) => m.id === coincide[1]);
    if (!mascota) return fallo(404, "No encontramos esa mascota.");
    return ok({ mascota: { ...mascota, ...DETALLES_MASCOTA[mascota.id] } });
  }

  coincide = camino.match(/^\/mascotas\/([^/]+)\/cartilla$/);
  if (coincide) return ok({ dosis: CARTILLAS[coincide[1]] ?? [] });

  coincide = camino.match(/^\/mascotas\/([^/]+)\/consultas$/);
  if (coincide) {
    const consultas = CONSULTAS.filter((c) => c.mascotaId === coincide[1])
      .map(resumirConsulta)
      .sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio));
    return ok({ consultas });
  }

  coincide = camino.match(/^\/mascotas\/([^/]+)\/examenes$/);
  if (coincide) {
    return ok({ examenes: EXAMENES.filter((e) => e.mascotaId === coincide[1]) });
  }

  coincide = camino.match(/^\/consultas\/([^/]+)$/);
  if (coincide) {
    const consulta = CONSULTAS.find((c) => c.id === coincide[1]);
    return consulta ? ok({ consulta: detalleConsulta(consulta) }) : fallo(404, "No encontramos esa consulta.");
  }


  return null;
}