// los servicios son las reglas
// decide que hacer y lanza errores


import bcrypt from "bcryptjs";
import { ErrorHttp } from "../utils/errores.js";
import * as usuariosRepo from "../repositories/usuarios.repository.js";
import jwt from "jsonwebtoken";

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

  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre_completo,
      correo: usuario.correo,
      telefono: usuario.telefono,
      fotoUrl: usuario.foto_perfil_url,
    },
  };
}