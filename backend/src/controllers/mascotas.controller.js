//

import { ErrorHttp } from "../utils/errores.js";
import * as mascotasService from "../services/mascotas.service.js";

const texto = (v) => (typeof v === "string" ? v.trim() : "");

export async function listar(req, res) {
  res.json(await mascotasService.listar(req.usuarioId));
}

export async function registrar(req, res) {
  const b = req.body ?? {};

  const nombre = texto(b.nombre);
  const especieId = Number(b.especieId);
  const razaId = b.razaId ? Number(b.razaId) : null;
  const sexo = texto(b.sexo).toUpperCase();
  const edadValor = Number(b.edad);
  const edadUnidad = texto(b.unidadEdad).toUpperCase();
  const fechaNacimiento = texto(b.fechaNacimiento) || null;

  if (nombre.length < 1 || nombre.length > 80)
    throw new ErrorHttp(400, "Escribe el nombre de la mascota (máximo 80 letras)", "nombre");
  if (!Number.isInteger(especieId) || especieId < 1)
    throw new ErrorHttp(400, "Elige una especie", "especie");
  if (razaId !== null && (!Number.isInteger(razaId) || razaId < 1))
    throw new ErrorHttp(400, "Raza no válida", "raza");
  if (!["MACHO", "HEMBRA"].includes(sexo))
    throw new ErrorHttp(400, "Elige el sexo", "sexo");
  if (!["ANIOS", "MESES"].includes(edadUnidad))
    throw new ErrorHttp(400, "Elige si la edad es en años o en meses", "edad");

  const maximo = edadUnidad === "ANIOS" ? 100 : 1200;
  if (!Number.isInteger(edadValor) || edadValor < 0 || edadValor > maximo)
    throw new ErrorHttp(400, "Escribe una edad válida", "edad");

  if (fechaNacimiento !== null) {
    const fecha = new Date(`${fechaNacimiento}T00:00:00`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento) || Number.isNaN(fecha.getTime()))
      throw new ErrorHttp(400, "Fecha de nacimiento no válida", "fechaNacimiento");
    if (fecha > new Date())
      throw new ErrorHttp(400, "La fecha de nacimiento no puede ser futura", "fechaNacimiento");
  }

  const creada = await mascotasService.registrar(req.usuarioId, {
    nombre, especieId, razaId, sexo, edadValor, edadUnidad, fechaNacimiento,
  });
  res.status(201).json(creada);
}


// subir fotito
export async function subirFoto(req, res) {
  res.json(await mascotasService.subirFoto(req.usuarioId, req.params.id, req.file));
}

export async function quitarFoto(req, res) {
  res.json(await mascotasService.quitarFoto(req.usuarioId, req.params.id));
}