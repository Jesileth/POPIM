

// Horarios del personal y bloqueos de agenda (lo usa el Administrador). Aquí solo hay SQL.
// Son las MISMAS tablas que ya leen la agenda de recepción y la disponibilidad del propietario:
// lo que se guarda aquí se ve allá de inmediato.

import { pool } from "../config/db.js";

// Horario de atención de la clínica (para que los turnos queden dentro) y la duración de cita
export async function horarioClinica(clinicaId) {
  const [[filas], [[clinica]]] = await Promise.all([
    pool.query(
      `SELECT dia_semana AS dia,
              TIME_FORMAT(hora_apertura, '%H:%i') AS apertura,
              TIME_FORMAT(hora_cierre, '%H:%i')   AS cierre
         FROM horarios_clinica
        WHERE clinica_id = ?
        ORDER BY FIELD(dia_semana, 'LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'), hora_apertura`,
      [clinicaId]
    ),
    pool.query("SELECT duracion_cita_min AS duracionCitaMin FROM clinicas WHERE id = ?", [clinicaId]),
  ]);
  return { horario: filas, duracionCitaMin: clinica?.duracionCitaMin ?? 60 };
}

// Borra el horario semanal anterior y guarda el nuevo, todo o nada
export async function guardarHorario(personalId, turnos) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    await conexion.query("DELETE FROM horarios_personal WHERE personal_id = ?", [personalId]);
    // Si no hay turnos (por ejemplo, alguien que ya no atiende), solo se borra
    if (turnos.length > 0) {
      await conexion.query(
        "INSERT INTO horarios_personal (personal_id, dia_semana, hora_inicio, hora_fin) VALUES ?",
        [turnos.map((t) => [personalId, t.dia, t.inicio, t.fin])]
      );
    }
    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

// Citas por atender (solicitadas o confirmadas) de hoy en adelante, para avisar si quedan fuera del horario nuevo
export async function citasFuturas(personalId) {
  const [filas] = await pool.query(
    `SELECT fecha, TIME_FORMAT(hora_inicio, '%H:%i') AS horaInicio, TIME_FORMAT(hora_fin, '%H:%i') AS horaFin
       FROM citas
      WHERE veterinario_id = ? AND fecha >= CURDATE() AND estado_id IN (501, 502)`,
    [personalId]
  );
  return filas;
}

// Bloqueos que todavía no terminan, con cuántas citas por atender chocan con cada uno.
// TIMESTAMP(fecha, hora) junta la fecha y la hora de la cita en un solo momento para compararlo.
export async function bloqueosDe(personalId) {
  const [filas] = await pool.query(
    `SELECT ba.id,
            DATE_FORMAT(ba.inicio, '%Y-%m-%dT%H:%i') AS inicio,
            DATE_FORMAT(ba.fin, '%Y-%m-%dT%H:%i')    AS fin,
            ba.motivo,
            (SELECT COUNT(*) FROM citas c
              WHERE c.veterinario_id = ba.personal_id AND c.estado_id IN (501, 502)
                AND TIMESTAMP(c.fecha, c.hora_inicio) < ba.fin
                AND TIMESTAMP(c.fecha, c.hora_fin)    > ba.inicio) AS citasAfectadas
       FROM bloqueos_agenda ba
      WHERE ba.personal_id = ? AND ba.fin >= CURDATE()
      ORDER BY ba.inicio`,
    [personalId]
  );
  return filas.map((b) => ({ ...b, citasAfectadas: Number(b.citasAfectadas) }));
}

export async function crearBloqueo(personalId, { inicio, fin, motivo }) {
  const [resultado] = await pool.query(
    "INSERT INTO bloqueos_agenda (personal_id, inicio, fin, motivo) VALUES (?, ?, ?, ?)",
    [personalId, inicio, fin, motivo]
  );
  return resultado.insertId;
}

// El bloqueo, SOLO si es de alguien de mi clínica (si no, null → 404)
export async function bloqueoDeMiClinica(bloqueoId, clinicaId) {
  const [filas] = await pool.query(
    `SELECT ba.id, ba.personal_id AS personalId
       FROM bloqueos_agenda ba
       JOIN personal_clinica pc ON pc.id = ba.personal_id
      WHERE ba.id = ? AND pc.clinica_id = ?`,
    [bloqueoId, clinicaId]
  );
  return filas[0] ?? null;
}

export async function borrarBloqueo(bloqueoId) {
  await pool.query("DELETE FROM bloqueos_agenda WHERE id = ?", [bloqueoId]);
}