

// SQL de las citas vistas desde la RECEPCIÓN de una clínica:
// listas del día, por confirmar, reprogramables, detalle con historial, confirmar y reprogramar.
// (Cancelar reutiliza cancelarCita de citas.repository.js: es la misma operación.)

import { pool } from "../config/db.js";

// Todo lo que muestran las tarjetas y el detalle de una cita.
// ce.codigo da SOLICITADA, CONFIRMADA, ATENCION, COMPLETADA, CANCELADA, AUSENTE:
// justo los nombres que usan las pantallas de recepción.
const SELECT_CITA = `
  SELECT ci.id, ci.fecha,
         TIME_FORMAT(ci.hora_inicio, '%H:%i') AS horaInicio,
         TIME_FORMAT(ci.hora_fin, '%H:%i') AS horaFin,
         ci.motivo_consulta AS motivoConsulta, ci.motivo_cancelacion AS motivoCancelacion,
         ci.es_emergencia AS esEmergencia, ci.prioridad, ci.persona_presentador AS personaPresentador,
         ci.estado_id AS estadoId, ce.codigo AS estado, ci.fecha_creacion AS fechaCreacion,
         (ci.creada_por_usuario_id = p.usuario_id) AS creadaPorPropietario,
         (SELECT MAX(h.fecha_hora) FROM cita_historial_estados h
           WHERE h.cita_id = ci.id AND h.estado_nuevo_id = 503) AS enConsultaDesde,
         m.id AS mascotaId, m.nombre AS mascotaNombre, m.codigo_unico AS mascotaCodigo,
         m.sexo AS mascotaSexo, m.edad_actual_meses AS mascotaEdadMeses,
         e.nombre AS especie, r.nombre AS raza,
         p.id AS propietarioId, up.nombre_completo AS propietarioNombre,
         up.telefono AS propietarioTelefono, up.correo AS propietarioCorreo,
         pc.id AS vetId, uv.nombre_completo AS vetNombre, esp.nombre AS vetEspecialidad
    FROM citas ci
    JOIN catalogo_estados ce   ON ce.id = ci.estado_id AND ce.entidad = 'CITA'
    JOIN v_mascotas m          ON m.id = ci.mascota_id
    JOIN especies e            ON e.id = m.especie_id
    LEFT JOIN razas r          ON r.id = m.raza_id
    JOIN propietarios p        ON p.id = m.propietario_id
    JOIN usuarios up           ON up.id = p.usuario_id
    JOIN personal_clinica pc   ON pc.id = ci.veterinario_id
    JOIN usuarios uv           ON uv.id = pc.usuario_id
    LEFT JOIN perfil_veterinario pv ON pv.usuario_id = pc.usuario_id
    LEFT JOIN especialidades esp    ON esp.id = pv.especialidad_id`;

// Todas las citas de un día en mi clínica (también las canceladas: el resumen las cuenta)
export async function delDia(clinicaId, fecha) {
  const [filas] = await pool.query(
    `${SELECT_CITA} WHERE pc.clinica_id = ? AND ci.fecha = ? ORDER BY ci.hora_inicio`,
    [clinicaId, fecha]
  );
  return filas;
}

// Por confirmar: solicitadas (501) de hoy en adelante
export async function solicitadas(clinicaId, desde) {
  const [filas] = await pool.query(
    `${SELECT_CITA}
      WHERE pc.clinica_id = ? AND ci.estado_id = 501 AND ci.fecha >= ?
      ORDER BY ci.fecha, ci.hora_inicio`,
    [clinicaId, desde]
  );
  return filas;
}

// Se pueden reprogramar: solicitadas o confirmadas, de hoy en adelante, que NO sean emergencias
export async function reprogramables(clinicaId, desde) {
  const [filas] = await pool.query(
    `${SELECT_CITA}
      WHERE pc.clinica_id = ? AND ci.estado_id IN (501, 502) AND ci.es_emergencia = 0 AND ci.fecha >= ?
      ORDER BY ci.fecha, ci.hora_inicio`,
    [clinicaId, desde]
  );
  return filas;
}

// Una cita, solo si es de MI clínica
export async function buscar(citaId, clinicaId) {
  const [filas] = await pool.query(`${SELECT_CITA} WHERE ci.id = ? AND pc.clinica_id = ?`, [citaId, clinicaId]);
  return filas[0] ?? null;
}

// Historial: cambios de estado + reprogramaciones, en orden
export async function historial(citaId) {
  const [filas] = await pool.query(
    `SELECT h.fecha_hora AS fecha, ce.nombre AS titulo, u.nombre_completo AS quien, h.motivo
       FROM cita_historial_estados h
       JOIN catalogo_estados ce ON ce.id = h.estado_nuevo_id AND ce.entidad = 'CITA'
       JOIN usuarios u          ON u.id = h.cambiado_por_usuario_id
      WHERE h.cita_id = ?
     UNION ALL
     SELECT r.fecha_hora, 'Reprogramada', u.nombre_completo, r.motivo
       FROM cita_reprogramaciones r
       JOIN usuarios u ON u.id = r.reprogramada_por_usuario_id
      WHERE r.cita_id = ?
     ORDER BY fecha`,
    [citaId, citaId]
  );
  return filas;
}

// 501 → 502. Devuelve false si la cita ya no estaba en 501 (otra persona la cambió antes)
export async function confirmar(citaId, usuarioId) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const [resultado] = await conexion.query(
      "UPDATE citas SET estado_id = 502 WHERE id = ? AND estado_id = 501",
      [citaId]
    );
    if (resultado.affectedRows === 0) {
      await conexion.rollback();
      return false;
    }
    await conexion.query(
      `INSERT INTO cita_historial_estados (cita_id, estado_anterior_id, estado_nuevo_id, cambiado_por_usuario_id)
       VALUES (?, 501, 502, ?)`,
      [citaId, usuarioId]
    );
    await conexion.commit();
    return true;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

// Cambia fecha/hora/veterinario y guarda cómo estaba antes en cita_reprogramaciones.
// El estado NO cambia (una solicitada sigue solicitada). Devuelve false si la cita cambió por debajo.
export async function reprogramar(d) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const [resultado] = await conexion.query(
      `UPDATE citas
          SET veterinario_id = ?, fecha = ?, hora_inicio = ?, hora_fin = ?
        WHERE id = ? AND estado_id = ? AND fecha = ? AND hora_inicio = ?`,
      [d.veterinarioId, d.fecha, d.horaInicio, d.horaFin, d.citaId, d.estadoId, d.fechaAnterior, d.horaAnterior]
    );
    if (resultado.affectedRows === 0) {
      await conexion.rollback();
      return false;
    }
    await conexion.query(
      `INSERT INTO cita_reprogramaciones
         (cita_id, fecha_anterior, hora_inicio_anterior, veterinario_anterior_id,
          fecha_nueva, hora_inicio_nueva, veterinario_nuevo_id, motivo, reprogramada_por_usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        d.citaId, d.fechaAnterior, d.horaAnterior, d.veterinarioAnteriorId,
        d.fecha, d.horaInicio, d.veterinarioId, d.motivo, d.usuarioId,
      ]
    );
    await conexion.commit();
    return true;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}