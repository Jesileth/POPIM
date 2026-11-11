

// Mysql     de Propietarios y Mascotas vistos desde la clínica (recepción).
// Los propietarios y mascotas son de toda la red POPIM, no de una clínica.

import crypto from "node:crypto";
import { pool } from "../config/db.js";

// ---------- Propietarios ----------

// Lista con cuántas mascotas tiene cada uno y sus códigos PET (para buscar por código)
export async function listar() {
  const [filas] = await pool.query(
    `SELECT p.id, u.nombre_completo AS nombreCompleto, u.telefono, p.cedula, u.correo, p.direccion,
            ce.codigo AS estado,
            COUNT(m.id) AS totalMascotas,
            GROUP_CONCAT(m.codigo_unico) AS codigos
       FROM propietarios p
       JOIN usuarios u          ON u.id = p.usuario_id
       JOIN catalogo_estados ce ON ce.id = u.estado_id AND ce.entidad = 'USUARIO'
       LEFT JOIN mascotas m     ON m.propietario_id = p.id AND m.estado_id = 401
      GROUP BY p.id, u.nombre_completo, u.telefono, p.cedula, u.correo, p.direccion, ce.codigo
      ORDER BY u.nombre_completo
      LIMIT 500`
  );
  return filas;
}

export async function buscar(propietarioId) {
  const [filas] = await pool.query(
    `SELECT p.id, p.usuario_id AS usuarioId, u.nombre_completo AS nombreCompleto, u.telefono, p.cedula,
            u.correo, p.direccion, u.estado_id AS estadoId, ce.codigo AS estado,
            u.creado_por_usuario_id AS creadoPor
       FROM propietarios p
       JOIN usuarios u          ON u.id = p.usuario_id
       JOIN catalogo_estados ce ON ce.id = u.estado_id AND ce.entidad = 'USUARIO'
      WHERE p.id = ?`,
    [propietarioId]
  );
  return filas[0] ?? null;
}

// Propietario NUEVO + su primera mascota (con expediente y cartilla), TODO en una transacción.
// estadoId: 101 (el propio dueño: activará su cuenta) o 105 (provisional: lo trajo otra persona)
export async function crearConMascota(d) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    const usuarioId = crypto.randomUUID();
    const propietarioId = crypto.randomUUID();
    const mascotaId = crypto.randomUUID();

    await conexion.query(
      `INSERT INTO usuarios (id, nombre_completo, correo, telefono, estado_id, creado_por_usuario_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [usuarioId, d.nombreCompleto, d.correo, d.telefono, d.estadoId, d.creadoPor]
    );
    await conexion.query(
      "INSERT INTO usuario_roles (usuario_id, rol_id) SELECT ?, id FROM roles WHERE codigo = 'PROPIETARIO'",
      [usuarioId]
    );
    await conexion.query(
      "INSERT INTO propietarios (id, usuario_id, cedula, direccion) VALUES (?, ?, ?, ?)",
      [propietarioId, usuarioId, d.cedula, d.direccion]
    );
    await insertarMascota(conexion, { ...d.mascota, mascotaId, propietarioId, creadoPor: d.creadoPor });

    await conexion.commit();
    return { propietarioId, mascotaId };
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

// Solo si lo registró una clínica (creado_por_usuario_id) y la cuenta NO está activa
export async function actualizar(propietarioId, usuarioId, d) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    await conexion.query(
      "UPDATE usuarios SET nombre_completo = ?, telefono = ?, correo = ? WHERE id = ?",
      [d.nombreCompleto, d.telefono, d.correo, usuarioId]
    );
    await conexion.query(
      "UPDATE propietarios SET cedula = ?, direccion = ? WHERE id = ?",
      [d.cedula, d.direccion, propietarioId]
    );
    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

// ---------- Mascotas ----------

const SELECT_MASCOTA = `
  SELECT m.id, m.nombre, m.codigo_unico AS codigoUnico, m.sexo, m.edad_actual_meses AS edadActualMeses,
         e.nombre AS especie, COALESCE(r.nombre, 'Mestizo') AS raza,
         p.id AS propietarioId, u.nombre_completo AS propietarioNombre, u.telefono AS propietarioTelefono
    FROM v_mascotas m
    JOIN especies e     ON e.id = m.especie_id
    LEFT JOIN razas r   ON r.id = m.raza_id
    JOIN propietarios p ON p.id = m.propietario_id
    JOIN usuarios u     ON u.id = p.usuario_id`;

export async function listarMascotas() {
  const [filas] = await pool.query(`${SELECT_MASCOTA} WHERE m.estado_id = 401 ORDER BY m.nombre LIMIT 500`);
  return filas;
}

export async function mascotasDe(propietarioId) {
  const [filas] = await pool.query(
    `${SELECT_MASCOTA} WHERE m.propietario_id = ? AND m.estado_id = 401 ORDER BY m.nombre`,
    [propietarioId]
  );
  return filas;
}

export async function buscarMascota(mascotaId) {
  const [filas] = await pool.query(`${SELECT_MASCOTA} WHERE m.id = ?`, [mascotaId]);
  return filas[0] ?? null;
}

// Citas de la mascota en MI clínica (recepción no ve diagnósticos: solo la cita)
export async function citasDeMascota(mascotaId, clinicaId) {
  const [filas] = await pool.query(
    `SELECT ci.id, ci.fecha, ci.motivo_consulta AS motivoConsulta, ce.codigo AS estado,
            u.nombre_completo AS veterinario
       FROM citas ci
       JOIN catalogo_estados ce ON ce.id = ci.estado_id AND ce.entidad = 'CITA'
       JOIN personal_clinica pc ON pc.id = ci.veterinario_id
       JOIN usuarios u          ON u.id = pc.usuario_id
      WHERE ci.mascota_id = ? AND pc.clinica_id = ?
      ORDER BY ci.fecha DESC, ci.hora_inicio DESC`,
    [mascotaId, clinicaId]
  );
  return filas;
}

// Mascota nueva para un propietario que YA existe
export async function crearMascota(d) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const mascotaId = crypto.randomUUID();
    await insertarMascota(conexion, { ...d, mascotaId });
    await conexion.commit();
    return mascotaId;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

// Mascota + expediente + cartilla, dentro de la transacción que ya abrió quien la llama
async function insertarMascota(conexion, m) {
  await conexion.query(
    `INSERT INTO mascotas
       (id, codigo_unico, propietario_id, nombre, especie_id, raza_id, sexo, edad_valor, edad_unidad, fecha_nacimiento)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [m.mascotaId, m.codigoUnico, m.propietarioId, m.nombre, m.especieId, m.razaId, m.sexo,
     m.edad, m.unidadEdad, m.fechaNacimiento]
  );
  await conexion.query(
    "INSERT INTO expedientes_clinicos (id, mascota_id, creado_por_usuario_id) VALUES (?, ?, ?)",
    [crypto.randomUUID(), m.mascotaId, m.creadoPor]
  );
  await conexion.query("INSERT INTO cartillas (id, mascota_id) VALUES (?, ?)", [crypto.randomUUID(), m.mascotaId]);
}