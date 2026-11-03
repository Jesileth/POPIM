
///

import { ErrorHttp } from "../utils/errores.js";
import { DIAS_SEMANA, aMinutos, deMinutos, hoyLocal, ahoraEnMinutos } from "../utils/fechas.js";
import * as agendaRepo from "../repositories/agenda.repository.js";

export async function clinicas() {
  return { clinicas: await agendaRepo.listarClinicas() };
}

export async function veterinarios(clinicaId) {
  const { filas, horarios } = await agendaRepo.listarVeterinarios(clinicaId);

  return {
    veterinarios: filas.map((v) => ({
      ...v,
      horarios: horarios
        .filter((h) => h.personalId === v.id)
        .map((h) => ({
          diaSemana: h.diaSemana,
          horaInicio: h.horaInicio.slice(0, 5),
          horaFin: h.horaFin.slice(0, 5),
        })),
    })),
  };
}
// Convierte un "2026-11-05 08:00:00" en minutos dentro del día pedido
function minutosEnElDia(fechaHora, fecha) {
  const dia = fechaHora.slice(0, 10);
  if (dia < fecha) return 0;
  if (dia > fecha) return 1440;
  return aMinutos(fechaHora.slice(11, 16));
}

export async function disponibilidad(veterinarioId, fecha) {
  const diaSemana = DIAS_SEMANA[new Date(`${fecha}T00:00:00`).getDay()];
  const { vet, horarios, citas, bloqueos } = await agendaRepo.datosDeAgenda(
    veterinarioId, fecha, diaSemana
  );
  if (!vet) throw new ErrorHttp(404, "No encontramos al veterinario");

  const duracion = vet.duracion;
  const ocupados = citas.map((c) => [aMinutos(c.horaInicio.slice(0, 5)), aMinutos(c.horaFin.slice(0, 5))]);
  const bloqueados = bloqueos.map((b) => [minutosEnElDia(b.inicio, fecha), minutosEnElDia(b.fin, fecha)]);

  const esHoy = fecha === hoyLocal();
  const ahora = ahoraEnMinutos();

  const bloques = [];
  for (const h of horarios) {
    const finJornada = aMinutos(h.horaFin.slice(0, 5));
    for (let inicio = aMinutos(h.horaInicio.slice(0, 5)); inicio + duracion <= finJornada; inicio += duracion) {
      const fin = inicio + duracion;
      const choca = (rango) => inicio < rango[1] && fin > rango[0];
      const yaPaso = esHoy && inicio <= ahora;

      bloques.push({
        horaInicio: deMinutos(inicio),
        horaFin: deMinutos(fin),
        disponible: !yaPaso && !ocupados.some(choca) && !bloqueados.some(choca),
      });
    }
  }
  return { fecha, bloques };
}