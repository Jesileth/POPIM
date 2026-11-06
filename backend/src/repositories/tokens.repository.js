//

import { pool } from "../config/db.js";

export async function invalidarPendientes(usuarioId, proposito) {
  await pool.query(
    "UPDATE tokens_verificacion SET usado_en = NOW() WHERE usuario_id = ? AND proposito = ? AND usado_en IS NULL",
    [usuarioId, proposito]
  );
}

export async function crear({ usuarioId, proposito, codigoHash, minutos }) {
  await pool.query(
    `INSERT INTO tokens_verificacion (usuario_id, proposito, codigo_hash, expira_en)
     VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
    [usuarioId, proposito, codigoHash, minutos]
  );
}

// El último código que sigue vigente: sin usar y sin vencer
export async function buscarVigente(usuarioId, proposito) {
  const [filas] = await pool.query(
    `SELECT id, codigo_hash AS codigoHash, intentos
       FROM tokens_verificacion
      WHERE usuario_id = ? AND proposito = ? AND usado_en IS NULL AND expira_en > NOW()
      ORDER BY creado_en DESC
      LIMIT 1`,
    [usuarioId, proposito]
  );
  return filas[0] ?? null;
}

// Segundos desde el último código pedido; null si nunca ha pedido uno
export async function segundosDesdeUltimo(usuarioId, proposito) {
  const [filas] = await pool.query(
    `SELECT TIMESTAMPDIFF(SECOND, MAX(creado_en), NOW()) AS segundos
       FROM tokens_verificacion
      WHERE usuario_id = ? AND proposito = ?`,
    [usuarioId, proposito]
  );
  return filas[0].segundos;
}

export async function sumarIntento(id) {
  await pool.query("UPDATE tokens_verificacion SET intentos = intentos + 1 WHERE id = ?", [id]);
}

// Devuelve true solo si ESTA llamada fue la que lo marcó como usado
export async function marcarUsado(id, conexion = pool) {
  const [resultado] = await conexion.query(
    "UPDATE tokens_verificacion SET usado_en = NOW() WHERE id = ? AND usado_en IS NULL AND expira_en > NOW()",
    [id]
  );
  return resultado.affectedRows === 1;
}