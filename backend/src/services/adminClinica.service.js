

// Reglas de "Mi clínica" (Administrador). "yo" = req.personal: { id, clinicaId, rol }

import { ErrorHttp } from "../utils/errores.js";
import { guardarImagen, borrarImagen } from "../config/archivos.js";
import * as repo from "../repositories/adminClinica.repository.js";
import * as superRepo from "../repositories/superClinicas.repository.js";

export async function obtener(yo) {
  const [c, horario, veterinarios] = await Promise.all([
    superRepo.buscar(yo.clinicaId),
    superRepo.horariosDe(yo.clinicaId),
    repo.veterinariosActivos(yo.clinicaId),
  ]);
  if (!c) throw new ErrorHttp(404, "No encontramos tu clínica");
  return {
    razonSocial: c.razonSocial,
    nombreComercial: c.nombreComercial,
    ruc: c.ruc,
    direccion: c.direccion,
    telefono: c.telefono ?? "",
    correo: c.correo ?? "",
    logoUrl: c.logoUrl,
    duracionCitaMin: c.duracionCitaMin,
    activa: c.estadoId === 201,
    horario,
    veterinariosActivos: veterinarios,
  };
}

// La nueva duración solo aplica a las citas nuevas: las ya agendadas guardan su hora_inicio y hora_fin
export async function actualizar(d, yo) {
  await repo.actualizar(yo.clinicaId, d);
  return obtener(yo);
}

// Mismo camino que la foto de perfil: se revisan los bytes, se guarda con nombre nuevo y se borra el anterior
export async function subirLogo(archivo, yo) {
  if (!archivo) throw new ErrorHttp(400, "Elige una imagen", "foto");
  const [nombre, anterior] = await Promise.all([
    guardarImagen(archivo.buffer, "logos"),
    repo.logoDe(yo.clinicaId),
  ]);
  if (!nombre) throw new ErrorHttp(400, "El logo debe ser JPG, PNG o WebP", "foto");

  const url = `/api/archivos/logos/${nombre}`;
  await repo.cambiarLogo(yo.clinicaId, url);
  await borrarImagen("logos", anterior);
  return { logoUrl: url };
}

export async function quitarLogo(yo) {
  const anterior = await repo.logoDe(yo.clinicaId);
  await repo.cambiarLogo(yo.clinicaId, null);
  await borrarImagen("logos", anterior);
  return { logoUrl: null };
}