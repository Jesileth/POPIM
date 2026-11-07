//

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export const RAIZ_UPLOADS = path.resolve("uploads");

const NOMBRE_VALIDO = /^[a-f0-9-]{36}\.(jpg|png|webp)$/;
export const esNombreValido = (nombre) => NOMBRE_VALIDO.test(nombre);

// Mira los primeros bytes del archivo para saber qué es de verdad.
// No confiamos en la extensión ni en lo que diga el navegador: se pueden falsificar.
function detectarTipoImagen(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  return null;
}

export async function guardarImagen(buffer, carpeta) {
  const tipo = detectarTipoImagen(buffer);
  if (!tipo) return null;

  const nombre = `${crypto.randomUUID()}.${tipo}`; // nombre nuevo, nunca el original
  const directorio = path.join(RAIZ_UPLOADS, carpeta);
  await fs.mkdir(directorio, { recursive: true });
  await fs.writeFile(path.join(directorio, nombre), buffer);
  return nombre;
}

export async function borrarImagen(carpeta, urlPublica) {
  if (!urlPublica) return;
  const nombre = path.posix.basename(urlPublica);
  if (!esNombreValido(nombre)) return;
  await fs.rm(path.join(RAIZ_UPLOADS, carpeta, nombre), { force: true });
}



// ---------- Resultados de exámenes (PDF, JPG o PNG) ----------
// NO se sirven por /archivos: solo por /clinica/examenes/:id/archivo, que revisa permisos.
export const CARPETA_EXAMENES = path.join(RAIZ_UPLOADS, "examenes");

const MIME = { pdf: "application/pdf", jpg: "image/jpeg", png: "image/png" };

// Igual que con las fotos: el tipo se decide por los primeros bytes, no por la extensión
function detectarTipoExamen(buf) {
  if (buf.length >= 5 && buf.subarray(0, 5).toString("ascii") === "%PDF-") return "pdf";
  const imagen = detectarTipoImagen(buf);
  return imagen === "jpg" || imagen === "png" ? imagen : null;
}

// Devuelve { nombre, mimeType } o null si no es PDF/JPG/PNG
export async function guardarExamen(buffer) {
  const tipo = detectarTipoExamen(buffer);
  if (!tipo) return null;
  const nombre = `${crypto.randomUUID()}.${tipo}`;
  await fs.mkdir(CARPETA_EXAMENES, { recursive: true });
  await fs.writeFile(path.join(CARPETA_EXAMENES, nombre), buffer);
  return { nombre, mimeType: MIME[tipo] };
}

export const esNombreExamen = (nombre) => /^[a-f0-9-]{36}\.(pdf|jpg|png)$/.test(nombre);