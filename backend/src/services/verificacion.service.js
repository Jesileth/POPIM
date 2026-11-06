//

import { randomInt, createHmac, timingSafeEqual } from "node:crypto";
import { ErrorHttp } from "../utils/errores.js";
import * as tokensRepo from "../repositories/tokens.repository.js";
import jwt from "jsonwebtoken";

const MINUTOS_VIGENCIA = 15;
const MAX_INTENTOS = 5;
const ESPERA_REENVIO_SEG = 60;

function generarCodigo() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0"); // siempre 6 dígitos: 004821
}

function hashear(codigo) {
  return createHmac("sha256", process.env.CODIGOS_SECRET).update(codigo).digest("hex");
}

function coincide(codigo, hashGuardado) {
  const a = Buffer.from(hashear(codigo), "hex");
  const b = Buffer.from(hashGuardado, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

// Crea un código nuevo y lo devuelve en claro UNA sola vez, para enviarlo por correo
export async function emitirCodigo(usuarioId, proposito) {
  const segundos = await tokensRepo.segundosDesdeUltimo(usuarioId, proposito);
  if (segundos !== null && segundos < ESPERA_REENVIO_SEG)
    throw new ErrorHttp(429, `Espera ${ESPERA_REENVIO_SEG - segundos} segundos antes de pedir otro código`);

  const codigo = generarCodigo();
  await tokensRepo.invalidarPendientes(usuarioId, proposito);
  await tokensRepo.crear({
    usuarioId,
    proposito,
    codigoHash: hashear(codigo),
    minutos: MINUTOS_VIGENCIA,
  });
  return { codigo, minutos: MINUTOS_VIGENCIA };
}

// Comprueba el código SIN gastarlo (sirve para el paso "verificar")
export async function validarCodigo(usuarioId, proposito, codigoIngresado) {
  const token = await tokensRepo.buscarVigente(usuarioId, proposito);
  if (!token || token.intentos >= MAX_INTENTOS)
    throw new ErrorHttp(400, "El código venció o no es válido. Pide uno nuevo.", "codigo");

  if (!coincide(codigoIngresado, token.codigoHash)) {
    await tokensRepo.sumarIntento(token.id);
    throw new ErrorHttp(400, "El código no es correcto", "codigo");
  }
  return token;
}

// Lo gasta: después de esto el mismo código ya no sirve
export async function consumirCodigo(tokenId, conexion) {
  const fueElPrimero = await tokensRepo.marcarUsado(tokenId, conexion);
  if (!fueElPrimero) throw new ErrorHttp(400, "Este código ya fue utilizado", "codigo");
}

//

// const MINUTOS_TOKEN_RESTABLECIMIENTO = 15;

function firmarPaso(usuarioId, tokenId, uso, minutos) {
  return jwt.sign({ uid: usuarioId, tid: tokenId, uso }, process.env.CODIGOS_SECRET, {
    expiresIn: `${minutos}m`,
  });
}

function leerPaso(token, uso) {
  try {
    const datos = jwt.verify(token, process.env.CODIGOS_SECRET, { algorithms: ["HS256"] });
    if (datos.uso !== uso) throw new Error("uso incorrecto");
    return { usuarioId: datos.uid, tokenId: datos.tid };
  } catch {
    throw new ErrorHttp(400, "La verificación venció. Pide un código nuevo.", "codigo");
  }
}

export const crearTokenRestablecimiento = (usuarioId, tokenId) => firmarPaso(usuarioId, tokenId, "RESTABLECER", 10);
export const leerTokenRestablecimiento = (token) => leerPaso(token, "RESTABLECER");

export const crearTokenActivacion = (usuarioId) => firmarPaso(usuarioId, null, "ACTIVAR", 15);
export const leerTokenActivacion = (token) => leerPaso(token, "ACTIVAR");