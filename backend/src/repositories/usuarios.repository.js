
import crypto from "node:crypto";
import { pool } from "../config/db.js";

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