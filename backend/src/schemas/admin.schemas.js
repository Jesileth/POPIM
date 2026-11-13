
//

// Moldes (Zod) de lo que manda el Administrador de una clínica

import { z } from "zod";

// Roles que el administrador puede dar dentro de SU clínica
export const ROLES_PERSONAL = ["RECEPCIONISTA", "VETERINARIO", "ADMINISTRADOR"];

const texto = (nombre, min, max) =>
  z.string(`Escribe ${nombre}`).trim().min(min, `Escribe ${nombre}`).max(max, `Máximo ${max} letras`);

const telefonoOpcional = z
  .string()
  .trim()
  .regex(/^[0-9+\-]{7,20}$/, "Teléfono no válido")
  .or(z.literal(""))
  .nullish()
  .transform((v) => v || null);

const licencia = z
  .string("Escribe el número de licencia")
  .trim()
  .toUpperCase()
  .min(3, "Escribe el número de licencia")
  .max(40, "Máximo 40 letras");

// null = sin especialidad
const especialidadId = z.number("Elige la especialidad").int().positive().nullish().transform((v) => v ?? null);

// POST /admin/personal
export const esquemaVincularPersonal = z
  .object({
    correo: z.string("Escribe el correo").trim().toLowerCase().pipe(z.email("Correo no válido")),
    nombreCompleto: texto("el nombre completo", 3, 160),
    telefono: telefonoOpcional,
    rol: z.enum(ROLES_PERSONAL, "Elige el rol"),
    // Solo para veterinarios (por eso son opcionales aquí y se exigen abajo)
    licencia: licencia.nullish(),
    especialidadId,
    presentacion: z.string().trim().max(500, "Máximo 500 letras").nullish().transform((v) => v || null),
  })
  .superRefine((d, ctx) => {
    if (d.rol === "VETERINARIO" && !d.licencia) {
      ctx.addIssue({ code: "custom", message: "Escribe el número de licencia", path: ["licencia"] });
    }
  });

// PUT /admin/personal/:id/profesional
export const esquemaDatosProfesionales = z.object({ licencia, especialidadId });

// PATCH /admin/personal/:id/vinculo
export const esquemaVinculo = z.object({
  activo: z.boolean("Indica si el vínculo queda activo o inactivo"),
});