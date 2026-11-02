// ErrorHttp: Es una clase personalizada para lanzar errores estructurados que luego un middleware de Express captura y convierte en respuestas JSON con el código de estado adecuado
// toLowerCase convierte una cadena de texto a minuscula
// se vuelve a validar en caso de que no se haga bien en el frontend

import { ErrorHttp } from "../utils/errores.js";
import * as authService from "../services/auth.service.js";

const texto = (v) => (typeof v === "string" ? v.trim() : "");

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