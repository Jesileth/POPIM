// Datos falsos del portal de clínica: solo se usan mientras NEXT_PUBLIC_USAR_MOCK no sea "false".
// Devuelve siempre la misma forma que api.js: { ok, estado, datos } o { ok: false, estado, error, campo }

import * as m from "@/lib/mockClinica";
import { ID_ESTADO_CITA, ID_ESTADO_USUARIO } from "@/lib/estados";
import { formatearEdad, sig } from "@/lib/formato";
import { hoyISO } from "@/lib/fechas";

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
    nombreCompleto: "Rosa Calero" /* igual que en mockClinica para que Mi perfil coincida */,
    rol: "RECEPCIONISTA",
    fotoUrl: null,
    clinica: { id: "c-1", nombreComercial: "POPIM Central - Managua", logoUrl: null },
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


// ===========================================================================
// UNA SOLA "BASE DE DATOS" DE PRUEBA
// Antes este archivo tenía sus propios veterinarios, propietarios y citas, y el
// proyecto de tu compañero tenía OTROS (lib/mockClinica.js). Eso hacía que una cita
// creada en la Agenda no apareciera en Recepción de hoy, o que al tocar una cita de la
// agenda el Detalle dijera "No encontramos esa cita" (los ids no coincidían).
// Ahora TODO sale de lib/mockClinica.js; aquí solo traducimos su forma a la que
// esperan tus pantallas (la misma forma que mandará el backend).
// ===========================================================================

// Respuestas rápidas para no repetir siempre { ok, estado, ... }
const respuestaOk = (datos, estado = 200) => ({ ok: true, estado, datos });
const respuestaError = (estado, error, campo) => ({ ok: false, estado, error, campo });

// mockClinica lanza ErrorApi cuando algo no se puede (ej.: bloque ocupado = 409).
// Lo atrapamos y lo convertimos en { ok:false, estado, error } como el backend.
function intentar(fn) {
  try {
    return fn();
  } catch (e) {
    return respuestaError(e.estado ?? 400, e.message || "Ocurrió un error. Intenta de nuevo.");
  }
}

// "08:00" -> "08:00:00" (el backend manda TIME de MySQL con segundos)
const conSegundos = (hora) => (hora.length === 5 ? `${hora}:00` : hora);

// La agenda de tu compañero viene por "celdas" de una hora (LIBRE, CITA, BLOQUEO, FUERA).
// Tus pantallas esperan por veterinario: horario, bloqueos y citas. Aquí se convierte.
function agendaDesdeMock(fecha) {
  const datos = m.obtenerAgenda(fecha);
  return {
    fecha,
    duracionBloqueMin: 60,
    veterinarios: datos.veterinarios.map((v) => {
      const bloqueos = [];
      const citas = [];
      for (const [hora, celda] of Object.entries(v.celdas)) {
        const fin = sig(hora);
        if (celda.tipo === "BLOQUEO") {
          bloqueos.push({ horaInicio: conSegundos(hora), horaFin: conSegundos(fin), motivo: celda.motivo });
        }
        if (celda.tipo === "CITA") {
          const c = celda.cita;
          citas.push({
            id: c.id,
            horaInicio: conSegundos(c.horaInicio),
            horaFin: conSegundos(c.horaFin),
            estadoId: ID_ESTADO_CITA[c.estado],
            mascota: c.mascota.nombre,
            propietario: c.propietario.nombreCompleto,
            motivo: c.motivoConsulta,
            esEmergencia: c.esEmergencia,
          });
        }
      }
      return {
        personalId: v.id,
        nombre: v.nombreCompleto,
        especialidad: v.especialidad,
        horario: [{ inicio: conSegundos(v.horaInicio), fin: conSegundos(v.horaFin) }],
        bloqueos,
        citas,
      };
    }),
  };
}

// Lista corta de veterinarios con la forma que usa nueva-cita
const veterinarios = () =>
  m.listarVeterinarios().veterinarios.map((v) => ({
    personalId: v.id,
    nombre: v.nombreCompleto,
    especialidad: v.especialidad,
  }));

// "8888-1234" y "88881234" deben encontrarse igual: quitamos espacios y guiones
const paraBuscar = (texto) => (texto ?? "").toLowerCase().replace(/[\s-]/g, "");

// Cuenta que el administrador "registró" y todavía no se activa (estado 101)
const CUENTA_PENDIENTE = {
  correo: "nuevo@prueba.popim",
  codigo: "123456",
  nombre: "Luis Herrera",
  rol: "VETERINARIO",
  clinica: "POPIM Central - Managua",
};

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

  // ---------- Activar cuenta del personal ----------
  // Para probar: correo nuevo@prueba.popim y código 123456
  if (ruta === "/auth/activacion/verificar" && metodo === "POST") {
    const coincide = cuerpo.correo === CUENTA_PENDIENTE.correo && cuerpo.codigo === CUENTA_PENDIENTE.codigo;
    if (!coincide) return respuestaError(400, "El código no es correcto o ya venció.");
    return respuestaOk({
      tokenConfirmacion: "token-de-prueba",
      nombre: CUENTA_PENDIENTE.nombre,
      rol: CUENTA_PENDIENTE.rol,
      clinica: CUENTA_PENDIENTE.clinica,
    });
  }
  if (ruta === "/auth/activacion/confirmar" && metodo === "POST") {
    if (cuerpo.tokenConfirmacion !== "token-de-prueba") {
      return respuestaError(400, "Tu verificación venció. Vuelve a escribir el código.");
    }
    return respuestaOk({});
  }
  if (ruta === "/auth/activacion/solicitar" && metodo === "POST") {
    // Siempre ok, exista o no el correo (el backend real hace lo mismo)
    return respuestaOk({});
  }

  // Todo lo que empieza con /clinica/ necesita sesión
  if (ruta.startsWith("/clinica/") && !haySesion()) {
    return respuestaError(401, "No has iniciado sesión.");
  }

  // ---------- Agenda de la clínica ----------
  if (ruta.startsWith("/clinica/agenda") && metodo === "GET") {
    // "/clinica/agenda?fecha=2026-11-06" → toma lo que va después del "?"
    const fecha = new URLSearchParams(ruta.split("?")[1]).get("fecha");
    return respuestaOk(agendaDesdeMock(fecha));
  }

  // ---------- Veterinarios ----------
  if (ruta === "/clinica/veterinarios" && metodo === "GET") {
    return respuestaOk(veterinarios());
  }

  // Para emergencias: si un veterinario tiene una cita "En curso" hoy, está ocupado hasta que termine
  if (ruta === "/clinica/veterinarios/disponibles-ahora" && metodo === "GET") {
    const enCurso = m.citasDelDia(hoyISO()).citas.filter((c) => c.estado === "ATENCION");
    return respuestaOk(
      veterinarios().map((v) => {
        const cita = enCurso.find((c) => c.veterinario.id === v.personalId);
        return { ...v, ocupadoHasta: cita ? cita.horaFin : null };
      }),
    );
  }

  // ---------- Buscar propietarios ----------
  if (ruta.startsWith("/clinica/propietarios/buscar") && metodo === "GET") {
    const q = paraBuscar(new URLSearchParams(ruta.split("?")[1]).get("q"));
    const encontrados = m
      .listarPropietarios()
      .propietarios.filter((p) =>
        [p.nombreCompleto, p.cedula, p.telefono, p.correo].some((campo) => paraBuscar(campo).includes(q)),
      );
    return respuestaOk(
      encontrados.map((p) => ({
        id: p.id,
        nombreCompleto: p.nombreCompleto,
        cedula: p.cedula,
        telefono: p.telefono,
        correo: p.correo,
        estadoId: ID_ESTADO_USUARIO[p.estado],
      })),
    );
  }

  // ---------- Mascotas de un propietario ----------
  // match con una expresión regular: saca el id que va en medio de la ruta
  const rutaMascotas = ruta.match(/^\/clinica\/propietarios\/([^/]+)\/mascotas$/);
  if (rutaMascotas && metodo === "GET") {
    return intentar(() =>
      respuestaOk(
        m.obtenerPropietario(rutaMascotas[1]).mascotas.map((x) => ({
          id: x.id,
          nombre: x.nombre,
          especie: x.especie,
          raza: x.raza,
          edad: formatearEdad(x.edadActualMeses),
          codigoUnico: x.codigoUnico,
        })),
      ),
    );
  }

  // ---------- Crear cita normal ----------
  if (ruta === "/clinica/citas" && metodo === "POST") {
    const { mascotaId, veterinarioId, fecha, horaInicio, motivo } = cuerpo;
    if (!motivo || motivo.trim().length < 3) {
      return respuestaError(400, "Escribe el motivo de la consulta.", "motivo");
    }
    // mockClinica devuelve 409 si el bloque ya está ocupado
    return intentar(() => {
      const { cita } = m.crearCita({
        veterinarioId,
        fecha,
        horaInicio: horaInicio.slice(0, 5),
        mascotaId,
        motivoConsulta: motivo.trim(),
      });
      return respuestaOk({ id: cita.id }, 201);
    });
  }

  // ---------- Crear emergencia ----------
  if (ruta === "/clinica/citas/emergencia" && metodo === "POST") {
    if (!cuerpo.veterinarioId) {
      return respuestaError(400, "Elige quién atenderá la emergencia.", "veterinarioId");
    }
    return intentar(() => {
      const { cita } = m.crearEmergencia({
        veterinarioId: cuerpo.veterinarioId,
        mascotaId: cuerpo.mascotaId,
        motivoConsulta: (cuerpo.motivo ?? "").trim(),
      });
      return respuestaOk({ id: cita.id }, 201);
    });
  }

  // Cualquier ruta que todavía no simulamos
  return {
    ok: false,
    estado: 404,
    error: `Modo de prueba: todavía no existe ${metodo} ${ruta}.`,
  };
}