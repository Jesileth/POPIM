//

// Cuentas de toda la red (solo lo usa el Super Administrador). Aquí solo hay SQL.

import { pool } from "../config/db.js";

// Filtros opcionales: q (nombre, correo, teléfono o cédula), rol (código) y estadoId (101–105)
export async function listar({ q, rol, estadoId }) {
  const condiciones = [];
  const valores = [];
  if (q) {
    const patron = `%${q}%`;
    condiciones.push(`(u.nombre_completo LIKE ? OR u.correo LIKE ? OR u.telefono LIKE ?
                       OR EXISTS (SELECT 1 FROM propietarios p WHERE p.usuario_id = u.id AND p.cedula LIKE ?))`);
    valores.push(patron, patron, patron, patron);
  }
  if (rol) {
    condiciones.push(`EXISTS (SELECT 1 FROM usuario_roles ur JOIN roles r ON r.id = ur.rol_id
                               WHERE ur.usuario_id = u.id AND r.codigo = ?)`);
    valores.push(rol);
  }
  if (estadoId) {
    condiciones.push("u.estado_id = ?");
    valores.push(estadoId);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";

  // Las subconsultas evitan el GROUP BY: cada fila es un usuario
  // LIMIT 200: si hay más, el Super Administrador afina la búsqueda
  const [filas] = await pool.query(
    `SELECT u.id, u.nombre_completo AS nombreCompleto, u.correo, u.telefono,
            u.estado_id AS estadoId, u.intentos_fallidos AS intentosFallidos,
            u.ultimo_acceso AS ultimoAcceso, u.fecha_registro AS fechaRegistro,
            (SELECT GROUP_CONCAT(r.codigo ORDER BY r.codigo)
               FROM usuario_roles ur JOIN roles r ON r.id = ur.rol_id
              WHERE ur.usuario_id = u.id) AS roles,
            (SELECT c.nombre_comercial
               FROM personal_clinica pc JOIN clinicas c ON c.id = pc.clinica_id
              WHERE pc.usuario_id = u.id AND pc.estado_id = 301
              LIMIT 1) AS clinica,
            (SELECT p.cedula FROM propietarios p WHERE p.usuario_id = u.id) AS cedula
       FROM usuarios u
       ${where}
      ORDER BY (u.estado_id = 103) DESC, u.nombre_completo
      LIMIT 200`,
    valores
  );
  return filas;
}

// Cuántas cuentas hay en cada estado (para los números de las pestañas)
export async function contarPorEstado() {
  const [filas] = await pool.query("SELECT estado_id AS estadoId, COUNT(*) AS total FROM usuarios GROUP BY estado_id");
  return filas;
}

// Solo desbloquea si de verdad está bloqueada (103). Devuelve false si no.
export async function desbloquear(usuarioId) {
  const [resultado] = await pool.query(
    "UPDATE usuarios SET estado_id = 102, intentos_fallidos = 0 WHERE id = ? AND estado_id = 103",
    [usuarioId]
  );
  return resultado.affectedRows === 1;
}

export async function buscar(usuarioId) {
  const [filas] = await pool.query(
    "SELECT id, nombre_completo AS nombreCompleto, estado_id AS estadoId FROM usuarios WHERE id = ?",
    [usuarioId]
  );
  return filas[0] ?? null;
}