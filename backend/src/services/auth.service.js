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

export async function registrarPropietario(datos) {
    // encriptamos la contraseña antes de guardarla en la bd
  const contrasenaHash = await bcrypt.hash(datos.contrasena, 12);

  try {
    const id = await usuariosRepo.crearPropietario({
      nombreCompleto: datos.nombreCompleto,
      correo: datos.correo,
      telefono: datos.telefono,
      cedula: datos.cedula,
      direccion: datos.direccion,
      contrasenaHash,
    });
    return { id };
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
}

async function armarSesion(usuario, portal) {
  const [permisos, menu] = await Promise.all([
    usuariosRepo.obtenerPermisos(usuario.id),
    usuariosRepo.obtenerMenu(usuario.id, portal),
  ]);
  return {
    usuario: {
      id: usuario.id,
      nombreCompleto: usuario.nombre_completo,
      correo: usuario.correo,
      telefono: usuario.telefono,
      fotoPerfilUrl: usuario.foto_perfil_url,
      rol: portal,
    },
    menu,
    permisos,
  };
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
  await verificacion.validarCodigo(usuario.id, "RECUPERACION", codigo);
}

export async function restablecerContrasena(correo, codigo, contrasenaNueva) {
  const usuario = await usuarioRecuperable(correo);
  if (!usuario) throw ERROR_CODIGO();

  // Fuera de la transacción: así un intento fallido sí queda contado
  const token = await verificacion.validarCodigo(usuario.id, "RECUPERACION", codigo);
  const hash = await bcrypt.hash(contrasenaNueva, 12);

  const hecho = await usuariosRepo.cambiarContrasenaConCodigo({ usuarioId: usuario.id, tokenId: token.id, hash });
  if (!hecho) throw new ErrorHttp(400, "Este código ya fue utilizado", "codigo");

  try {
  enviarCorreo({
    para: correo,
    ...plantillaPasswordCambiada({
      nombre: usuario.nombreCompleto.split(" ")[0],
      fechaHora: fechaHoraManagua(),
    }),
  }).catch((error) => console.error("No se pudo enviar el aviso de contraseña cambiada:", error.message));
} catch (error) {
  console.error("No se pudo preparar el aviso de contraseña cambiada:", error.message);
}
}