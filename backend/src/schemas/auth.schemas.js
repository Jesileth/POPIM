import { z } from "zod";

const correo = z
  .string("Escribe tu correo")
  .trim()
  .toLowerCase()
  .pipe(z.email("Correo no válido"));

export const esquemaSolicitarRecuperacion = z.object({ correo });