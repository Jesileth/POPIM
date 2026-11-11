
//

// Clínicas de toda la red (solo lo usa el Super Administrador). Aquí solo hay SQL.

import crypto from "node:crypto";
import { pool } from "../config/db.js";

// Columnas que comparten la lista y el detalle
const COLUMNAS = `c.id, c.razon_social AS razonSocial, c.nombre_comercial AS nombreComercial, c.ruc,
       c.direccion, c.telefono, c.correo, c.logo_url AS logoUrl, c.duracion_cita_min AS duracionCitaMin,
       c.estado_id AS estadoId, c.fecha_registro AS fechaRegistro`;

// Un dato del administrador activo de la clínica (el primero que se vinculó)
const DEL_ADMIN = (campo) => `(SELECT ${campo}
         FROM personal_clinica pa
         JOIN usuarios u       ON u.id = pa.usuario_id
         JOIN usuario_roles ur ON ur.usuario_id = u.id
         JOIN roles r          ON r.id = ur.rol_id AND r.codigo = 'ADMINISTRADOR'
        WHERE pa.clinica_id = c.id AND pa.estado_id = 301
        ORDER BY pa.fecha_ingreso
        LIMIT 1)`;

// Lista con filtros opcionales: q (nombre, razón social o RUC) y estadoId (201 / 202)
export async function listar({ q, estadoId }) {
  const condiciones = [];
  const valores = [];
  if (q) {
    condiciones.push("(c.nombre_comercial LIKE ? OR c.razon_social LIKE ? OR c.ruc LIKE ?)");
    const patron = `%${q}%`;
    valores.push(patron, patron, patron);
  }
  if (estadoId) {
    condiciones.push("c.estado_id = ?");
    valores.push(estadoId);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";

  const [filas] = await pool.query(
    `SELECT ${COLUMNAS},
            ${DEL_ADMIN("u.nombre_completo")} AS adminNombre,
            ${DEL_ADMIN("u.estado_id")} AS adminEstadoId,
            (SELECT COUNT(*) FROM personal_clinica pc
              WHERE pc.clinica_id = c.id AND pc.estado_id = 301) AS personalActivo,
            (SELECT COUNT(*) FROM citas ci JOIN personal_clinica pv ON pv.id = ci.veterinario_id
              WHERE pv.clinica_id = c.id
                AND ci.fecha >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                AND ci.fecha <  DATE_FORMAT(CURDATE(), '%Y-%m-01') + INTERVAL 1 MONTH) AS citasMes,
            (SELECT COUNT(*) FROM citas ci JOIN personal_clinica pv ON pv.id = ci.veterinario_id
              WHERE pv.clinica_id = c.id AND ci.fecha >= CURDATE() AND ci.estado_id IN (501, 502)) AS citasFuturas
       FROM clinicas c
       ${where}
      ORDER BY c.estado_id, c.nombre_comercial`,
    valores
  );
  return filas;
}

export async function buscar(clinicaId) {
  const [filas] = await pool.query(`SELECT ${COLUMNAS} FROM clinicas c WHERE c.id = ?`, [clinicaId]);
  return filas[0] ?? null;
}

// Horario de atención, de lunes a domingo
export async function horariosDe(clinicaId) {
  const [filas] = await pool.query(
    `SELECT dia_semana AS dia,
            TIME_FORMAT(hora_apertura, '%H:%i') AS apertura,
            TIME_FORMAT(hora_cierre, '%H:%i')   AS cierre
       FROM horarios_clinica
      WHERE clinica_id = ?
      ORDER BY FIELD(dia_semana, 'LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'), hora_apertura`,
    [clinicaId]
  );
  return filas;
}

export async function administradorDe(clinicaId) {
  const [filas] = await pool.query(
    `SELECT u.id, u.nombre_completo AS nombreCompleto, u.correo, u.telefono, u.estado_id AS estadoId
       FROM personal_clinica pa
       JOIN usuarios u       ON u.id = pa.usuario_id
       JOIN usuario_roles ur ON ur.usuario_id = u.id
       JOIN roles r          ON r.id = ur.rol_id AND r.codigo = 'ADMINISTRADOR'
      WHERE pa.clinica_id = ? AND pa.estado_id = 301
      ORDER BY pa.fecha_ingreso
      LIMIT 1`,
    [clinicaId]
  );
  return filas[0] ?? null;
}

// Roles que la persona ya tiene en el portal de la clínica (RECEPCIONISTA, VETERINARIO...)
export async function rolesClinicaDe(usuarioId) {
  const [filas] = await pool.query(
    `SELECT r.codigo
       FROM usuario_roles ur
       JOIN roles r ON r.id = ur.rol_id
      WHERE ur.usuario_id = ? AND r.portal = 'CLINICA'`,
    [usuarioId]
  );
  return filas.map((f) => f.codigo);
}

// ¿Ya está vinculada (activa) a alguna clínica? Devuelve el nombre de esa clínica
export async function vinculoActivoDe(usuarioId) {
  const [filas] = await pool.query(
    `SELECT c.nombre_comercial AS clinica
       FROM personal_clinica pc
       JOIN clinicas c ON c.id = pc.clinica_id
      WHERE pc.usuario_id = ? AND pc.estado_id = 301
      LIMIT 1`,
    [usuarioId]
  );
  return filas[0] ?? null;
}

// Borra el horario anterior y guarda el nuevo (dentro de la transacción que la llama)
async function guardarHorarios(conexion, clinicaId, horarios) {
  await conexion.query("DELETE FROM horarios_clinica WHERE clinica_id = ?", [clinicaId]);
  // "VALUES ?" con una lista de listas inserta todas las filas en una sola consulta
  await conexion.query(
    "INSERT INTO horarios_clinica (clinica_id, dia_semana, hora_apertura, hora_cierre) VALUES ?",
    [horarios.map((h) => [clinicaId, h.dia, h.apertura, h.cierre])]
  );
}

// Le da a una persona el rol ADMINISTRADOR y la vincula a la clínica (dentro de una transacción).
// admin.existenteId = la persona ya tenía cuenta; si no, se crea PENDIENTE (101) y sin contraseña:
// la activará ella misma con "Activar mi cuenta" (ahí recibe el código).
async function vincularAdministrador(conexion, clinicaId, admin, creadoPor) {
  let adminId = admin.existenteId;
  if (!adminId) {
    adminId = crypto.randomUUID();
    await conexion.query(
      `INSERT INTO usuarios (id, nombre_completo, correo, telefono, estado_id, creado_por_usuario_id)
       VALUES (?, ?, ?, ?, 101, ?)`,
      [adminId, admin.nombreCompleto, admin.correo, admin.telefono, creadoPor]
    );
  }

  // IGNORE: si ya era administrador, el rol no se repite
  await conexion.query(
    "INSERT IGNORE INTO usuario_roles (usuario_id, rol_id) SELECT ?, id FROM roles WHERE codigo = 'ADMINISTRADOR'",
    [adminId]
  );

  // Si alguna vez estuvo en esta clínica (vínculo inactivo 302), uq_personal no deja otra fila:
  // ON DUPLICATE KEY UPDATE reactiva la que ya existe en vez de fallar
  await conexion.query(
    `INSERT INTO personal_clinica (id, usuario_id, clinica_id) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE estado_id = 301`,
    [crypto.randomUUID(), adminId, clinicaId]
  );
}

// Crea la clínica, su horario y su administrador, todo o nada.
export async function crear({ clinica, horarios, activa, admin, creadoPor }) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    // 1) La clínica (201 activa, 202 inactiva)
    const clinicaId = crypto.randomUUID();
    await conexion.query(
      `INSERT INTO clinicas (id, razon_social, nombre_comercial, ruc, direccion, telefono, correo, duracion_cita_min, estado_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clinicaId, clinica.razonSocial, clinica.nombreComercial, clinica.ruc, clinica.direccion,
        clinica.telefono, clinica.correo, clinica.duracionCitaMin, activa ? 201 : 202,
      ]
    );

    // 2) Su horario de atención
    await guardarHorarios(conexion, clinicaId, horarios);

    // 3) Su administrador
    await vincularAdministrador(conexion, clinicaId, admin, creadoPor);

    await conexion.commit();
    return clinicaId;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

// Asigna administrador a una clínica que ya existe (las de prueba no tenían)
export async function asignarAdministrador(clinicaId, admin, creadoPor) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    await vincularAdministrador(conexion, clinicaId, admin, creadoPor);
    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

// Edita datos y horario. Devuelve false si la clínica no existe.
export async function actualizar(clinicaId, { clinica, horarios }) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    const [resultado] = await conexion.query(
      `UPDATE clinicas
          SET razon_social = ?, nombre_comercial = ?, ruc = ?, direccion = ?,
              telefono = ?, correo = ?, duracion_cita_min = ?
        WHERE id = ?`,
      [
        clinica.razonSocial, clinica.nombreComercial, clinica.ruc, clinica.direccion,
        clinica.telefono, clinica.correo, clinica.duracionCitaMin, clinicaId,
      ]
    );
    if (resultado.affectedRows !== 1) {
      await conexion.rollback();
      return false;
    }

    await guardarHorarios(conexion, clinicaId, horarios);

    await conexion.commit();
    return true;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

export async function cambiarEstado(clinicaId, estadoId) {
  const [resultado] = await pool.query("UPDATE clinicas SET estado_id = ? WHERE id = ?", [estadoId, clinicaId]);
  return resultado.affectedRows === 1;
}