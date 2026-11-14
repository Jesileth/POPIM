
//

// Reglas del módulo Personal del Administrador de una clínica.
// "yo" = req.personal de quien inició sesión: { id, clinicaId, rol }

import { ErrorHttp } from "../utils/errores.js";
import { aMomentoUtc } from "../utils/fechas.js";
import * as repo from "../repositories/adminPersonal.repository.js";

const ESTADO_CUENTA = { 101: "PENDIENTE", 102: "ACTIVO", 103: "BLOQUEADO", 104: "INACTIVO", 105: "PROVISIONAL" };

// Traduce los índices únicos de MySQL al campo del formulario que falló
function errorDuplicado(error) {
  if (error.code !== "ER_DUP_ENTRY") return null;
  const m = error.sqlMessage || "";
  if (m.includes("uq_licencia")) return new ErrorHttp(409, "Ese número de licencia ya está registrado", "licencia");
  if (m.includes("uq_usuarios_correo")) return new ErrorHttp(409, "Ese correo ya está registrado", "correo");
  if (m.includes("uq_usuarios_telefono")) return new ErrorHttp(409, "Ese teléfono ya está registrado", "telefono");
  return new ErrorHttp(409, "Ya existe un registro con esos datos");
}

const formatear = (f, yo) => ({
  personalId: f.personalId,
  nombreCompleto: f.nombreCompleto,
  correo: f.correo,
  telefono: f.telefono,
  rol: f.rol,                                  // RECEPCIONISTA, VETERINARIO, ADMINISTRADOR
  cuenta: ESTADO_CUENTA[f.cuentaEstadoId],     // ACTIVO, BLOQUEADO, PENDIENTE...
  intentosFallidos: f.intentosFallidos,
  ultimoAcceso: aMomentoUtc(f.ultimoAcceso),
  vinculoActivo: f.vinculoEstadoId === 301,
  fechaIngreso: f.fechaIngreso,
  licencia: f.licencia,
  especialidadId: f.especialidadId,
  especialidad: f.especialidad,
  esYo: f.personalId === yo.id,                // para no dejar que se desactive a sí mismo
});

// Busca a la persona y comprueba que sea de MI clínica (si no, 404: ni siquiera decimos que existe)
async function personaDeMiClinica(personalId, yo) {
  const p = await repo.buscarEnClinica(personalId, yo.clinicaId);
  if (!p) throw new ErrorHttp(404, "No encontramos a esa persona en tu clínica");
  return p;
}

export async function listar(yo) {
  const filas = await repo.listar(yo.clinicaId);
  return { personal: filas.map((f) => formatear(f, yo)) };
}

export async function especialidades() {
  return { especialidades: await repo.especialidades() };
}

// ¿Se puede vincular este correo a mi clínica? Lo usa el paso 1 de "Vincular personal".
// Una cuenta del personal pertenece a UNA sola clínica a la vez, porque la sesión
// (buscarVinculo) solo sabe trabajar con una. Para un traslado, la clínica anterior
// desactiva el vínculo primero.

async function revisarCorreo(correo, yo) {
  const cuenta = await repo.cuentaPorCorreo(correo);
  if (!cuenta) return { existe: false, puedeVincular: true };

  const [rolActual, vinculos] = await Promise.all([repo.rolClinicaDe(cuenta.id), repo.vinculosDe(cuenta.id)]);
  const aqui = vinculos.find((v) => v.clinicaId === yo.clinicaId);
  const otraActiva = vinculos.find((v) => v.clinicaId !== yo.clinicaId && v.estadoId === 301);

  let motivo = null;
  if (aqui?.estadoId === 301) motivo = "Esa persona ya trabaja en tu clínica.";
  else if (otraActiva) motivo = `Esa persona trabaja en ${otraActiva.clinica}. Esa clínica debe desactivar su vínculo antes de que puedas vincularla.`;

  return {
    existe: true,
    puedeVincular: !motivo,
    motivo,
    id: cuenta.id,
    nombreCompleto: cuenta.nombreCompleto,
    telefono: cuenta.telefono,
    cuenta: ESTADO_CUENTA[cuenta.estadoId],
    rolActual,                       // si ya tiene un rol del portal, se mantiene ese
    licencia: cuenta.licencia,       // si ya es veterinario, ya tiene licencia
    estuvoAqui: aqui?.estadoId === 302,
  };
}

export async function buscarPorCorreo(correo, yo) {
  const limpio = String(correo ?? "").trim().toLowerCase();
  if (!limpio) throw new ErrorHttp(400, "Escribe el correo", "correo");
  const r = await revisarCorreo(limpio, yo);
  delete r.id; // el id interno de la cuenta no hace falta en el navegador
  return r;
}

export async function vincular(d, yo, usuarioId) {
    
  // Se vuelve a revisar aquí: nunca confiamos en que el navegador ya lo revisó
  const r = await revisarCorreo(d.correo, yo);
  if (!r.puedeVincular) throw new ErrorHttp(409, r.motivo, "correo");
  if (r.rolActual && r.rolActual !== d.rol) {
    throw new ErrorHttp(409, "Esa persona ya tiene otro rol en el portal de clínicas; vincúlala con ese mismo rol", "rol");
  }

  // El perfil de veterinario solo se crea si aún no lo tiene
  const veterinario = d.rol === "VETERINARIO" && !r.licencia
    ? { licencia: d.licencia, especialidadId: d.especialidadId, presentacion: d.presentacion }
    : null;

  try {
    const personalId = await repo.vincular({
      clinicaId: yo.clinicaId,
      existenteId: r.existe ? r.id : null,
      persona: { nombreCompleto: d.nombreCompleto, correo: d.correo, telefono: d.telefono },
      rol: d.rol,
      veterinario,
      creadoPor: usuarioId,
    });
    return { personalId, cuentaNueva: !r.existe };
  } catch (error) {
    throw errorDuplicado(error) ?? error;
  }
}

// Licencia y especialidad: solo el administrador las cambia (el veterinario no, desde Mi perfil)
export async function actualizarProfesional(personalId, d, yo) {
  const p = await personaDeMiClinica(personalId, yo);
  if (p.rol !== "VETERINARIO") throw new ErrorHttp(409, "Solo los veterinarios tienen datos profesionales");
  try {
    if (await repo.tienePerfilVeterinario(p.usuarioId)) await repo.actualizarProfesional(p.usuarioId, d);
    else await repo.crearPerfilVeterinario(p.usuarioId, d);
  } catch (error) {
    throw errorDuplicado(error) ?? error;
  }
  return formatear(await repo.buscarEnClinica(personalId, yo.clinicaId), yo);
}

export async function desbloquear(personalId, yo) {
  const p = await personaDeMiClinica(personalId, yo);
  if (p.cuentaEstadoId !== 103) throw new ErrorHttp(409, "Esta cuenta no está bloqueada");
  await repo.desbloquear(p.usuarioId);
  return formatear(await repo.buscarEnClinica(personalId, yo.clinicaId), yo);
}

// Desactivar = 302. No se borra nada: consultas, dosis y citas siguen a su nombre.
export async function cambiarVinculo(personalId, activo, yo) {
  const p = await personaDeMiClinica(personalId, yo);

  if (!activo) {
    if (p.personalId === yo.id) throw new ErrorHttp(409, "No puedes desactivar tu propio vínculo");
    const pendientes = await repo.citasPendientesDe(personalId);
    if (pendientes > 0) {
      throw new ErrorHttp(409, `Tiene ${pendientes} ${pendientes === 1 ? "cita pendiente" : "citas pendientes"}. Pide a recepción que las reprograme o cancele antes de desactivar su vínculo.`);
    }
  } else {
    // Al reactivar, revisar que no trabaje ahora en otra clínica
    const otra = (await repo.vinculosDe(p.usuarioId)).find((v) => v.clinicaId !== yo.clinicaId && v.estadoId === 301);
    if (otra) throw new ErrorHttp(409, `Esa persona ahora trabaja en ${otra.clinica}`);
  }

  await repo.cambiarVinculo(personalId, activo ? 301 : 302);
  return formatear(await repo.buscarEnClinica(personalId, yo.clinicaId), yo);
}