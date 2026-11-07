
// Consultas SQL del portal de la clínica: agenda, propietarios y citas que crea recepción

import crypto from "node:crypto";
import { pool } from "../config/db.js";

// ---------- Agenda ----------

export async function duracionCita(clinicaId) {
  const [filas] = await pool.query("SELECT duracion_cita_min AS duracion FROM clinicas WHERE id = ?", [clinicaId]);
  return filas[0]?.duracion ?? 60;
}

// Citas de un día en toda la clínica (las canceladas no ocupan el bloque)
export async function citasDelDia(clinicaId, fecha) {
  const [filas] = await pool.query(
    `SELECT ci.id, ci.veterinario_id AS personalId,
            ci.hora_inicio AS horaInicio, ci.hora_fin AS horaFin,
            ci.estado_id AS estadoId, ci.motivo_consulta AS motivo, ci.es_emergencia AS esEmergencia,
            m.nombre AS mascota, u.nombre_completo AS propietario
       FROM citas ci
       JOIN personal_clinica pc ON pc.id = ci.veterinario_id
       JOIN mascotas m          ON m.id = ci.mascota_id
       JOIN propietarios p      ON p.id = m.propietario_id
       JOIN usuarios u          ON u.id = p.usuario_id
      WHERE pc.clinica_id = ? AND ci.fecha = ? AND ci.estado_id <> 505
      ORDER BY ci.hora_inicio`,
    [clinicaId, fecha]
  );
  return filas;
}

// Bloqueos (vacaciones, permisos, cirugías) que tocan ese día
export async function bloqueosDelDia(clinicaId, fecha) {
  const [filas] = await pool.query(
    `SELECT ba.personal_id AS personalId, ba.inicio, ba.fin, ba.motivo
       FROM bloqueos_agenda ba
       JOIN personal_clinica pc ON pc.id = ba.personal_id
      WHERE pc.clinica_id = ? AND ba.inicio < ? AND ba.fin > ?`,
    [clinicaId, `${fecha} 23:59:59`, `${fecha} 00:00:00`]
  );
  return filas;
}

// Hasta qué hora está ocupado cada veterinario con una cita EN CURSO (503) hoy
export async function ocupadosAhora(clinicaId, fecha) {
  const [filas] = await pool.query(
    `SELECT ci.veterinario_id AS personalId, MAX(ci.hora_fin) AS ocupadoHasta
       FROM citas ci
       JOIN personal_clinica pc ON pc.id = ci.veterinario_id
      WHERE pc.clinica_id = ? AND ci.fecha = ? AND ci.estado_id = 503
      GROUP BY ci.veterinario_id`,
    [clinicaId, fecha]
  );
  return filas;
}

// ¿Ese veterinario (personal_clinica.id) está activo y es de MI clínica?
export async function veterinarioDeClinica(personalId, clinicaId) {
  const [filas] = await pool.query(
    `SELECT 1
       FROM personal_clinica pc
       JOIN perfil_veterinario pv ON pv.usuario_id = pc.usuario_id
      WHERE pc.id = ? AND pc.clinica_id = ? AND pc.estado_id = 301
      LIMIT 1`,
    [personalId, clinicaId]
  );
  return filas.length > 0;
}

// ---------- Propietarios y mascotas ----------
// Los propietarios son de toda la red POPIM (no de una clínica): cualquier clínica los puede atender.

export async function buscarPropietarios(texto) {
  const comoTexto = `%${texto}%`;
  const sinGuiones = `%${texto.replace(/[\s-]/g, "")}%`; // "8888-1234" y "88881234" se encuentran igual
  const [filas] = await pool.query(
    `SELECT p.id, u.nombre_completo AS nombreCompleto, p.cedula, u.telefono, u.correo,
            u.estado_id AS estadoId
       FROM propietarios p
       JOIN usuarios u ON u.id = p.usuario_id
      WHERE u.nombre_completo LIKE ?
         OR REPLACE(p.cedula, '-', '') LIKE ?
         OR REPLACE(u.telefono, '-', '') LIKE ?
         OR u.correo LIKE ?
      ORDER BY u.nombre_completo
      LIMIT 20`,
    [comoTexto, sinGuiones, sinGuiones, comoTexto.toLowerCase()]
  );
  return filas;
}

export async function mascotasDePropietario(propietarioId) {
  const [filas] = await pool.query(
    `SELECT m.id, m.nombre, m.codigo_unico AS codigoUnico, m.edad_actual_meses AS edadActualMeses,
            e.nombre AS especie, r.nombre AS raza
       FROM v_mascotas m
       JOIN especies e   ON e.id = m.especie_id
       LEFT JOIN razas r ON r.id = m.raza_id
      WHERE m.propietario_id = ? AND m.estado_id = 401
      ORDER BY m.nombre`,
    [propietarioId]
  );
  return filas;
}

export async function mascotaActiva(mascotaId) {
  const [filas] = await pool.query("SELECT 1 FROM mascotas WHERE id = ? AND estado_id = 401 LIMIT 1", [mascotaId]);
  return filas.length > 0;
}

// ---------- Citas creadas por la clínica ----------
// Una sola función para cita normal y emergencia. Nace CONFIRMADA (502): la registra la propia clínica.
// Se guarda también en el historial de estados (patrón State).
export async function crearCita(d) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    const id = crypto.randomUUID();
    await conexion.query(
      `INSERT INTO citas
         (id, mascota_id, veterinario_id, creada_por_usuario_id, fecha, hora_inicio, hora_fin,
          motivo_consulta, es_emergencia, prioridad, persona_presentador, estado_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 502)`,
      [
        id, d.mascotaId, d.veterinarioId, d.usuarioId, d.fecha, d.horaInicio, d.horaFin,
        d.motivo, d.esEmergencia ? 1 : 0, d.prioridad ?? "NORMAL", d.personaPresentador ?? null,
      ]
    );

        await conexion.query(
      `INSERT INTO citas
         (id, mascota_id, veterinario_id, creada_por_usuario_id, fecha, hora_inicio, hora_fin,
          motivo_consulta, es_emergencia, prioridad, persona_presentador, referida_desde_consulta_id, estado_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 502)`,
      [
        id, d.mascotaId, d.veterinarioId, d.usuarioId, d.fecha, d.horaInicio, d.horaFin,
        d.motivo, d.esEmergencia ? 1 : 0, d.prioridad ?? "NORMAL", d.personaPresentador ?? null,
        d.referidaDesde ?? null, // consulta desde la que se agendó el control o se refirió
      ]
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