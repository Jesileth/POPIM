

// Datos falsos del portal de clínica: solo se usan mientras NEXT_PUBLIC_USAR_MOCK no sea "false".
// Devuelve siempre la misma forma que api.js: { ok, estado, datos } o { ok: false, estado, error, campo }

// Usuario de prueba para iniciar sesión
const USUARIO_PRUEBA = {
  correo: "recepcion@prueba.popim",
  telefono: "88880000",
  password: "Prueba123",
};

// Lo que devolvería GET /auth/sesion para una recepcionista
const SESION_PRUEBA = {
  usuario: {
    id: "u-recep-1",
    nombreCompleto: "Recepcionista de prueba",
    rol: "RECEPCIONISTA",
    fotoUrl: null,
    clinica: { id: "c-1", nombreComercial: "Clínica de prueba", logoUrl: null },
  },
  permisos: [
    "AGENDA_VER", "AGENDA_VER_TODOS", "CITAS_AGENDAR", "CITAS_EMERGENCIA_REGISTRAR",
    "RECEPCION_VER", "PROPIETARIOS_VER", "PROPIETARIOS_REGISTRAR", "PROPIETARIOS_EDITAR",
    "MASCOTAS_CLINICA_VER", "MASCOTAS_CLINICA_REGISTRAR",
    "CITAS_CONFIRMAR", "CITAS_REPROGRAMAR", "CITAS_CANCELAR_CLINICA",
    "PERFIL_VER", "PERFIL_EDITAR",
  ],
  // Igual que la vista v_menu_usuario: padreId null = opción principal
  menu: [
    { id: 1, padreId: null, etiqueta: "Agenda", ruta: "/agenda", icono: "agenda", orden: 1 },
    { id: 2, padreId: null, etiqueta: "Recepción de hoy", ruta: "/recepcion", icono: "tablero", orden: 2 },
    { id: 3, padreId: null, etiqueta: "Propietarios", ruta: null, icono: "personas", orden: 3 },
    { id: 4, padreId: 3, etiqueta: "Consulta de propietarios", ruta: "/propietarios", icono: null, orden: 1 },
    { id: 5, padreId: 3, etiqueta: "Registrar propietario", ruta: "/propietarios/registrar", icono: null, orden: 2 },
    { id: 6, padreId: null, etiqueta: "Mascotas", ruta: null, icono: "huella", orden: 4 },
    { id: 7, padreId: 6, etiqueta: "Consulta de mascotas", ruta: "/mascotas", icono: null, orden: 1 },
    { id: 8, padreId: 6, etiqueta: "Registrar mascota", ruta: "/mascotas/registrar", icono: null, orden: 2 },
    { id: 9, padreId: null, etiqueta: "Citas", ruta: null, icono: "citas", orden: 5 },
    { id: 10, padreId: 9, etiqueta: "Confirmación de citas", ruta: "/citas/confirmacion", icono: null, orden: 1 },
    { id: 11, padreId: 9, etiqueta: "Reprogramación de citas", ruta: "/citas/reprogramacion", icono: null, orden: 2 },
  ],
};

const CLAVE_SESION = "popim_clinica_mock_sesion";

// Pausa corta para que se note el estado "cargando", como con un servidor real
const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

// sessionStorage puede fallar (modo incógnito, etc.), por eso va con try/catch
function haySesion() {
  try {
    return sessionStorage.getItem(CLAVE_SESION) === "1";
  } catch {
    return false;
  }
}
function guardarSesion(activa) {
  try {
    if (activa) sessionStorage.setItem(CLAVE_SESION, "1");
    else sessionStorage.removeItem(CLAVE_SESION);
  } catch {
    // si no se puede guardar, la sesión solo dura hasta recargar
  }
}

// Agenda de prueba: los mismos datos para cualquier fecha
function agendaDePrueba(fecha) {
  const cita = (id, horaInicio, horaFin, estadoId, mascota, propietario, motivo, esEmergencia = false) => ({
    id, horaInicio, horaFin, estadoId, mascota, propietario, motivo, esEmergencia,
  });

  return {
    fecha,
    duracionBloqueMin: 60,
    veterinarios: [
      {
        personalId: "pc-1",
        nombre: "Dra. Ana Morales",
        especialidad: "Medicina general",
        horario: [{ inicio: "08:00:00", fin: "12:00:00" }, { inicio: "13:00:00", fin: "16:00:00" }],
        bloqueos: [],
        citas: [
          cita("c-1", "08:00:00", "09:00:00", 504, "Max", "Carlos Méndez", "Vacunación anual"),
          cita("c-2", "09:00:00", "10:00:00", 503, "Rocky", "Pedro Gómez", "Cojera en pata trasera"),
          cita("c-3", "10:00:00", "11:00:00", 502, "Kiara", "Sofía Ruiz", "Desparasitación"),
        ],
      },
      {
        personalId: "pc-2",
        nombre: "Dr. José Rivera",
        especialidad: "Dermatología",
        horario: [{ inicio: "09:00:00", fin: "12:00:00" }, { inicio: "13:00:00", fin: "17:00:00" }],
        bloqueos: [],
        citas: [
          cita("c-4", "09:00:00", "10:00:00", 503, "Luna", "María López", "Control de peso"),
          cita("c-5", "11:00:00", "12:00:00", 502, "Toby", "Andrés Torres", "Revisión de piel"),
        ],
      },
      {
        personalId: "pc-3",
        nombre: "Dra. Karla Díaz",
        especialidad: "Cirugía general",
        horario: [{ inicio: "08:00:00", fin: "12:00:00" }, { inicio: "13:00:00", fin: "16:00:00" }],
        bloqueos: [{ horaInicio: "11:00:00", horaFin: "12:00:00", motivo: "Cirugía programada" }],
        citas: [
          cita("c-6", "10:00:00", "11:00:00", 503, "Canela", "Ricardo Silva", "Golpe en la calle", true),
          cita("c-7", "13:00:00", "14:00:00", 501, "Coco", "Daniela Pérez", "Primera consulta"),
        ],
      },
      {
        personalId: "pc-4",
        nombre: "Dr. Luis Herrera",
        especialidad: "Medicina general",
        horario: [{ inicio: "08:00:00", fin: "12:00:00" }, { inicio: "13:00:00", fin: "17:00:00" }],
        bloqueos: [{ horaInicio: "16:00:00", horaFin: "17:00:00", motivo: "Permiso personal" }],
        citas: [
          cita("c-8", "10:00:00", "11:00:00", 501, "Michi", "Laura Castillo", "Vómitos frecuentes"),
          cita("c-9", "14:00:00", "15:00:00", 502, "Bruno", "Jorge Medina", "Seguimiento de tratamiento"),
        ],
      },
    ],
  };
}

export async function simular(ruta, metodo = "GET", cuerpo = {}) {
  await esperar(400);

  // ---------- Iniciar sesión ----------
  if (ruta === "/auth/login" && metodo === "POST") {
    const identificador = cuerpo.identificador ?? "";
    const password = cuerpo.contrasena ?? cuerpo.password ?? "";
    const coincide =
      identificador === USUARIO_PRUEBA.correo || identificador === USUARIO_PRUEBA.telefono;

    if (!coincide || password !== USUARIO_PRUEBA.password) {
      return { ok: false, estado: 401, error: "Correo, teléfono o contraseña incorrectos." };
    }
    guardarSesion(true);
    return { ok: true, estado: 200, datos: SESION_PRUEBA };
  }

  // ---------- Sesión actual ----------
  if (ruta === "/auth/sesion" && metodo === "GET") {
    if (!haySesion()) return { ok: false, estado: 401, error: "No has iniciado sesión." };
    return { ok: true, estado: 200, datos: SESION_PRUEBA };
  }

  // ---------- Cerrar sesión ----------
  if (ruta === "/auth/logout" && metodo === "POST") {
    guardarSesion(false);
    return { ok: true, estado: 200, datos: {} };
  }

      // ---------- Agenda de la clínica ----------
  if (ruta.startsWith("/clinica/agenda") && metodo === "GET") {
    if (!haySesion()) return { ok: false, estado: 401, error: "No has iniciado sesión." };
    // "/clinica/agenda?fecha=2026-11-06" → toma lo que va después del "?"
    const fecha = new URLSearchParams(ruta.split("?")[1]).get("fecha");
    return { ok: true, estado: 200, datos: agendaDePrueba(fecha) };
  }

  // Cualquier ruta que todavía no simulamos
  return {
    ok: false,
    estado: 404,
    error: `Modo de prueba: todavía no existe ${metodo} ${ruta}.`,
  };
}