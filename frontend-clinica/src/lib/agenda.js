
// agenda sin nada de html

import { aHora, aMinutos, hoyISO, minutosAhora } from "@/lib/fechas";

// Decide qué hay en el cuadrito de UN veterinario a UNA hora (en minutos)
function tipoDeCelda(vet, minuto, duracion, yaPaso) {

    // 1. ¿Hay una cita que empieza DENTRO de este bloque? (una emergencia puede empezar a las 10:52)
  //    Si hay dos (la cita de las 10:00 y una emergencia), se muestra la emergencia.
  const cita = vet.citas
    .filter((c) => aMinutos(c.horaInicio) >= minuto && aMinutos(c.horaInicio) < minuto + duracion)
    .sort((a, b) => Number(b.esEmergencia) - Number(a.esEmergencia))[0];
  if (cita) return { tipo: "cita", cita };

  // 2. ¿Algún bloqueo toca este bloque? (se cruzan si uno empieza antes de que el otro termine)
  const bloqueo = vet.bloqueos.find(
    (b) => aMinutos(b.horaInicio) < minuto + duracion && aMinutos(b.horaFin) > minuto,
  );
  if (bloqueo) return { tipo: "bloqueo", motivo: bloqueo.motivo };

  // 3. ¿El bloque completo cabe dentro de alguno de sus horarios?
  const atiende = vet.horario.some(
    (h) => aMinutos(h.inicio) <= minuto && minuto + duracion <= aMinutos(h.fin),
  );
  if (!atiende) return { tipo: "fuera" };

  // 4. Está libre… pero si la hora ya pasó, no se puede agendar
  if (yaPaso(minuto + duracion)) return { tipo: "pasado" };

  return { tipo: "libre", hora: aHora(minuto) };
}

// Convierte la respuesta del backend en filas listas para dibujar
export function armarCuadricula(agenda) {
  const duracion = agenda.duracionBloqueMin;
  const horarios = agenda.veterinarios.flatMap((v) => v.horario);
  const citas = agenda.veterinarios.flatMap((v) => v.citas);

  // Si nadie trabaja ese día (ej. domingo) y no hay citas, no hay filas
  if (horarios.length === 0 && citas.length === 0) return [];

  // Una cita fuera de horario (ej. emergencia a las 02:56) se "redondea" a su bloque (02:00),
  // así las filas siguen alineadas a las horas en punto.
  const alBloque = (minutos) => Math.floor(minutos / duracion) * duracion;

  // La agenda va desde lo más temprano hasta lo más tarde: horarios Y citas
  const inicio = Math.min(
    ...horarios.map((h) => aMinutos(h.inicio)),
    ...citas.map((c) => alBloque(aMinutos(c.horaInicio))),
  );
  const fin = Math.max(
    ...horarios.map((h) => aMinutos(h.fin)),
    ...citas.map((c) => alBloque(aMinutos(c.horaInicio)) + duracion),
  );

  // ¿Ya pasó esta hora? Solo aplica si la fecha es hoy o anterior
  const hoy = hoyISO();
  const ahora = minutosAhora();
  const yaPaso = (minutoFin) => agenda.fecha < hoy || (agenda.fecha === hoy && minutoFin <= ahora);

  const filas = [];
  for (let minuto = inicio; minuto + duracion <= fin; minuto += duracion) {
    filas.push({
      hora: aHora(minuto),
      celdas: agenda.veterinarios.map((vet) => ({
        personalId: vet.personalId,
        ...tipoDeCelda(vet, minuto, duracion, yaPaso),
      })),
    });
  }
  return filas;
}

// ---------------------------------------------------------------------------
// "Mi agenda" del veterinario: aquí las COLUMNAS son días, no veterinarios.
// Cada día trae { fecha, horario, bloqueos, citas }, la misma forma que un veterinario
// de la agenda de recepción; por eso tipoDeCelda sirve igual para los dos.
// ---------------------------------------------------------------------------
export function armarSemana(duracion, dias) {
  // Desde la hora más temprana hasta la más tarde de todos los días (horarios y citas,
  // por si una emergencia cae fuera de horario)
  // Igual que en recepción: una cita a las 02:56 abre la fila de las 02:00
  const alBloque = (m) => Math.floor(m / duracion) * duracion;
  const minutos = dias.flatMap((dia) => [
    ...dia.horario.flatMap((h) => [aMinutos(h.inicio), aMinutos(h.fin)]),
    ...dia.citas.flatMap((c) => [alBloque(aMinutos(c.horaInicio)), alBloque(aMinutos(c.horaInicio)) + duracion]),
  ]);

  if (minutos.length === 0) return [];

  const inicio = Math.min(...minutos);
  const fin = Math.max(...minutos);
  // El veterinario no agenda desde aquí: un bloque libre siempre se muestra "Libre", aunque ya haya pasado
  const nuncaPasa = () => false;

  const filas = [];
  for (let minuto = inicio; minuto + duracion <= fin; minuto += duracion) {
    filas.push({
      hora: aHora(minuto),
      celdas: dias.map((dia) => ({ fecha: dia.fecha, ...tipoDeCelda(dia, minuto, duracion, nuncaPasa) })),
    });
  }
  return filas;
}
