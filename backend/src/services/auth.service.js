// los servicios son las reglas
// decide que hacer y lanza errores


import bcrypt from "bcryptjs";
import { ErrorHttp } from "../utils/errores.js";
import * as usuariosRepo from "../repositories/usuarios.repository.js";
import jwt from "jsonwebtoken";
import * as verificacion from "./verificacion.service.js";
import { enviarCorreo } from "./correo.service.js";
import { plantillaRecuperacion } from "../plantillas/recuperacion.js";
import { plantillaPasswordCambiada } from "../plantillas/passwordCambiada.js";
import { fechaHoraManagua } from "../utils/fechas.js";
import { plantillaActivacion } from "../plantillas/activacion.js";
import * as personalRepo from "../repositories/personal.repository.js";

export async function registrarPropietario(datos) {
    // encriptamos la contraseña antes de guardarla en la bd
  const contrasenaHash = await bcrypt.hash(datos.contrasena, 12);

  try {
     await usuariosRepo.crearPropietario({
      nombreCompleto: datos.nombreCompleto,
      correo: datos.correo,
      telefono: datos.telefono,
      cedula: datos.cedula,
      direccion: datos.direccion,
      contrasenaHash,
    });
    // return { id };
  } 
  
  catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      const m = error.sqlMessage || "";
      if (m.includes("uq_usuarios_correo")) throw new ErrorHttp(409, "Este correo ya está registrado", "correo");
      if (m.includes("uq_usuarios_telefono")) throw new ErrorHttp(409, "Este teléfono ya está registrado", "telefono");
      if (m.includes("uq_prop_cedula")) throw new ErrorHttp(409, "Esta cédula ya está registrada", "cedula");
      throw new ErrorHttp(409, "Ya existe un registro con esos datos");
    }
    throw error;
  }
   // La cuenta nace en 101 (pendiente): se envía el código y se devuelven los tokens
  return buscarPerfilPendiente(datos.correo);
}

async function armarSesion(usuario, portal) {
  const [permisos, menu, vinculo] = await Promise.all([
    usuariosRepo.obtenerPermisos(usuario.id),
    usuariosRepo.obtenerMenu(usuario.id, portal),
    // Solo el personal de la clínica tiene vínculo (personal_clinica)
    portal === "CLINICA" ? personalRepo.buscarVinculo(usuario.id) : null,
  ]);

  const datosUsuario = {
    id: usuario.id,
    nombreCompleto: usuario.nombre_completo,
    correo: usuario.correo,
    telefono: usuario.telefono,
    fotoPerfilUrl: usuario.foto_perfil_url,
    rol: portal,
  };

  // Portal de la clínica: el frontend necesita el rol real, la clínica y (si es veterinario) su personalId
  if (vinculo) {
    Object.assign(datosUsuario, {
      rol: vinculo.rol, // RECEPCIONISTA, VETERINARIO, ADMINISTRADOR
      fotoUrl: usuario.foto_perfil_url, // el Encabezado del portal clínica lo lee con este nombre
      personalId: vinculo.personalId,
      especialidad: vinculo.especialidad, // null si no es veterinario
      clinica: { id: vinculo.clinicaId, nombreComercial: vinculo.nombreComercial, logoUrl: vinculo.logoUrl },
    });
  }
    else if (portal === "CLINICA") {
    // Sin vínculo con una clínica: es el Super Administrador (administra toda la red).
    // Leemos su rol real para que el frontend sepa quién es.
    Object.assign(datosUsuario, {
      rol: await usuariosRepo.obtenerRolDePortal(usuario.id, "CLINICA"), // "SUPER_ADMIN"
      fotoUrl: usuario.foto_perfil_url,
      clinica: null,
    });
  }
  return { usuario: datosUsuario, menu, permisos };
}



// PORTALES 
const PORTALES = ["PROPIETARIO", "CLINICA"];
const MAX_INTENTOS = 5;

export async function iniciarSesion({ identificador, contrasena, portal, recordarme }) {
  if (!PORTALES.includes(portal)) throw new ErrorHttp(400, "Portal no válido");

  const usuario = await usuariosRepo.buscarParaLogin(identificador);

  // Mismo mensaje si no existe o si la clave está mal: así no revelamos qué cuentas existen
  const credencialesMal = new ErrorHttp(401, "Correo/teléfono o contraseña incorrectos");
  if (!usuario || !usuario.contrasena) throw credencialesMal;

  if (usuario.estado_id === 103) throw new ErrorHttp(423, "Cuenta bloqueada por demasiados intentos");
  if (usuario.estado_id === 101) throw new ErrorHttp(403, "Tu cuenta aún no está activada");
  if (usuario.estado_id !== 102) throw new ErrorHttp(403, "Esta cuenta no está disponible");

  const coincide = await bcrypt.compare(contrasena, usuario.contrasena);
  if (!coincide) {
    const intentos = usuario.intentos_fallidos + 1;
    await usuariosRepo.registrarIntentoFallido(usuario.id, intentos >= MAX_INTENTOS);
    throw credencialesMal;
  }

  const portales = await usuariosRepo.obtenerPortales(usuario.id);
  if (!portales.includes(portal)) throw new ErrorHttp(403, "Esta cuenta no pertenece a este portal");

  await usuariosRepo.registrarAccesoExitoso(usuario.id);

  const token = jwt.sign({ sub: usuario.id, portal }, process.env.JWT_SECRET, {
    expiresIn: recordarme ? "30d" : "12h",
  });

    return { token, sesion: await armarSesion(usuario, portal) };
}

// verificación del token en cada inicio de sesión en caso de inactivación del usuario 
  export async function obtenerSesion(usuarioId, portal) {
    const usuario = await usuariosRepo.buscarPorId(usuarioId);
    if (!usuario || usuario.estado_id !== 102) throw new ErrorHttp(401, "Sesión no válida");
    return armarSesion(usuario, portal);
  }

const ESTADOS_RECUPERABLES = [102]; // solo cuentas activas

const ERROR_CODIGO = () => new ErrorHttp(400, "El código venció o no es válido. Pide uno nuevo.", "codigo");

async function usuarioRecuperable(correo) {
  const usuario = await usuariosRepo.buscarPorCorreo(correo);
  if (!usuario || !ESTADOS_RECUPERABLES.includes(usuario.estadoId)) return null;
  return usuario;
}

export async function solicitarRecuperacion(correo) {
  const usuario = await usuarioRecuperable(correo);
  if (!usuario) return; // no decimos si el correo existe o no

  try {
    const { codigo, minutos } = await verificacion.emitirCodigo(usuario.id, "RECUPERACION");
    const mensaje = plantillaRecuperacion({
      nombre: usuario.nombreCompleto.split(" ")[0],
      codigo,
      minutos,
    });
    // Sin await: la respuesta no espera al correo, así tarda lo mismo exista o no el usuario
    enviarCorreo({ para: correo, ...mensaje }).catch((error) =>
      console.error("No se pudo enviar el correo de recuperación:", error.message)
    );
  } catch (error) {
    if (error.estado !== 429) throw error; // 429 = pidió otro hace menos de 60 s: se calla igual
  }
}


export async function verificarRecuperacion(correo, codigo) {
  const usuario = await usuarioRecuperable(correo);
  if (!usuario) throw ERROR_CODIGO();

  const token = await verificacion.validarCodigo(usuario.id, "RECUPERACION", codigo);
  return { tokenRestablecimiento: verificacion.crearTokenRestablecimiento(usuario.id, token.id) };
}

export async function restablecerContrasena(tokenRestablecimiento, contrasenaNueva) {
  const { usuarioId, tokenId } = verificacion.leerTokenRestablecimiento(tokenRestablecimiento);

  const usuario = await usuariosRepo.buscarContactoPorId(usuarioId);
  if (!usuario || !ESTADOS_RECUPERABLES.includes(usuario.estadoId)) throw ERROR_CODIGO();

  const hash = await bcrypt.hash(contrasenaNueva, 12);

  const hecho = await usuariosRepo.cambiarContrasenaConCodigo({ usuarioId, tokenId, hash });
  if (!hecho) throw new ErrorHttp(400, "El código venció o ya fue utilizado", "codigo");

  try {
  enviarCorreo({
    para: usuario.correo,
    ...plantillaPasswordCambiada({
      nombre: usuario.nombreCompleto.split(" ")[0],
      fechaHora: fechaHoraManagua(),
    }),
  }).catch((error) => console.error("No se pudo enviar el aviso de contraseña cambiada:", error.message));
} catch (error) {
  console.error("No se pudo preparar el aviso de contraseña cambiada:", error.message);
}
}

function enmascararCorreo(correo) {
  const [usuario, dominio] = correo.split("@");
  return `${usuario.slice(0, 2)}${"*".repeat(Math.max(usuario.length - 2, 3))}@${dominio}`;
}

export async function buscarPerfilPendiente(identificador) {
  const perfil = await usuariosRepo.buscarPendientePorIdentificador(identificador);
  if (!perfil)
    throw new ErrorHttp(404, "No encontramos un perfil pendiente de activación con esos datos.", "identificador");
  if (!perfil.correo)
    throw new ErrorHttp(422, "Este perfil no tiene un correo registrado. Pídele a tu clínica que lo agregue.", "identificador");

  const { codigo, minutos } = await verificacion.emitirCodigo(perfil.id, "ACTIVACION");
  const mensaje = plantillaActivacion({
    nombre: perfil.nombreCompleto.split(" ")[0],
    codigo,
    minutos,
  });
  enviarCorreo({ para: perfil.correo, ...mensaje }).catch((error) =>
    console.error("No se pudo enviar el correo de activación:", error.message)
  );

  return {
    tokenActivacion: verificacion.crearTokenActivacion(perfil.id),
    correoEnmascarado: enmascararCorreo(perfil.correo),
    requiereContrasena: Boolean(perfil.sinContrasena),
  };
}

export async function verificarActivacion({ tokenActivacion, codigo }) {
  const { usuarioId } = verificacion.leerTokenActivacion(tokenActivacion);

  const perfil = await usuariosRepo.buscarContactoPorId(usuarioId);
  if (!perfil || perfil.estadoId !== 101) throw ERROR_CODIGO();

  const token = await verificacion.validarCodigo(usuarioId, "ACTIVACION", codigo);
  return {
    tokenConfirmacion: verificacion.crearTokenConfirmacion(usuarioId, token.id),
    requiereContrasena: Boolean(perfil.sinContrasena),
  };
}


export async function activarCuenta({ tokenConfirmacion, contrasena }) {
  const { usuarioId, tokenId } = verificacion.leerTokenConfirmacion(tokenConfirmacion);

  const perfil = await usuariosRepo.buscarContactoPorId(usuarioId);
  if (!perfil || perfil.estadoId !== 101) throw ERROR_CODIGO();

  if (perfil.sinContrasena && !contrasena)
    throw new ErrorHttp(400, "Elige una contraseña para tu cuenta", "contrasena");

  // Solo se fija contraseña si el perfil no tenía: nunca se pisa la de una cuenta que ya la tiene
  const hash = perfil.sinContrasena ? await bcrypt.hash(contrasena, 12) : null;

  const hecho = await usuariosRepo.activarCuentaConCodigo({ usuarioId, tokenId, hash });
  if (!hecho) throw new ErrorHttp(400, "El código venció o ya fue utilizado", "codigo");

  // --- CÓDIGO AGREGADO A PARTIR DE AQUÍ ---
  // La cuenta ya está activa (102). Si es de propietario, abrimos sesión:
  // demostró que controla el correo con el código, así que no repetimos el login.
  const portales = await usuariosRepo.obtenerPortales(usuarioId);
  if (!portales.includes("PROPIETARIO")) return { token: null, sesion: null };

  const usuario = await usuariosRepo.buscarPorId(usuarioId);
  await usuariosRepo.registrarAccesoExitoso(usuarioId);

  const token = jwt.sign({ sub: usuarioId, portal: "PROPIETARIO" }, process.env.JWT_SECRET, {
    expiresIn: "12h",
  });

  return { token, sesion: await armarSesion(usuario, "PROPIETARIO") };
}