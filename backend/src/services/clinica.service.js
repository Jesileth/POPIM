

// Reglas del portal de la clínica (recepción): agenda, propietarios y crear citas.
// Siempre se trabaja con personal.clinicaId, que viene del middleware cargarPersonal.

import { ErrorHttp } from "../utils/errores.js";
import { DIAS_SEMANA, deMinutos, hoyLocal, ahoraEnMinutos } from "../utils/fechas.js";
import * as clinicaRepo from "../repositories/clinica.repository.js";
import * as agendaRepo from "../repositories/agenda.repository.js";
import * as agendaService from "./agenda.service.js";

const MSG_OCUPADO = "Ese horario acaba de ser reservado. Elige otro.";

// 30 → "2 años y 6 meses" (lo muestra la tarjeta de la mascota al agendar)
function textoEdad(meses) {
  if (meses === null || meses === undefined) return "";
  if (meses < 1) return "Menos de 1 mes";
  if (meses < 12) return `${meses} ${meses === 1 ? "mes" : "meses"}`;
  const anios = Math.floor(meses / 12);
  const resto = meses % 12;
  const t = `${anios} ${anios === 1 ? "año" : "años"}`;
  return resto === 0 ? t : `${t} y ${resto} ${resto === 1 ? "mes" : "meses"}`;
}

// ---------- Agenda del día (todos los veterinarios de la clínica) ----------
export async function agenda(clinicaId, fecha) {
  const diaSemana = DIAS_SEMANA[new Date(`${fecha}T00:00:00`).getDay()];

  // 4 consultas a la vez: un solo "viaje" de espera a Aiven
  const [{ filas, horarios }, citas, bloqueos, duracion] = await Promise.all([
    agendaRepo.listarVeterinarios(clinicaId),
    clinicaRepo.citasDelDia(clinicaId, fecha),
    clinicaRepo.bloqueosDelDia(clinicaId, fecha),
    clinicaRepo.duracionCita(clinicaId),
  ]);

  return {
    fecha,
    duracionBloqueMin: duracion,
    veterinarios: filas.map((v) => ({
      personalId: v.id,
      nombre: v.nombreCompleto,
      especialidad: v.especialidad,
      horario: horarios
        .filter((h) => h.personalId === v.id && h.diaSemana === diaSemana)
        .map((h) => ({ inicio: h.horaInicio, fin: h.horaFin })),
      // Un bloqueo puede empezar otro día: se recorta a las horas de ESTE día
      bloqueos: bloqueos
        .filter((b) => b.personalId === v.id)
        .map((b) => ({
          horaInicio: deMinutos(agendaService.minutosEnElDia(b.inicio, fecha)),
          horaFin: deMinutos(agendaService.minutosEnElDia(b.fin, fecha)),
          motivo: b.motivo ?? "No disponible",
        })),
      citas: citas
        .filter((c) => c.personalId === v.id)
        .map((c) => ({
          id: c.id,
          horaInicio: c.horaInicio,
          horaFin: c.horaFin,
          estadoId: c.estadoId,
          mascota: c.mascota,
          propietario: c.propietario,
          motivo: c.motivo,
          esEmergencia: Boolean(c.esEmergencia), // MySQL devuelve 0/1
        })),
    })),
  };
}

// ---------- Veterinarios ----------
export async function veterinarios(clinicaId) {
  const { filas } = await agendaRepo.listarVeterinarios(clinicaId);
  return filas.map((v) => ({ personalId: v.id, nombre: v.nombreCompleto, especialidad: v.especialidad }));
}

// Para emergencias: quién está libre y quién está atendiendo (y hasta qué hora)
export async function disponiblesAhora(clinicaId) {
  const [lista, ocupados] = await Promise.all([
    veterinarios(clinicaId),
    clinicaRepo.ocupadosAhora(clinicaId, hoyLocal()),
  ]);
  return lista.map((v) => {
    const o = ocupados.find((x) => x.personalId === v.personalId);
    return { ...v, ocupadoHasta: o ? o.ocupadoHasta.slice(0, 5) : null };
  });
}

// Horas libres de un veterinario de MI clínica (para reprogramar, control, referir)
export async function disponibilidad(clinicaId, personalId, fecha) {
  if (!(await clinicaRepo.veterinarioDeClinica(personalId, clinicaId)))
    throw new ErrorHttp(404, "Ese veterinario no es de tu clínica");
  return agendaService.disponibilidad(personalId, fecha);
}

// ---------- Propietarios ----------
export async function buscarPropietarios(texto) {
  return clinicaRepo.buscarPropietarios(texto);
}

export async function mascotasDePropietario(propietarioId) {
  const filas = await clinicaRepo.mascotasDePropietario(propietarioId);
  return filas.map((m) => ({
    id: m.id, nombre: m.nombre, codigoUnico: m.codigoUnico,
    especie: m.especie, raza: m.raza, edad: textoEdad(m.edadActualMeses),
  }));
}

// ---------- Crear citas ----------
// Revisa lo que vale para las dos: el veterinario es de mi clínica y la mascota está activa
async function validarVeterinarioYMascota(clinicaId, d) {
  const [vetOk, mascotaOk] = await Promise.all([
    clinicaRepo.veterinarioDeClinica(d.veterinarioId, clinicaId),
    clinicaRepo.mascotaActiva(d.mascotaId),
  ]);
  if (!vetOk) throw new ErrorHttp(400, "Elige un veterinario de tu clínica", "veterinarioId");
  if (!mascotaOk) throw new ErrorHttp(400, "La mascota no existe o está inactiva", "mascotaId");
}

// Cita normal: solo en un bloque LIBRE (la misma regla que usa el propietario)
export async function agendarCita(personal, usuarioId, d) {
  if (d.fecha < hoyLocal()) throw new ErrorHttp(400, "No puedes agendar en una fecha pasada", "fecha");
  await validarVeterinarioYMascota(personal.clinicaId, d);

  const { bloques } = await agendaService.disponibilidad(d.veterinarioId, d.fecha);
  const bloque = bloques.find((b) => b.horaInicio === d.horaInicio);
  if (!bloque) throw new ErrorHttp(400, "Ese horario no existe para el veterinario elegido", "horaInicio");
  if (!bloque.disponible) throw new ErrorHttp(409, MSG_OCUPADO, "horaInicio");

  try {
    const id = await clinicaRepo.crearCita({
      ...d, usuarioId, horaInicio: bloque.horaInicio, horaFin: bloque.horaFin, esEmergencia: false,
    });
    return { id };
  } catch (error) {
    // Otra persona reservó el mismo bloque en el mismo instante: la base lo rechazó con uq_bloque
    if (error.code === "ER_DUP_ENTRY" && (error.sqlMessage || "").includes("uq_bloque"))
      throw new ErrorHttp(409, MSG_OCUPADO, "horaInicio");
    throw error;
  }
}

// Emergencia: es AHORA. No busca bloque libre: se atiende aunque la agenda esté llena.
// Nace Confirmada (502) y marcada como emergencia; pasa a "En curso" cuando el veterinario la atiende.
export async function registrarEmergencia(personal, usuarioId, d) {
  await validarVeterinarioYMascota(personal.clinicaId, d);

  const duracion = await clinicaRepo.duracionCita(personal.clinicaId);
  const inicio = ahoraEnMinutos();
  const fin = Math.min(inicio + duracion, 23 * 60 + 59); // que no pase de las 23:59

  try {
    const id = await clinicaRepo.crearCita({
      ...d, usuarioId, fecha: hoyLocal(),
      
      // Con la hora EXACTA (ej. 10:52) no choca con la cita normal de las 10:00 en uq_bloque
      horaInicio: deMinutos(inicio), horaFin: deMinutos(fin),
      esEmergencia: true,
    });

    return { id };
    
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY" && (error.sqlMessage || "").includes("uq_bloque"))
      throw new ErrorHttp(409, "Ya registraste una emergencia para ese veterinario en este mismo minuto.");
    throw error;
  }
}