//

import crypto from "node:crypto";
import { pool } from "../config/db.js";

const SELECT_MASCOTA = `
  SELECT m.id, m.codigo_unico AS codigoUnico, m.nombre, m.sexo,
         m.edad_actual_meses AS edadActualMeses, m.foto_url AS fotoUrl,
         e.id AS especieId, e.nombre AS especieNombre,
         r.id AS razaId, r.nombre AS razaNombre
    FROM v_mascotas m
    JOIN especies e ON e.id = m.especie_id
    LEFT JOIN razas r ON r.id = m.raza_id`;

export async function obtenerPropietarioId(usuarioId) {
  const [filas] = await pool.query("SELECT id FROM propietarios WHERE usuario_id = ?", [usuarioId]);
  return filas[0]?.id ?? null;
}

export async function razaPerteneceAEspecie(razaId, especieId) {
  const [filas] = await pool.query("SELECT 1 FROM razas WHERE id = ? AND especie_id = ?", [razaId, especieId]);
  return filas.length > 0;
}

export async function listarPorPropietario(propietarioId) {
  const [filas] = await pool.query(
    `${SELECT_MASCOTA}
      WHERE m.propietario_id = ? AND m.estado_id = 401
      ORDER BY m.fecha_registro DESC`,
    [propietarioId]
  );
  return filas;
}

export async function buscarPorId(id) {
  const [filas] = await pool.query(`${SELECT_MASCOTA} WHERE m.id = ?`, [id]);
  return filas[0] ?? null;
}

export async function crearMascota(d) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    const mascotaId = crypto.randomUUID();
    await conexion.query(
      `INSERT INTO mascotas
         (id, codigo_unico, propietario_id, nombre, especie_id, raza_id, sexo,
          edad_valor, edad_unidad, fecha_nacimiento)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [mascotaId, d.codigoUnico, d.propietarioId, d.nombre, d.especieId, d.razaId,
       d.sexo, d.edadValor, d.edadUnidad, d.fechaNacimiento]
    );

    await conexion.query(
      "INSERT INTO expedientes_clinicos (id, mascota_id, creado_por_usuario_id) VALUES (?, ?, ?)",
      [crypto.randomUUID(), mascotaId, d.usuarioId]
    );

    await conexion.query(
      "INSERT INTO cartillas (id, mascota_id) VALUES (?, ?)",
      [crypto.randomUUID(), mascotaId]
    );

    await conexion.commit();
    return mascotaId;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

// Para la subida de archivos
export async function buscarDePropietario(mascotaId, propietarioId) {
  const [filas] = await pool.query(
    "SELECT id, foto_url FROM mascotas WHERE id = ? AND propietario_id = ?",
    [mascotaId, propietarioId]
  );
  return filas[0] ?? null;
}

export async function actualizarFoto(mascotaId, url) {
  await pool.query("UPDATE mascotas SET foto_url = ? WHERE id = ?", [url, mascotaId]);
}