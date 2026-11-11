// ErrorHttp: Es una clase personalizada para lanzar errores estructurados que luego un middleware de Express captura y convierte en respuestas JSON con el código de estado adecuado
// toLowerCase convierte una cadena de texto a minuscula
// se vuelve a validar en caso de que no se haga bien en el frontend

import { ErrorHttp } from "../utils/errores.js";
import * as authService from "../services/auth.service.js";

const texto = (v) => (typeof v === "string" ? v.trim() : "");

function ponerCookieSesion(res, token, recordarme = false) {
  res.cookie("popim_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: (recordarme ? 30 * 24 : 12) * 3600 * 1000,
  });
}

export async function registro(req, res) {
  const nombreCompleto = texto(req.body.nombreCompleto);
  const correo = texto(req.body.correo).toLowerCase();
  const telefono = texto(req.body.telefono).replace(/\s+/g, "");
  const cedula = texto(req.body.cedula);
  const direccion = texto(req.body.direccion) || null;
  const contrasena = req.body.contrasena;

  if (nombreCompleto.length < 3) throw new ErrorHttp(400, "Escribe tu nombre completo", "nombreCompleto");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw new ErrorHttp(400, "Correo no válido", "correo");

  if (!/^[0-9+\-]{7,20}$/.test(telefono)) throw new ErrorHttp(400, "Teléfono no válido", "telefono");

  if (!cedula) throw new ErrorHttp(400, "Escribe tu cédula", "cedula");
  
  if (typeof contrasena !== "string" || contrasena.length < 8)
    throw new ErrorHttp(400, "La contraseña debe tener al menos 8 caracteres", "contrasena");

  if (contrasena.length > 72)
    throw new ErrorHttp(400, "La contraseña es demasiado larga", "contrasena");

  const creado = await authService.registrarPropietario({ nombreCompleto, correo, telefono, cedula, direccion, contrasena });
  res.status(201).json(creado);
}


// portales
export async function login(req, res) {
  const b = req.body ?? {};
  const identificador = texto(b.identificador);
  const contrasena = b.contrasena;
  const portal = texto(b.portal);

  if (!identificador) throw new ErrorHttp(400, "Escribe tu correo o teléfono", "identificador");
  if (typeof contrasena !== "string" || !contrasena)
    throw new ErrorHttp(400, "Escribe tu contraseña", "contrasena");

  const r = await authService.iniciarSesion({
    identificador,
    contrasena,
    portal,
    recordarme: Boolean(b.recordarme),
  });

  ponerCookieSesion(res, r.token, Boolean(b.recordarme));

    res.json(r.sesion);
}


//Para borrar una cookie 
  export async function sesion(req, res) {
    res.json(await authService.obtenerSesion(req.usuarioId, req.portal));
  }

export function logout(req, res) {
  res.clearCookie("popim_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  res.json({ mensaje: "Sesión cerrada" });
}

export async function solicitarRecuperacion(req, res) {
  await authService.solicitarRecuperacion(req.body.correo);
  res.json({ mensaje: "Si el correo está registrado, te enviamos un código." });
}

export async function verificarRecuperacion(req, res) {
  res.json(await authService.verificarRecuperacion(req.body.correo, req.body.codigo));
}

export async function restablecerContrasena(req, res) {
  await authService.restablecerContrasena(req.body.tokenRestablecimiento, req.body.contrasenaNueva);
  res.json({ mensaje: "Tu contraseña fue actualizada. Ya puedes iniciar sesión." });
}

export async function buscarPerfilPendiente(req, res) {
  res.json(await authService.buscarPerfilPendiente(req.body.identificador));
}

export async function activarCuenta(req, res) {
  const r = await authService.activarCuenta(req.body);

  if (!r.token) {
    return res.json({
      mensaje: "Tu cuenta fue activada. Ya puedes iniciar sesión.",
      sesionIniciada: false,
    });
  }

  ponerCookieSesion(res, r.token);
  res.json({
    mensaje: "Tu cuenta fue activada.",
    sesionIniciada: true,
    sesion: r.sesion,
  });
}

export async function verificarActivacion(req, res) {
  res.json(await authService.verificarActivacion(req.body));
}