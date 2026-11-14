

// Datos sueltos del Panel general del Super Administrador. Aquí solo hay SQL.

import { pool } from "../config/db.js";

// ¿Tiene esta clínica un administrador con vínculo activo? (se usa dentro de un NOT EXISTS)
const TIENE_ADMIN = `SELECT 1
                       FROM personal_clinica pa
                       JOIN usuario_roles ur ON ur.usuario_id = pa.usuario_id
                       JOIN roles r          ON r.id = ur.rol_id AND r.codigo = 'ADMINISTRADOR'
                      WHERE pa.clinica_id = c.id AND pa.estado_id = 301`;


export async function contarClinicas() {
  const [filas] = await pool.query
  (
    "SELECT COUNT(*) AS total, COALESCE(SUM(estado_id = 201), 0) AS activas FROM clinicas"
  );
  
  return { total: Number(filas[0].total), activas: Number(filas[0].activas) };
}

// Clínicas activas que no tienen administrador (las que hay que atender primero)
export async function clinicasSinAdministrador() {
  const [filas] = await pool.query(
    `SELECT c.id, c.nombre_comercial AS nombre
       FROM clinicas c
      WHERE c.estado_id = 201 AND NOT EXISTS (${TIENE_ADMIN})
      ORDER BY c.nombre_comercial`
  );
  return filas;
}

// Cuántas cuentas hay bloqueadas (103) y cuántos administradores no han activado su cuenta (101)
export async function contarCuentas() {
  const [filas] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM usuarios WHERE estado_id = 103) AS bloqueadas,
       (SELECT COUNT(DISTINCT u.id)
          FROM usuarios u
          JOIN usuario_roles ur ON ur.usuario_id = u.id
          JOIN roles r          ON r.id = ur.rol_id AND r.codigo = 'ADMINISTRADOR'
         WHERE u.estado_id = 101) AS adminsPendientes`
  );
  return { bloqueadas: Number(filas[0].bloqueadas), adminsPendientes: Number(filas[0].adminsPendientes) };
}

// Las 5 clínicas registradas más recientemente
export async function clinicasRecientes() {
  const [filas] = await pool.query(
    `SELECT c.id, c.nombre_comercial AS nombre, c.direccion, c.estado_id AS estadoId,
            c.fecha_registro AS fechaRegistro,
            NOT EXISTS (${TIENE_ADMIN}) AS sinAdministrador
       FROM clinicas c
      ORDER BY c.fecha_registro DESC
      LIMIT 5`
  );
  return filas;
}