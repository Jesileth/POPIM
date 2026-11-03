
//

import crypto from "node:crypto";
import { pool } from "../config/db.js";

const SELECT_CITA = `
  SELECT ci.id, ci.fecha, ci.hora_inicio AS horaInicio, ci.hora_fin AS horaFin,
         ci.motivo_consulta AS motivoConsulta, ci.motivo_cancelacion AS motivoCancelacion,
         ce.id AS estadoId, ce.codigo AS estadoCodigo, ce.nombre AS estadoNombre,
         m.id AS mascotaId, m.nombre AS mascotaNombre, m.codigo_unico AS mascotaCodigo,
         pc.id AS vetId, u.nombre_completo AS vetNombre, esp.nombre AS vetEspecialidad,
         cl.id AS clinicaId, cl.nombre_comercial AS clinicaNombre, cl.direccion AS clinicaDireccion
    FROM citas ci
    JOIN catalogo_estados ce ON ce.id = ci.estado_id AND ce.entidad = 'CITA'
    JOIN mascotas m ON m.id = ci.mascota_id
    JOIN propietarios p ON p.id = m.propietario_id
    JOIN personal_clinica pc ON pc.id = ci.veterinario_id
    JOIN usuarios u ON u.id = pc.usuario_id
    JOIN clinicas cl ON cl.id = pc.clinica_id
    LEFT JOIN perfil_veterinario pv ON pv.usuario_id = pc.usuario_id
    LEFT JOIN especialidades esp ON esp.id = pv.especialidad_id`;

export async function mascotaActivaDeUsuario(mascotaId, usuarioId) {
  const [filas] = await pool.query(
    `SELECT 1 FROM mascotas m
       JOIN propietarios p ON p.id = m.propietario_id
      WHERE m.id = ? AND p.usuario_id = ? AND m.estado_id = 401 LIMIT 1`,
    [mascotaId, usuarioId]
  );
  return filas.length > 0;
}

export async function listarPorUsuario(usuarioId) {
  const [filas] = await pool.query(
    `${SELECT_CITA} WHERE p.usuario_id = ? ORDER BY ci.fecha DESC, ci.hora_inicio DESC`,
    [usuarioId]
  );
  return filas;
}

export async function buscarDeUsuario(citaId, usuarioId) {
  const [filas] = await pool.query(
    `${SELECT_CITA} WHERE ci.id = ? AND p.usuario_id = ?`,
    [citaId, usuarioId]
  );
  return filas[0] ?? null;
}

export async function crearCita(d) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    const id = crypto.randomUUID();
    await conexion.query(
      `INSERT INTO citas
         (id, mascota_id, veterinario_id, creada_por_usuario_id, fecha, hora_inicio, hora_fin, motivo_consulta)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, d.mascotaId, d.veterinarioId, d.usuarioId, d.fecha, d.horaInicio, d.horaFin, d.motivoConsulta]
    );

    // Toda cita nace SOLICITADA (501). Queda registrado en el historial de estados.
    await conexion.query(
      `INSERT INTO cita_historial_estados (cita_id, estado_anterior_id, estado_nuevo_id, cambiado_por_usuario_id)
       VALUES (?, NULL, 501, ?)`,
      [id, d.usuarioId]
    );

    await conexion.commit();
    return id;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

// Devuelve false si la cita cambió de estado justo antes (nadie la modificó por debajo de nosotros)
export async function cancelarCita(d) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    const [resultado] = await conexion.query(
      `UPDATE citas
          SET estado_id = 505, motivo_cancelacion = ?, cancelada_por_usuario_id = ?
        WHERE id = ? AND estado_id = ?`,
      [d.motivo, d.usuarioId, d.citaId, d.estadoAnteriorId]
    );
    if (resultado.affectedRows === 0) {
      await conexion.rollback();
      return false;
    }

    await conexion.query(
      `INSERT INTO cita_historial_estados
         (cita_id, estado_anterior_id, estado_nuevo_id, cambiado_por_usuario_id, motivo)
       VALUES (?, ?, 505, ?, ?)`,
      [d.citaId, d.estadoAnteriorId, d.usuarioId, d.motivo]
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