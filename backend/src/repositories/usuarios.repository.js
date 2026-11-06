
import crypto from "node:crypto";
import { pool } from "../config/db.js";
import { marcarUsado } from "./tokens.repository.js";

export async function crearPropietario({ nombreCompleto, correo, telefono, cedula, direccion, contrasenaHash }) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    const usuarioId = crypto.randomUUID();

    //insert en Usuarios

    await conexion.query(
      `INSERT INTO usuarios (id, nombre_completo, correo, telefono, contrasena, estado_id)
       VALUES (?, ?, ?, ?, ?, 102)`,
      [usuarioId, nombreCompleto, correo, telefono, contrasenaHash]
    );

    // asignamos el rol de propietario a este usuario
    await conexion.query(
      `INSERT INTO usuario_roles (usuario_id, rol_id)
       SELECT ?, id FROM roles WHERE codigo = 'PROPIETARIO'`,
      [usuarioId]
    );

    // insert en la de propietarios
    await conexion.query(
  "INSERT INTO propietarios (id, usuario_id, cedula, direccion) VALUES (?, ?, ?, ?)",
  [crypto.randomUUID(), usuarioId, cedula, direccion || null]
    );

    // si falla alguno el rollback deshace las anteriores

    await conexion.commit();
    return usuarioId;

  }
  
  catch (error) 
  {
    await conexion.rollback();
    throw error;
  }
 finally 
  {
    conexion.release();
  }
}


export async function buscarParaLogin(identificador) {
  const [filas] = await pool.query(
    `SELECT id, nombre_completo, correo, telefono, contrasena, foto_perfil_url,
            estado_id, intentos_fallidos
       FROM usuarios
      WHERE correo = ? OR telefono = ?
      LIMIT 1`,
    [identificador.toLowerCase(), identificador]
  );
  return filas[0] || null;
}

export async function obtenerPortales(usuarioId) {
  const [filas] = await pool.query(
    `SELECT DISTINCT r.portal
       FROM usuario_roles ur
       JOIN roles r ON r.id = ur.rol_id
      WHERE ur.usuario_id = ?`,
    [usuarioId]
  );
  return filas.map((f) => f.portal);
}

export async function registrarIntentoFallido(usuarioId, bloquear) {
  await pool.query(
    `UPDATE usuarios
        SET intentos_fallidos = intentos_fallidos + 1,
            estado_id = IF(?, 103, estado_id)
      WHERE id = ?`,
    [bloquear ? 1 : 0, usuarioId]
  );
}

export async function registrarAccesoExitoso(usuarioId) {
  await pool.query(
    "UPDATE usuarios SET intentos_fallidos = 0, ultimo_acceso = NOW() WHERE id = ?",
    [usuarioId]
  );
}


///

export async function buscarPorId(id) {
  const [filas] = await pool.query(
    `SELECT id, nombre_completo, correo, telefono, foto_perfil_url, estado_id
       FROM usuarios WHERE id = ?`,
    [id]
  );
  return filas[0] || null;
}

export async function obtenerPermisos(usuarioId) {
  const [filas] = await pool.query(
    "SELECT permiso FROM v_permisos_usuario WHERE usuario_id = ?",
    [usuarioId]
  );
  return filas.map((f) => f.permiso);
}

export async function obtenerMenu(usuarioId, portal) {
  const [filas] = await pool.query(
    `SELECT id, padre_id AS padreId, etiqueta, ruta, icono, orden
       FROM v_menu_usuario
      WHERE usuario_id = ? AND portal = ?
      ORDER BY orden`,
    [usuarioId, portal]
  );
  return filas;
}


// CORREO

export async function buscarPorCorreo(correo) {
  const [filas] = await pool.query(
    "SELECT id, nombre_completo AS nombreCompleto, estado_id AS estadoId FROM usuarios WHERE correo = ?",
    [correo]
  );
  return filas[0] ?? null;
}

// Gasta el código y cambia la contraseña en una sola transacción: o pasan las dos cosas o ninguna.
// Si la cuenta estaba bloqueada (103), la reactiva (102). Devuelve false si el código ya estaba gastado.
export async function cambiarContrasenaConCodigo({ usuarioId, tokenId, hash }) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    if (!(await marcarUsado(tokenId, conexion))) {
      await conexion.rollback();
      return false;
    }

    await conexion.query
    (
      "UPDATE usuarios SET contrasena = ?, intentos_fallidos = 0 WHERE id = ?",
      [hash, usuarioId]
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

export async function buscarContactoPorId(usuarioId) {
  const [filas] = await pool.query(
    "SELECT correo, nombre_completo AS nombreCompleto, estado_id AS estadoId FROM usuarios WHERE id = ?",
    [usuarioId]
  );
  return filas[0] ?? null;
}