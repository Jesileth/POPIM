

// Resumen del Inicio del Administrador. Aquí solo hay SQL.
// Todo se filtra por la clínica de la sesión. Las citas no guardan la clínica:
// se llega a ella por el veterinario (citas.veterinario_id → personal_clinica.clinica_id).
// Estados de cita: 501 solicitada, 502 confirmada, 503 en curso, 504 finalizada, 505 cancelada, 506 no asistió.

import { pool } from "../config/db.js";

// Rol del portal de clínica de un usuario (VETERINARIO, RECEPCIONISTA o ADMINISTRADOR)
const ROL = `(SELECT r.codigo FROM usuario_roles ur JOIN roles r ON r.id = ur.rol_id AND r.portal = 'CLINICA'
               WHERE ur.usuario_id = u.id LIMIT 1)`;

// Personal con vínculo activo: lo usan las tarjetas de arriba y los avisos
export async function personalActivo(clinicaId) {
  const [filas] = await pool.query(
    `SELECT pc.id AS personalId, u.nombre_completo AS nombreCompleto, u.estado_id AS cuentaEstadoId, ${ROL} AS rol,
            (SELECT COUNT(*) FROM horarios_personal hp WHERE hp.personal_id = pc.id) AS turnos
       FROM personal_clinica pc
       JOIN usuarios u ON u.id = pc.usuario_id
      WHERE pc.clinica_id = ? AND pc.estado_id = 301
      ORDER BY u.nombre_completo`,
    [clinicaId]
  );
  return filas.map((f) => ({ ...f, turnos: Number(f.turnos) }));
}

// Citas de HOY de cada veterinario, contadas por estado (las canceladas no cuentan).
// SUM(condición) suma 1 por cada fila donde la condición es verdadera.
export async function citasDeHoyPorVeterinario(clinicaId, hoy) {
  const [filas] = await pool.query(
    `SELECT pc.id AS personalId, u.nombre_completo AS nombreCompleto,
            COALESCE(SUM(ci.estado_id = 504), 0) AS finalizadas,
            COALESCE(SUM(ci.estado_id = 503), 0) AS enCurso,
            COALESCE(SUM(ci.estado_id = 502), 0) AS confirmadas,
            COALESCE(SUM(ci.estado_id = 501), 0) AS solicitadas,
            COALESCE(SUM(ci.estado_id = 506), 0) AS noAsistio
       FROM personal_clinica pc
       JOIN usuarios u ON u.id = pc.usuario_id
       LEFT JOIN citas ci ON ci.veterinario_id = pc.id AND ci.fecha = ? AND ci.estado_id <> 505
      WHERE pc.clinica_id = ? AND pc.estado_id = 301 AND ${ROL} = 'VETERINARIO'
      GROUP BY pc.id, u.nombre_completo
      ORDER BY u.nombre_completo`,
    [hoy, clinicaId]
  );
  return filas.map((f) => ({
    personalId: f.personalId,
    nombreCompleto: f.nombreCompleto,
    finalizadas: Number(f.finalizadas),
    enCurso: Number(f.enCurso),
    confirmadas: Number(f.confirmadas),
    solicitadas: Number(f.solicitadas),
    noAsistio: Number(f.noAsistio),
  }));
}

// Lo que va del mes: del día 1 a hoy
export async function resumenDelMes(clinicaId, hoy) {
  const [[fila]] = await pool.query(
    `SELECT COALESCE(SUM(ci.estado_id = 504), 0)                      AS atendidas,
            COALESCE(SUM(ci.es_emergencia = 1 AND ci.estado_id <> 505), 0) AS emergencias,
            COALESCE(SUM(ci.estado_id = 505), 0)                      AS cancelaciones
       FROM citas ci
       JOIN personal_clinica pc ON pc.id = ci.veterinario_id
      WHERE pc.clinica_id = ?
        AND ci.fecha >= DATE_FORMAT(?, '%Y-%m-01') AND ci.fecha <= ?`,
    [clinicaId, hoy, hoy]
  );

  // Propietario "nuevo en la clínica" = su PRIMERA cita aquí (no cancelada) cae en este mes
  const [[nuevos]] = await pool.query(
    `SELECT COUNT(*) AS total FROM (
        SELECT m.propietario_id, MIN(ci.fecha) AS primera
          FROM citas ci
          JOIN personal_clinica pc ON pc.id = ci.veterinario_id
          JOIN mascotas m          ON m.id = ci.mascota_id
         WHERE pc.clinica_id = ? AND ci.estado_id <> 505
         GROUP BY m.propietario_id
     ) t
     WHERE t.primera >= DATE_FORMAT(?, '%Y-%m-01') AND t.primera <= ?`,
    [clinicaId, hoy, hoy]
  );

  return {
    atendidas: Number(fila.atendidas),
    emergencias: Number(fila.emergencias),
    cancelaciones: Number(fila.cancelaciones),
    propietariosNuevos: Number(nuevos.total),
  };
}

// Bloqueos que todavía no terminan (los 5 más cercanos), con las citas por atender que chocan.
// "ahora" llega desde Node en hora local ("2026-11-12 22:30:00"): los bloqueos se guardan en hora local,
// y el NOW() de MySQL puede estar en otra zona horaria (Aiven usa UTC).
export async function proximosBloqueos(clinicaId, ahora) {
  const [filas] = await pool.query(
    `SELECT ba.id, pc.id AS personalId, u.nombre_completo AS nombreCompleto, ba.motivo,
            DATE_FORMAT(ba.inicio, '%Y-%m-%dT%H:%i') AS inicio,
            DATE_FORMAT(ba.fin, '%Y-%m-%dT%H:%i')    AS fin,
            (SELECT COUNT(*) FROM citas c
              WHERE c.veterinario_id = ba.personal_id AND c.estado_id IN (501, 502)
                AND TIMESTAMP(c.fecha, c.hora_inicio) < ba.fin
                AND TIMESTAMP(c.fecha, c.hora_fin)    > ba.inicio) AS citasAfectadas
       FROM bloqueos_agenda ba
       JOIN personal_clinica pc ON pc.id = ba.personal_id
       JOIN usuarios u          ON u.id = pc.usuario_id
      WHERE pc.clinica_id = ? AND pc.estado_id = 301 AND ba.fin > ?
      ORDER BY ba.inicio
      LIMIT 5`,
    [clinicaId, ahora]
  );
  return filas.map((b) => ({ ...b, citasAfectadas: Number(b.citasAfectadas) }));
}