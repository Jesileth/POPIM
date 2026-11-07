//

// Moldes (Zod) de lo que manda el portal de la clínica

import { z } from "zod";

const idObligatorio = (mensaje) => z.string(mensaje).trim().min(1, mensaje);

const motivo = z
  .string("Escribe el motivo de la consulta")
  .trim()
  .min(3, "Escribe el motivo de la consulta")
  .max(255, "El motivo es demasiado largo (máximo 255 letras)");

// POST /clinica/citas → cita normal en un bloque libre de la agenda
export const esquemaCitaClinica = z.object({
  mascotaId: idObligatorio("Elige una mascota"),
  veterinarioId: idObligatorio("Elige un veterinario"),
  fecha: z.string("Elige una fecha").regex(/^\d{4}-\d{2}-\d{2}$/, "Elige una fecha válida"),
  // Acepta "08:00" o "08:00:00" y se queda con "08:00"
  horaInicio: z
    .string("Elige un horario")
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Elige un horario")
    .transform((h) => h.slice(0, 5)),
  motivo,
});

// POST /clinica/citas/emergencia → la fecha y la hora las pone el servidor (es "ahora")
export const esquemaEmergencia = z.object({
  mascotaId: idObligatorio("Elige una mascota"),
  veterinarioId: idObligatorio("Elige quién atenderá la emergencia"),
  prioridad: z.enum(["URGENTE", "CRITICA"], "Elige la prioridad"),
  motivo,
  
  // Quién la trajo (un hijo, un vecino…). Opcional: vacío = el propietario
  personaPresentador: z
    .string()
    .trim()
    .max(160, "El nombre es demasiado largo (máximo 160 letras)")
    .nullish()
    .transform((v) => v || null),
});

