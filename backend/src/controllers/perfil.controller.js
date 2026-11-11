
//

import { ErrorHttp } from "../utils/errores.js";
import * as perfilService from "../services/perfil.service.js";

const texto = (v) => (typeof v === "string" ? v.trim() : "");

export async function obtener(req, res)
 {
  res.json(await perfilService.obtener(req.usuarioId, req.portal));
}

export async function guardar(req, res) 
{
  const b = req.body ?? {};
  const nombreCompleto = texto(b.nombreCompleto);
  const telefono = texto(b.telefono).replace(/\s+/g, "");
  const direccion = texto(b.direccion) || null;
    const presentacion = texto(b.presentacion) || null; // solo la usa el veterinario

  if (nombreCompleto.length < 3 || nombreCompleto.length > 160)
    throw new ErrorHttp(400, "Escribe tu nombre completo", "nombreCompleto");
  
  if (!/^[0-9+\-]{7,20}$/.test(telefono))
    throw new ErrorHttp(400, "Teléfono no válido", "telefono");

  if (direccion && direccion.length > 255)
    throw new ErrorHttp(400, "La dirección es demasiado larga (máximo 255 letras)", "direccion");

    if (presentacion && presentacion.length > 500)
    throw new ErrorHttp(400, "La presentación es demasiado larga (máximo 500 letras)", "presentacion");

  // El personal de la clínica no tiene dirección; el propietario no tiene presentación
  const datos = req.portal === "CLINICA"
    ? { nombreCompleto, telefono, presentacion }
    : { nombreCompleto, telefono, direccion };

  res.json(await perfilService.guardar(req.usuarioId, datos, req.portal));
}

export async function subirFoto(req, res) 
{
  res.json(await perfilService.subirFoto(req.usuarioId, req.file));
}

export async function quitarFoto(req, res) 
{
  res.json(await perfilService.quitarFoto(req.usuarioId));
}

export async function cambiarPassword(req, res) 
{
  const b = req.body ?? {};
  const passwordActual = typeof b.passwordActual === "string" ? b.passwordActual : "";
  const passwordNueva = typeof b.passwordNueva === "string" ? b.passwordNueva : "";

  if (!passwordActual) throw new ErrorHttp(400, "Escribe tu contraseña actual", "passwordActual");

  if (passwordNueva.length < 8)
    throw new ErrorHttp(400, "La contraseña nueva debe tener al menos 8 caracteres", "passwordNueva");

  if (passwordNueva.length > 72)
    throw new ErrorHttp(400, "La contraseña nueva es demasiado larga", "passwordNueva");


  res.json(await perfilService.cambiarPassword(req.usuarioId, passwordActual, passwordNueva));
}