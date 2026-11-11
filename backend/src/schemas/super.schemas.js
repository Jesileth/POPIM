

// Moldes (Zod) de lo que manda el Super Administrador

import { z } from "zod";

export const DIAS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];
const NOMBRE_DIA = {
  LUNES: "lunes", MARTES: "martes", MIERCOLES: "miércoles", JUEVES: "jueves",
  VIERNES: "viernes", SABADO: "sábado", DOMINGO: "domingo",
};

const texto = (nombre, min, max) =>
  z.string(`Escribe ${nombre}`).trim().min(min, `Escribe ${nombre}`).max(max, `Máximo ${max} letras`);

// Acepta "08:00" o "08:00:00" y se queda con "08:00"
const hora = z
  .string("Escribe la hora")
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Hora no válida")
  .transform((h) => h.slice(0, 5));

// Opcionales: si viene vacío se guarda NULL
const telefonoOpcional = z
  .string()
  .trim()
  .regex(/^[0-9+\-]{7,20}$/, "Teléfono no válido")
  .or(z.literal(""))
  .nullish()
  .transform((v) => v || null);

const correoOpcional = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Correo no válido"))
  .or(z.literal(""))
  .nullish()
  .transform((v) => v || null);

const turno = z.object({
  dia: z.enum(DIAS, "Día no válido"),
  apertura: hora,
  cierre: hora,
});

// Lo que tienen en común registrar y editar
const datosClinica = z.object({
  razonSocial: texto("la razón social", 3, 150),
  nombreComercial: texto("el nombre comercial", 3, 120),
  ruc: z
    .string("Escribe el RUC")
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{5,20}$/, "RUC no válido (solo letras, números y guiones)"),
  direccion: texto("la dirección", 5, 255),
  telefono: telefonoOpcional,
  correo: correoOpcional,
  duracionCitaMin: z
    .number("Elige la duración de la cita")
    .refine((m) => [30, 45, 60].includes(m), "Elige 30, 45 o 60 minutos"),
  horarios: z
    .array(turno, "Agrega el horario de atención")
    .min(1, "Marca al menos un día con horario")
    .max(14, "Demasiados turnos"),
});

// Revisa los horarios: que cierre después de abrir, máximo 2 turnos por día y sin encimarse
function revisarHorarios(d, ctx) {
  const problema = (message) => ctx.addIssue({ code: "custom", message, path: ["horarios"] });

  for (const h of d.horarios) {
    if (h.cierre <= h.apertura) return problema(`El ${NOMBRE_DIA[h.dia]} la hora de cierre debe ser después de la apertura`);
  }
  for (const dia of DIAS) {
    const turnos = d.horarios
      .filter((h) => h.dia === dia)
      .sort((a, b) => a.apertura.localeCompare(b.apertura));
    if (turnos.length > 2) return problema(`El ${NOMBRE_DIA[dia]} tiene más de 2 turnos`);
    if (turnos.length === 2 && turnos[1].apertura < turnos[0].cierre)
      return problema(`Los turnos del ${NOMBRE_DIA[dia]} se enciman`);
  }
}

// PUT /super/clinicas/:id
export const esquemaEditarClinica = datosClinica.superRefine(revisarHorarios);

// POST /super/clinicas → la clínica + su administrador (el dueño)
// Los datos del administrador van "planos" (adminCorreo y no administrador.correo)
// para que, si algo falla, el campo del error sea el input exacto del formulario.
const datosAdministrador = {
  adminNombre: texto("el nombre del administrador", 3, 160),
  adminCorreo: z.string("Escribe el correo del administrador").trim().toLowerCase().pipe(z.email("Correo no válido")),
  adminTelefono: telefonoOpcional,
};

export const esquemaRegistrarClinica = datosClinica
  .extend({ activa: z.boolean().default(true), ...datosAdministrador })
  .superRefine(revisarHorarios);

// POST /super/clinicas/:id/administrador → para una clínica que no tiene
export const esquemaAsignarAdministrador = z.object(datosAdministrador);

// PATCH /super/clinicas/:id/estado
export const esquemaEstadoClinica = z.object({
  activa: z.boolean("Indica si la clínica queda activa o inactiva"),
});