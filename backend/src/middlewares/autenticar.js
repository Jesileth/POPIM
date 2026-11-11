// lee la cookie y verifica si es autentica
import jwt from "jsonwebtoken";
import { ErrorHttp } from "../utils/errores.js";

export function autenticar(req, res, next) {
  const token = req.cookies?.popim_token;
  if (!token) throw new ErrorHttp(401, "Debes iniciar sesión");

  try {
    const datos = jwt.verify(token, process.env.JWT_SECRET);
    req.usuarioId = datos.sub;
    req.portal = datos.portal;
    next();
  } catch {
    throw new ErrorHttp(401, "Tu sesión expiró, inicia sesión de nuevo");
  }
}