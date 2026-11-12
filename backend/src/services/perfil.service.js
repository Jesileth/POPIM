
//

import bcrypt from "bcryptjs";
import { ErrorHttp } from "../utils/errores.js";
import { aMomentoUtc } from "../utils/fechas.js";
import { guardarImagen, borrarImagen } from "../config/archivos.js";
import * as perfilRepo from "../repositories/perfil.repository.js";
import * as usuariosRepo from "../repositories/usuarios.repository.js";
import * as personalRepo from "../repositories/personal.repository.js";

function formatear(f) {
  return {
    usuario: {
      id: f.id,
      nombreCompleto: f.nombreCompleto,
      correo: f.correo,
      telefono: f.telefono,
      fotoPerfilUrl: f.fotoPerfilUrl,
      fechaRegistro: aMomentoUtc(f.fechaRegistro),
      ultimoAcceso: aMomentoUtc(f.ultimoAcceso),
      estado: { codigo: f.estadoCodigo, nombre: f.estadoNombre },
    },
    propietario: { cedula: f.cedula, direccion: f.direccion },
  };
}

export async function obtener(usuarioId, portal)
{
  if (portal === "CLINICA") return obtenerPersonal(usuarioId);
  const fila = await perfilRepo.obtenerPerfil(usuarioId);
  if (!fila) throw new ErrorHttp(404, "No encontramos tu perfil");
  return formatear(fila);     
}

export async function guardar(usuarioId, datos, portal) 
{
  try 
  {
    if (portal === "CLINICA")
    {
      const vinculo = await personalRepo.buscarVinculo(usuarioId);

      // Sin clínica solo puede ser el Super Administrador
      if (!vinculo && !(await esSuperAdmin(usuarioId))) throw new ErrorHttp(404, "No encontramos tu perfil");
      
      await perfilRepo.actualizarPerfilPersonal({
        usuarioId, ...datos, esVeterinario: vinculo?.rol === "VETERINARIO",
      });
    }
    else
    {
      await perfilRepo.actualizarPerfil({ usuarioId, ...datos });
    }
  }
  
  catch (error) 
  {
    if (error.code === "ER_DUP_ENTRY" && (error.sqlMessage || "").includes("uq_usuarios_telefono"))
      throw new ErrorHttp(409, "Este teléfono ya está registrado", "telefono");
    throw error;
  }

    return obtener(usuarioId, portal);
}

export async function subirFoto(usuarioId, archivo) 
{
  if (!archivo) throw new ErrorHttp(400, "Elige una imagen", "foto");

  const [nombre, anterior] = await Promise.all
  ([
    guardarImagen(archivo.buffer, "perfiles"),
    perfilRepo.obtenerFoto(usuarioId),
  ]);

  if (!nombre) throw new ErrorHttp(400, "La imagen debe ser JPG, PNG o WebP", "foto");

  const url = `/api/archivos/perfiles/${nombre}`;
  await perfilRepo.actualizarFoto(usuarioId, url);
  await borrarImagen("perfiles", anterior);
  return { url };
}

export async function quitarFoto(usuarioId) 
{
  const anterior = await perfilRepo.obtenerFoto(usuarioId);
  await perfilRepo.actualizarFoto(usuarioId, null);
  await borrarImagen("perfiles", anterior);
  return {};
}

export async function cambiarPassword(usuarioId, passwordActual, passwordNueva) 
{
  const cred = await perfilRepo.obtenerCredenciales(usuarioId);
  if (!cred || cred.estadoId !== 102) throw new ErrorHttp(401, "Sesión no válida");

  const coincide = passwordActual.length <= 72 && (await bcrypt.compare(passwordActual, cred.contrasena));
  if (!coincide) {
    // Cuenta como intento fallido: si no, alguien con tu sesión podría adivinar tu contraseña sin límite
    await usuariosRepo.registrarIntentoFallido(usuarioId, cred.intentos + 1 >= 5);
    throw new ErrorHttp(400, "La contraseña actual no es correcta", "passwordActual");
  }

  if (await bcrypt.compare(passwordNueva, cred.contrasena))
    throw new ErrorHttp(400, "La nueva contraseña debe ser distinta de la actual", "passwordNueva");

  await perfilRepo.actualizarContrasena(usuarioId, await bcrypt.hash(passwordNueva, 12));
  return {};
}




// ---------- PERSONAL de la clínica ----------

const NOMBRE_DIA = {
  LUNES: "Lunes", MARTES: "Martes", MIERCOLES: "Miércoles", JUEVES: "Jueves",
  VIERNES: "Viernes", SABADO: "Sábado", DOMINGO: "Domingo",
};

// Filas de horarios_personal → [{ dias: "Lunes a viernes", tramos: [{inicio, fin}, ...] }, ...]
// Junta los días SEGUIDOS que tienen exactamente el mismo horario. tramos vacío = "No atiende".
function agruparHorario(filas)
{
  const dias = Object.keys(NOMBRE_DIA).map((dia) => ({
    dia,
    tramos: filas.filter((f) => f.dia === dia).map((f) => ({ inicio: f.inicio, fin: f.fin })),
  }));

  const grupos = [];
  for (const d of dias)
  {
    const clave = JSON.stringify(d.tramos);
    const ultimo = grupos.at(-1);
    if (ultimo && ultimo.clave === clave) ultimo.hasta = d.dia;
    else grupos.push({ desde: d.dia, hasta: d.dia, clave, tramos: d.tramos });
  }

  return grupos.map((g) => ({
    dias: g.desde === g.hasta
      ? NOMBRE_DIA[g.desde]
      : `${NOMBRE_DIA[g.desde]} a ${NOMBRE_DIA[g.hasta].toLowerCase()}`,
    tramos: g.tramos,
  }));
}

// ¿Es el Super Administrador? (el único del portal CLINICA sin vínculo con una clínica)
async function esSuperAdmin(usuarioId) {
  return (await usuariosRepo.obtenerRolDePortal(usuarioId, "CLINICA")) === "SUPER_ADMIN";
}

async function obtenerPersonal(usuarioId)
{
  const [fila, vinculo] = await Promise.all([
    perfilRepo.obtenerUsuarioPersonal(usuarioId),
    personalRepo.buscarVinculo(usuarioId),
  ]);

    if (!fila) throw new ErrorHttp(404, "No encontramos tu perfil");

  // Sin vínculo con una clínica: solo es válido para el Super Administrador (administra toda la red)
  if (!vinculo) {

    if (!(await esSuperAdmin(usuarioId))) throw new ErrorHttp(404, "No encontramos tu perfil");
    return {
      usuario: {
        id: fila.id,
        nombreCompleto: fila.nombreCompleto,
        correo: fila.correo,
        telefono: fila.telefono,
        fotoPerfilUrl: fila.fotoPerfilUrl,
        rol: "Super Administrador",
        estado: fila.estadoNombre,
        ultimoAcceso: aMomentoUtc(fila.ultimoAcceso),
        fechaIngreso: fila.fechaRegistro,   // no tiene fecha_ingreso: se usa cuándo se creó su cuenta
        personalId: null,
        licencia: null,
        especialidad: null,
        presentacion: "",
      },
      clinica: { id: null, nombreComercial: "Red POPIM", direccion: "Administra todas las clínicas de la red", logoUrl: null },
      horario: null,
    };
  }

  const esVeterinario = vinculo.rol === "VETERINARIO";
  const horario = esVeterinario ? agruparHorario(await personalRepo.horariosDe(vinculo.personalId)) : null;

  return {
    usuario: {
      id: fila.id,
      nombreCompleto: fila.nombreCompleto,
      correo: fila.correo,
      telefono: fila.telefono,
      fotoPerfilUrl: fila.fotoPerfilUrl,
      rol: vinculo.rolNombre,            // "Recepcionista", "Veterinario"…
      estado: fila.estadoNombre,         // "Activo"
      ultimoAcceso: aMomentoUtc(fila.ultimoAcceso),
      fechaIngreso: vinculo.fechaIngreso,
      // Solo el veterinario lleva estos datos (el frontend decide qué tarjetas mostrar con personalId)
      personalId: esVeterinario ? vinculo.personalId : null,
      licencia: vinculo.licencia,
      especialidad: vinculo.especialidad,
      presentacion: vinculo.presentacion ?? "",
    },
    clinica: {
      id: vinculo.clinicaId,
      nombreComercial: vinculo.nombreComercial,
      direccion: vinculo.direccion,
      logoUrl: vinculo.logoUrl,
    },
    horario,
  };
}