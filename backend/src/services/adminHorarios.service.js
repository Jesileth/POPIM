
//

// Reglas de Horarios y bloqueos del Administrador.
// "yo" = req.personal de quien inició sesión: { id, clinicaId, rol }

import { ErrorHttp } from "../utils/errores.js";
import * as repo from "../repositories/adminHorarios.repository.js";
import * as personalRepo from "../repositories/personal.repository.js";
import * as adminPersonalRepo from "../repositories/adminPersonal.repository.js";
import { NOMBRE_DIA } from "../schemas/admin.schemas.js";

// getUTCDay() da 0 = domingo, 1 = lunes... → el nombre que usa el ENUM dia_semana
const DIA_DE_SEMANA = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
const diaDe = (fecha) => DIA_DE_SEMANA[new Date(`${fecha}T00:00:00Z`).getUTCDay()];

// La persona, solo si es de MI clínica (si no, 404)
async function personaDeMiClinica(personalId, yo) {
  const p = await adminPersonalRepo.buscarEnClinica(personalId, yo.clinicaId);
  if (!p) throw new ErrorHttp(404, "No encontramos a esa persona en tu clínica");
  return p;
}

// Todo lo que necesita la pantalla para una persona
export async function obtener(personalId, yo) {
  const p = await personaDeMiClinica(personalId, yo);
  const [horario, clinica, bloqueos] = await Promise.all([
    personalRepo.horariosDe(personalId),      // [{ dia, inicio, fin }] (ya existía)
    repo.horarioClinica(yo.clinicaId),
    repo.bloqueosDe(personalId),
  ]);
  return {
    persona: { personalId: p.personalId, nombreCompleto: p.nombreCompleto, rol: p.rol, vinculoActivo: p.vinculoEstadoId === 301 },
    horario,
    clinica,
    bloqueos,
  };
}

// Cada turno debe quedar dentro de algún horario de atención de la clínica ese día.
// Si la clínica todavía no tiene horario registrado, no se puede comparar y se deja pasar.
function revisarContraClinica(turnos, horarioClinica) {
  if (horarioClinica.length === 0) return;
  for (const t of turnos) {
    const abiertos = horarioClinica.filter((h) => h.dia === t.dia);
    if (abiertos.length === 0) throw new ErrorHttp(400, `La clínica no abre el ${NOMBRE_DIA[t.dia]}`, "turnos");
    const cabe = abiertos.some((h) => h.apertura <= t.inicio && t.fin <= h.cierre);
    if (!cabe) {
      const horas = abiertos.map((h) => `${h.apertura} – ${h.cierre}`).join(" y ");
      throw new ErrorHttp(400, `El ${NOMBRE_DIA[t.dia]} la clínica atiende ${horas}: el turno ${t.inicio} – ${t.fin} queda fuera`, "turnos");
    }
  }
}

// Reemplaza el horario semanal. Las citas ya agendadas NO se mueven:
// se avisa cuántas quedaron fuera para que la recepción las reprograme.
export async function guardarHorario(personalId, turnos, yo) {
  const p = await personaDeMiClinica(personalId, yo);
  if (p.vinculoEstadoId !== 301) throw new ErrorHttp(409, "Esa persona ya no está activa en tu clínica");

  const { horario: horarioClinica } = await repo.horarioClinica(yo.clinicaId);
  revisarContraClinica(turnos, horarioClinica);

  await repo.guardarHorario(personalId, turnos);

  // ¿Qué citas por atender ya no caben en ningún turno de su día?
  const citas = await repo.citasFuturas(personalId);
  const fuera = citas.filter((c) => {
    const turnosDelDia = turnos.filter((t) => t.dia === diaDe(c.fecha));
    return !turnosDelDia.some((t) => t.inicio <= c.horaInicio && c.horaFin <= t.fin);
  });

  return { horario: await personalRepo.horariosDe(personalId), citasFueraDeHorario: fuera.length };
}

export async function crearBloqueo(personalId, d, yo) {
  const p = await personaDeMiClinica(personalId, yo);
  if (p.vinculoEstadoId !== 301) throw new ErrorHttp(409, "Esa persona ya no está activa en tu clínica");

  const id = await repo.crearBloqueo(personalId, d);
  const bloqueos = await repo.bloqueosDe(personalId);
  // El bloqueo se guarda aunque choque con citas: la agenda ya no ofrecerá esas horas,
  // y la recepción ve cuáles citas debe reprogramar.
  return { bloqueos, citasAfectadas: bloqueos.find((b) => b.id === id)?.citasAfectadas ?? 0 };
}

export async function borrarBloqueo(bloqueoId, yo) {
  const b = await repo.bloqueoDeMiClinica(bloqueoId, yo.clinicaId);
  if (!b) throw new ErrorHttp(404, "No encontramos ese bloqueo en tu clínica");
  await repo.borrarBloqueo(bloqueoId);
  return { bloqueos: await repo.bloqueosDe(b.personalId) };
}