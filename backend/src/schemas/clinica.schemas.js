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




// POST /clinica/citas/:id/cancelar
export const esquemaCancelarCita = z.object({
  motivo: z
    .string("Escribe el motivo")
    .trim()
    .min(5, "Escribe el motivo (mínimo 5 caracteres)")
    .max(255, "El motivo es demasiado largo (máximo 255 letras)"),
});

// POST /clinica/citas/:id/reprogramar
export const esquemaReprogramar = z.object({
  veterinarioId: idObligatorio("Elige un veterinario"),
  fecha: z.string("Elige una fecha").regex(/^\d{4}-\d{2}-\d{2}$/, "Elige una fecha válida"),
  horaInicio: z
    .string("Elige un bloque disponible")
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Elige un bloque disponible")
    .transform((h) => h.slice(0, 5)),
  motivo: z
    .string("Escribe el motivo")
    .trim()
    .min(5, "Escribe el motivo (mínimo 5 caracteres)")
    .max(255, "El motivo es demasiado largo (máximo 255 letras)"),
});


// ---------- Propietarios y mascotas (registrados en la clínica) ----------

// "" o null → null; si no, número
const numeroONulo = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

export const esquemaMascota = z
  .object({
    nombre: z.string("Escribe el nombre de la mascota").trim().min(1, "Escribe el nombre de la mascota").max(80, "Máximo 80 letras"),
    especieId: z.coerce.number("Elige la especie").int("Elige la especie").positive("Elige la especie"),
    razaId: z.preprocess(numeroONulo, z.number().int().positive().nullable()),
    sexo: z.enum(["MACHO", "HEMBRA"], "Elige el sexo"),
    edad: z.coerce.number("Escribe la edad").int("La edad va en números enteros").min(0, "Escribe una edad válida"),
    unidadEdad: z.enum(["ANIOS", "MESES"], "Elige si la edad es en años o en meses"),
    fechaNacimiento: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida")
      .or(z.literal(""))
      .nullish()
      .transform((v) => v || null),
  })
  // Una mascota de 101 años o 1201 meses es un error de tipeo
  .refine((d) => d.edad <= (d.unidadEdad === "ANIOS" ? 100 : 1200), { message: "Escribe una edad válida", path: ["edad"] });

const datosPropietario = z.object({
  nombreCompleto: z.string("Escribe el nombre").trim().min(3, "Escribe el nombre completo").max(160, "Máximo 160 letras"),
  telefono: z.string("Escribe el teléfono").trim().regex(/^[0-9+\-]{7,20}$/, "Teléfono no válido"),
  cedula: z.string().trim().max(20, "Cédula no válida").nullish().transform((v) => v || null),
  correo: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Correo no válido"))
    .or(z.literal(""))
    .nullish()
    .transform((v) => v || null),
  direccion: z.string().trim().max(255, "Máximo 255 letras").nullish().transform((v) => v || null),
});

// POST /clinica/propietarios → propietario + su primera mascota
export const esquemaRegistrarPropietario = z
  .object({
    tipo: z.enum(["PROPIETARIO", "OTRA"], "Elige quién trae a la mascota"), // OTRA = un menor o acompañante
    propietario: datosPropietario,
    mascota: esquemaMascota,
  })
  // Si viene el propio dueño, la cédula es obligatoria
  .refine((d) => d.tipo !== "PROPIETARIO" || d.propietario.cedula, {
    message: "Escribe la cédula del propietario",
    path: ["cedula"],
  });

// PUT /clinica/propietarios/:id
export const esquemaEditarPropietario = datosPropietario;