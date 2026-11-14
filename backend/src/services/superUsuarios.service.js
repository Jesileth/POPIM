

// Reglas de Usuarios y accesos del Super Administrador

import { ErrorHttp } from "../utils/errores.js";
import { aMomentoUtc } from "../utils/fechas.js";
import * as repo from "../repositories/superUsuarios.repository.js";

// estado_id ↔ código que entiende el frontend
const ESTADOS = { 101: "PENDIENTE", 102: "ACTIVO", 103: "BLOQUEADO", 104: "INACTIVO", 105: "PROVISIONAL" };
const ID_ESTADO = { PENDIENTE: 101, ACTIVO: 102, BLOQUEADO: 103, INACTIVO: 104, PROVISIONAL: 105 };
const ROLES = ["PROPIETARIO", "RECEPCIONISTA", "VETERINARIO", "ADMINISTRADOR", "SUPER_ADMIN"];

// Filtros que llegan por la URL: ?q=texto&rol=VETERINARIO&estado=BLOQUEADO
export async function listar({ q, rol, estado }) {
  const [filas, conteos] = await Promise.all([
    repo.listar({
      q: q?.trim() || null,
      rol: ROLES.includes(rol) ? rol : null,        // un rol inventado se ignora
      estadoId: ID_ESTADO[estado] ?? null,
    }),
    repo.contarPorEstado(),
  ]);

  // { TODOS: 120, BLOQUEADO: 4, PENDIENTE: 12, ... }
  const totales = { TODOS: 0 };
  for (const c of conteos) {
    totales[ESTADOS[c.estadoId]] = c.total;
    totales.TODOS += c.total;
  }

  return {
    totales,
    usuarios: filas.map((f) => ({
      id: f.id,
      nombreCompleto: f.nombreCompleto,
      correo: f.correo,
      telefono: f.telefono,
      cedula: f.cedula,
      roles: f.roles ? f.roles.split(",") : [],
      clinica: f.clinica,               // null = propietario o Super Administrador
      estado: ESTADOS[f.estadoId],
      intentosFallidos: f.intentosFallidos,
      ultimoAcceso: aMomentoUtc(f.ultimoAcceso),
      fechaRegistro: aMomentoUtc(f.fechaRegistro),
    })),
  };
}

// Bloqueada (103) → Activa (102) con los intentos en 0.
// Es la única forma de desbloquear: la recuperación por correo no lo hace.
export async function desbloquear(usuarioId) {
  const usuario = await repo.buscar(usuarioId);
  if (!usuario) throw new ErrorHttp(404, "No encontramos esa cuenta");
  if (usuario.estadoId !== 103) throw new ErrorHttp(409, "Esta cuenta no está bloqueada");

  const hecho = await repo.desbloquear(usuarioId);
  if (!hecho) throw new ErrorHttp(409, "Esta cuenta no está bloqueada");
  return { id: usuarioId, nombreCompleto: usuario.nombreCompleto, estado: "ACTIVO" };
}