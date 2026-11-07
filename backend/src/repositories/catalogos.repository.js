
//

import { pool } from "../config/db.js";

export async function listarEspecies() {
  const [filas] = await pool.query("SELECT id, nombre FROM especies ORDER BY id");
  return filas;
}

export async function existeEspecie(id) {
  const [filas] = await pool.query("SELECT 1 FROM especies WHERE id = ?", [id]);
  return filas.length > 0;
}

export async function listarRazasDeEspecie(especieId) {
  const [filas] = await pool.query(
    `SELECT id, nombre FROM razas
      WHERE especie_id = ?
      ORDER BY (nombre = 'Mestizo') DESC, nombre`,
    [especieId]
  );
  return filas;
}