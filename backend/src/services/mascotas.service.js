//

import crypto from "node:crypto";
import { ErrorHttp } from "../utils/errores.js";
import * as mascotasRepo from "../repositories/mascotas.repository.js";
import * as catalogosRepo from "../repositories/catalogos.repository.js";
import { guardarImagen, borrarImagen } from "../config/archivos.js";

const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generarCodigo() {
  const numero = crypto.randomInt(1000, 10000);
  const letra = () => LETRAS[crypto.randomInt(LETRAS.length)];
  return `PET-${numero}-${letra()}${letra()}`;
}

// Convierte la fila de la base a la forma que espera el frontend
function formatear(f) {
  return {
    id: f.id,
    codigoUnico: f.codigoUnico,
    nombre: f.nombre,
    especie: { id: f.especieId, nombre: f.especieNombre },
    raza: f.razaId ? { id: f.razaId, nombre: f.razaNombre } : null,
    sexo: f.sexo,
    edadActualMeses: f.edadActualMeses,
    fotoUrl: f.fotoUrl,
    fechaNacimiento: f.fechaNacimiento,
    fechaRegistro: f.fechaRegistro ? `${f.fechaRegistro.replace(" ", "T")}Z` : null,
  };
}

async function propietarioDe(usuarioId) {
  const id = await mascotasRepo.obtenerPropietarioId(usuarioId);
  if (!id) throw new ErrorHttp(403, "Tu cuenta no es de un propietario");
  return id;
}

export async function listar(usuarioId) {
  const propietarioId = await propietarioDe(usuarioId);
  const filas = await mascotasRepo.listarPorPropietario(propietarioId);
  return { mascotas: filas.map(formatear) };
}

export async function registrar(usuarioId, datos) {
  const propietarioId = await propietarioDe(usuarioId);

  if (!(await catalogosRepo.existeEspecie(datos.especieId)))
    throw new ErrorHttp(400, "La especie no es válida", "especie");

  if (datos.razaId && !(await mascotasRepo.razaPerteneceAEspecie(datos.razaId, datos.especieId)))
    throw new ErrorHttp(400, "La raza no corresponde a la especie elegida", "raza");

  // El código es aleatorio: si por casualidad ya existe, se genera otro (hasta 5 veces)
  for (let intento = 0; intento < 5; intento++) {
    try {
      const id = await mascotasRepo.crearMascota({
        ...datos,
        propietarioId,
        usuarioId,
        codigoUnico: generarCodigo(),
      });
      return { mascota: formatear(await mascotasRepo.buscarPorId(id)) };
    } catch (error) {
      const esCodigoRepetido =
        error.code === "ER_DUP_ENTRY" && (error.sqlMessage || "").includes("uq_mascota_codigo");
      if (!esCodigoRepetido) throw error;
    }
  }
  throw new ErrorHttp(500, "No pudimos generar el código único. Intenta de nuevo.");
}


// servicio de subir foto
export async function subirFoto(usuarioId, mascotaId, archivo) {
  if (!archivo) throw new ErrorHttp(400, "Elige una imagen", "foto");

  const propietarioId = await propietarioDe(usuarioId);
  const actual = await mascotasRepo.buscarDePropietario(mascotaId, propietarioId);
  if (!actual) throw new ErrorHttp(404, "No encontramos esa mascota");

  const nombre = await guardarImagen(archivo.buffer, "mascotas");
  if (!nombre) throw new ErrorHttp(400, "La imagen debe ser JPG, PNG o WebP", "foto");

  const url = `/api/archivos/mascotas/${nombre}`;
  await mascotasRepo.actualizarFoto(mascotaId, url);
  await borrarImagen("mascotas", actual.foto_url); // borra la foto anterior para no acumular basura
  return { url };
}

export async function quitarFoto(usuarioId, mascotaId) {
  const propietarioId = await propietarioDe(usuarioId);
  const actual = await mascotasRepo.buscarDePropietario(mascotaId, propietarioId);
  if (!actual) throw new ErrorHttp(404, "No encontramos esa mascota");

  await mascotasRepo.actualizarFoto(mascotaId, null);
  await borrarImagen("mascotas", actual.foto_url);
  return {};
}


// función nueva para ver los datos de la mascota
export async function obtener(usuarioId, mascotaId) {
  const propietarioId = await propietarioDe(usuarioId);
  const fila = await mascotasRepo.buscarCompletaDePropietario(mascotaId, propietarioId);
  if (!fila) throw new ErrorHttp(404, "No encontramos esa mascota");
  return { mascota: formatear(fila) };
}