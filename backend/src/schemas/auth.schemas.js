import { z } from "zod";

const correo = z
  .string("Escribe tu correo")
  .trim()
  .toLowerCase()
  .pipe(z.email("Correo no válido"));

const codigo = z.string("Escribe el código").trim().regex(/^\d{6}$/, "El código tiene 6 números");

const contrasena = z
  .string("Escribe tu nueva contraseña")
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(72, "La contraseña es demasiado larga");

export const esquemaSolicitarRecuperacion = z.object({ correo });
export const esquemaVerificarRecuperacion = z.object({ correo, codigo });
export const esquemaRestablecerContrasena = z.object({
  tokenRestablecimiento: z
    .string("Falta la verificación del código")
    .min(1, "Falta la verificación del código"),
  contrasenaNueva: contrasena,
});