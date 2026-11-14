
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


// ---------- Horarios y bloqueos ---------- //

export const DIAS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];
export const NOMBRE_DIA = {
  LUNES: "lunes", MARTES: "martes", MIERCOLES: "miércoles", JUEVES: "jueves",
  VIERNES: "viernes", SABADO: "sábado", DOMINGO: "domingo",
};

// Acepta "08:00" o "08:00:00" y se queda con "08:00"
const hora = z.string("Escribe la hora").regex(/^\d{2}:\d{2}(:\d{2})?$/, "Hora no válida").transform((h) => h.slice(0, 5));

// PUT /admin/horarios/:personalId → el horario semanal completo (reemplaza al anterior)
export const esquemaHorarioPersonal = z
  .object({
    turnos: z.array(z.object({ dia: z.enum(DIAS, "Día no válido"), inicio: hora, fin: hora }), "Manda los turnos").max(14, "Demasiados turnos"),
  })
  .superRefine(({ turnos }, ctx) => {
    const problema = (message) => ctx.addIssue({ code: "custom", message, path: ["turnos"] });
    for (const t of turnos) {
      if (t.fin <= t.inicio) return problema(`El ${NOMBRE_DIA[t.dia]} la hora de salida debe ser después de la de entrada`);
    }
    for (const dia of DIAS) {
      const delDia = turnos.filter((t) => t.dia === dia).sort((a, b) => a.inicio.localeCompare(b.inicio));
      if (delDia.length > 2) return problema(`El ${NOMBRE_DIA[dia]} tiene más de 2 turnos`);
      if (delDia.length === 2 && delDia[1].inicio < delDia[0].fin) return problema(`Los turnos del ${NOMBRE_DIA[dia]} se enciman`);
    }
  });

// El <input type="datetime-local"> manda "2026-11-20T08:00"; MySQL quiere "2026-11-20 08:00:00"
const fechaHora = (nombre) =>
  z.string(`Escribe ${nombre}`)
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, `${nombre[0].toUpperCase()}${nombre.slice(1)} no válida`)
    .transform((v) => `${v.replace("T", " ")}:00`);

// POST /admin/horarios/:personalId/bloqueos
export const esquemaBloqueo = z
  .object({
    inicio: fechaHora("la fecha de inicio"),
    fin: fechaHora("la fecha de fin"),
    motivo: z.string("Escribe el motivo").trim().min(3, "Escribe el motivo").max(150, "Máximo 150 letras"),
  })
  .refine((b) => b.fin > b.inicio, { message: "El fin debe ser después del inicio", path: ["fin"] });

  // ---------- Mi clínica ----------

// PUT /admin/clinica → lo único que el administrador puede cambiar de su clínica.
// Razón social, RUC, dirección y horario de atención los cambia POPIM (Super Administrador).
export const esquemaMiClinica = z.object({
  telefono: telefonoOpcional,
  correo: z.string().trim().toLowerCase().pipe(z.email("Correo no válido"))
    .or(z.literal("")).nullish().transform((v) => v || null),
  duracionCitaMin: z.number("Elige la duración de la cita").refine((m) => [30, 45, 60].includes(m), "Elige 30, 45 o 60 minutos"),
});